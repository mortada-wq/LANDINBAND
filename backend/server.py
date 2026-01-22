from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Form, Response
from fastapi.responses import StreamingResponse, FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import base64
import io
import re
import json
import pdfplumber
from PIL import Image
import xml.etree.ElementTree as ET

# Gemini integration
from google import genai

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Layered Relief Art API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# File storage directory
UPLOAD_DIR = Path("/tmp/layered_art_uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
(UPLOAD_DIR / "cities").mkdir(exist_ok=True)
(UPLOAD_DIR / "styles").mkdir(exist_ok=True)
(UPLOAD_DIR / "processed").mkdir(exist_ok=True)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Admin credentials from environment (safe for public repo)
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@example.com')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'changeme123')

# Models
class AdminLogin(BaseModel):
    email: str
    password: str

class SettingsInput(BaseModel):
    gemini_api_key: Optional[str] = None

class SettingsResponse(BaseModel):
    gemini_api_key_set: bool

class StyleCreate(BaseModel):
    name: str
    description: str = ""

class StyleResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: str
    filename: str
    thumbnail: Optional[str] = None
    created_at: str

class SpacingInput(BaseModel):
    expansion_percentage: int = 0  # 0-200%

class QueueItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    city_name: str
    style_id: str
    style_name: str
    status: str  # waiting, stage1_processing, stage1_complete, spacing_applied, stage2_processing, done, error
    progress: int = 0
    expansion_percentage: Optional[int] = None
    error_message: Optional[str] = None
    created_at: str
    updated_at: str

class Poem(BaseModel):
    title: str
    content: str
    author: str = "AI Generated"
    style: str = "Free Verse"

class Art3D(BaseModel):
    model_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    type: str = "Landmark"
    description: str = ""

class RelatedArt(BaseModel):
    image_url: Optional[str] = None
    title: str = ""
    style: str = "Digital"
    description: str = ""

class ColorPalette(BaseModel):
    primary: str = "#2D5F3F"
    secondary: str = "#7A8B99"
    accent: str = "#F4A261"
    background: str = "#1A2B2D"
    text: str = "#E9ECEF"

class ProcessedCity(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    city_name: str
    style_name: str
    layer_count: int
    expansion_percentage: int
    original_aspect_ratio: str
    final_aspect_ratio: str
    created_at: str
    # New fields for enhanced City Bank
    country: Optional[str] = None
    region: Optional[str] = None
    tagline: Optional[str] = None
    status: str = "ready"  # not_started, photo_uploaded, styled, layered, ready, archived
    poems: List[Poem] = []
    art_3d: List[Art3D] = []
    related_art: List[RelatedArt] = []
    color_palette: Optional[ColorPalette] = None
    views: int = 0
    purchases: int = 0

class CityUpdateInput(BaseModel):
    country: Optional[str] = None
    region: Optional[str] = None
    tagline: Optional[str] = None
    status: Optional[str] = None
    poems: Optional[List[Poem]] = None
    art_3d: Optional[List[Art3D]] = None
    related_art: Optional[List[RelatedArt]] = None
    color_palette: Optional[ColorPalette] = None

class CityBankStats(BaseModel):
    total_cities: int
    ready_for_sale: int
    in_progress: int
    awaiting_upload: int
    archived: int
    most_popular: List[str]

# Helper functions
async def get_api_keys():
    """Get API keys from DB"""
    settings = await db.settings.find_one({}, {"_id": 0})
    return settings or {}

async def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from PDF file"""
    text_content = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages[:10]:
                text = page.extract_text()
                if text:
                    text_content.append(text)
        return "\n".join(text_content)[:5000]
    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
        return ""

def expand_horizontal_spacing(svg_content: str, expansion_percentage: int) -> dict:
    """
    Expands horizontal distance between elements in SVG uniformly
    WITHOUT distorting shapes - only X-axis translation
    
    Returns dict with new SVG and aspect ratio info
    """
    if expansion_percentage == 0:
        # Parse to get dimensions
        viewbox_match = re.search(r'viewBox="([^"]+)"', svg_content)
        if viewbox_match:
            parts = viewbox_match.group(1).split()
            if len(parts) >= 4:
                width, height = float(parts[2]), float(parts[3])
                return {
                    "svg": svg_content,
                    "original_width": width,
                    "new_width": width,
                    "height": height,
                    "original_aspect_ratio": f"{width:.0f}:{height:.0f}",
                    "new_aspect_ratio": f"{width:.0f}:{height:.0f}"
                }
        return {"svg": svg_content, "original_width": 1000, "new_width": 1000, "height": 1000}
    
    try:
        # Parse viewBox to get dimensions
        viewbox_match = re.search(r'viewBox="([^"]+)"', svg_content)
        if not viewbox_match:
            # Try width/height attributes
            width_match = re.search(r'width="(\d+)"', svg_content)
            height_match = re.search(r'height="(\d+)"', svg_content)
            orig_width = float(width_match.group(1)) if width_match else 1000
            orig_height = float(height_match.group(1)) if height_match else 1000
            min_x, min_y = 0, 0
        else:
            vb_parts = viewbox_match.group(1).split()
            min_x, min_y = float(vb_parts[0]), float(vb_parts[1])
            orig_width, orig_height = float(vb_parts[2]), float(vb_parts[3])
        
        # Calculate expansion factor
        expansion_factor = 1 + (expansion_percentage / 100)
        new_width = orig_width * expansion_factor
        center_x = orig_width / 2
        
        # Function to shift X coordinates in path data
        def shift_path_x(match):
            cmd = match.group(1)
            coords = match.group(2)
            
            # Parse coordinates
            numbers = re.findall(r'-?\d+\.?\d*', coords)
            if not numbers:
                return match.group(0)
            
            new_numbers = []
            for i, num in enumerate(numbers):
                val = float(num)
                # For commands that use X coordinates (even indices for most commands)
                if cmd.upper() in ['M', 'L', 'T'] and i % 2 == 0:
                    # Shift X based on distance from center
                    distance_from_center = val - center_x
                    new_distance = distance_from_center * expansion_factor
                    val = center_x + new_distance - distance_from_center + val
                    val = val + (distance_from_center * (expansion_factor - 1))
                new_numbers.append(f"{val:.2f}")
            
            return f"{cmd}{' '.join(new_numbers)}"
        
        # Apply transformation to all transform attributes
        def add_transform(match):
            element = match.group(0)
            # Find x position in element
            x_match = re.search(r'\bx="(-?\d+\.?\d*)"', element)
            if x_match:
                x_val = float(x_match.group(1))
                distance_from_center = x_val - center_x
                shift = distance_from_center * (expansion_factor - 1)
                new_x = x_val + shift
                element = re.sub(r'\bx="(-?\d+\.?\d*)"', f'x="{new_x:.2f}"', element)
            
            # Handle transform translate
            transform_match = re.search(r'transform="translate\((-?\d+\.?\d*)', element)
            if transform_match:
                tx = float(transform_match.group(1))
                distance_from_center = tx - center_x
                shift = distance_from_center * (expansion_factor - 1)
                new_tx = tx + shift
                element = re.sub(r'transform="translate\((-?\d+\.?\d*)', f'transform="translate({new_tx:.2f}', element)
            
            return element
        
        # Modify SVG
        modified_svg = svg_content
        
        # Update viewBox
        new_viewbox = f"{min_x} {min_y} {new_width:.2f} {orig_height}"
        if viewbox_match:
            modified_svg = re.sub(r'viewBox="[^"]+"', f'viewBox="{new_viewbox}"', modified_svg)
        
        # Update width attribute if present
        modified_svg = re.sub(r'width="(\d+)"', f'width="{int(new_width)}"', modified_svg)
        
        # Apply transforms to groups and elements with x attributes
        modified_svg = re.sub(r'<(g|rect|text|use|image)[^>]*>', add_transform, modified_svg)
        
        return {
            "svg": modified_svg,
            "original_width": orig_width,
            "new_width": new_width,
            "height": orig_height,
            "original_aspect_ratio": f"{orig_width:.0f}:{orig_height:.0f}",
            "new_aspect_ratio": f"{new_width:.0f}:{orig_height:.0f}",
            "viewbox": new_viewbox
        }
        
    except Exception as e:
        logger.error(f"Spacing expansion error: {e}")
        return {"svg": svg_content, "error": str(e)}

# API Routes

@api_router.get("/")
async def root():
    return {"message": "Layered Relief Art API - 2-Stage Gemini Process"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

@api_router.get("/docs/download")
async def download_docs():
    """Download the documentation file"""
    docs_path = Path("/app/DOCUMENTATION.md")
    if docs_path.exists():
        return FileResponse(
            docs_path,
            media_type="text/markdown",
            filename="Layered_Relief_Art_Documentation.md"
        )
    raise HTTPException(status_code=404, detail="Documentation not found")

# Admin Authentication
@api_router.post("/admin/login")
async def admin_login(login: AdminLogin):
    """Verify admin login"""
    # Log only email domain for security
    email_domain = login.email.split('@')[1] if '@' in login.email else 'unknown'
    logger.info(f"Login attempt from domain: {email_domain}")
    if login.email.lower() == ADMIN_EMAIL.lower() and login.password == ADMIN_PASSWORD:
        return {"success": True, "message": "Welcome back, Mortada!"}
    raise HTTPException(status_code=401, detail="Wrong credentials. Check your sticky note.")

# Settings (Gemini only now - no Vision API)
@api_router.post("/settings")
async def save_settings(settings: SettingsInput):
    """Save Gemini API key"""
    existing = await db.settings.find_one({}, {"_id": 0}) or {}
    
    doc = {
        "gemini_api_key": settings.gemini_api_key if settings.gemini_api_key else existing.get("gemini_api_key", ""),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.settings.delete_many({})
    await db.settings.insert_one(doc)
    
    return {"success": True, "message": "Gemini API key saved!"}

@api_router.get("/settings", response_model=SettingsResponse)
async def get_settings():
    """Get settings status"""
    settings = await get_api_keys()
    return SettingsResponse(
        gemini_api_key_set=bool(settings.get("gemini_api_key"))
    )

# Style Library
@api_router.post("/styles")
async def upload_style(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str = Form("")
):
    """Upload a style PDF"""
    if not file.content_type or "pdf" not in file.content_type.lower():
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    
    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Max 50MB please")
    
    style_id = str(uuid.uuid4())
    filename = f"{style_id}.pdf"
    filepath = UPLOAD_DIR / "styles" / filename
    with open(filepath, "wb") as f:
        f.write(content)
    
    text_preview = await extract_text_from_pdf(str(filepath))
    
    doc = {
        "id": style_id,
        "name": name,
        "description": description,
        "filename": filename,
        "filepath": str(filepath),
        "text_preview": text_preview[:500],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.styles.insert_one(doc)
    
    return {"id": style_id, "name": name, "message": "Style uploaded!"}

@api_router.get("/styles", response_model=List[StyleResponse])
async def list_styles():
    """List all styles"""
    styles = await db.styles.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [StyleResponse(**s) for s in styles]

@api_router.delete("/styles/{style_id}")
async def delete_style(style_id: str):
    """Delete a style"""
    style = await db.styles.find_one({"id": style_id}, {"_id": 0})
    if not style:
        raise HTTPException(status_code=404, detail="Style not found")
    
    filepath = Path(style.get("filepath", ""))
    if filepath.exists():
        filepath.unlink()
    
    await db.styles.delete_one({"id": style_id})
    return {"message": "Style deleted"}

# City Upload & Queue
@api_router.post("/cities/upload")
async def upload_city(
    file: UploadFile = File(...),
    city_name: str = Form(...),
    style_id: str = Form(...)
):
    """Upload a city photo and add to processing queue"""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only images allowed")
    
    style = await db.styles.find_one({"id": style_id}, {"_id": 0})
    if not style:
        raise HTTPException(status_code=404, detail="Style not found")
    
    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Max 50MB please")
    
    city_id = str(uuid.uuid4())
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{city_id}.{ext}"
    filepath = UPLOAD_DIR / "cities" / filename
    with open(filepath, "wb") as f:
        f.write(content)
    
    now = datetime.now(timezone.utc).isoformat()
    queue_doc = {
        "id": city_id,
        "city_name": city_name,
        "style_id": style_id,
        "style_name": style["name"],
        "original_filepath": str(filepath),
        "status": "waiting",
        "progress": 0,
        "expansion_percentage": None,
        "error_message": None,
        "created_at": now,
        "updated_at": now
    }
    await db.queue.insert_one(queue_doc)
    
    return {"id": city_id, "city_name": city_name, "message": "Added to queue!"}

@api_router.get("/queue", response_model=List[QueueItem])
async def get_queue():
    """Get processing queue"""
    items = await db.queue.find({}, {"_id": 0}).sort("created_at", 1).to_list(100)
    return [QueueItem(**item) for item in items]

@api_router.delete("/queue/{item_id}")
async def cancel_queue_item(item_id: str):
    """Cancel a queue item"""
    result = await db.queue.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Cancelled"}

# STAGE 1: Gemini Style Transfer
@api_router.post("/process/stage1/{city_id}")
async def process_stage1(city_id: str):
    """Stage 1: Convert photo to vector line art SVG using Gemini"""
    item = await db.queue.find_one({"id": city_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="City not found in queue")
    
    settings = await get_api_keys()
    if not settings.get("gemini_api_key"):
        raise HTTPException(status_code=400, detail="Gemini API key not configured")
    
    try:
        await db.queue.update_one(
            {"id": city_id},
            {"$set": {"status": "stage1_processing", "progress": 10, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Get style PDF text
        style = await db.styles.find_one({"id": item["style_id"]}, {"_id": 0})
        style_text = ""
        if style and style.get("filepath"):
            style_text = await extract_text_from_pdf(style["filepath"])
        
        # Read original image
        with open(item["original_filepath"], "rb") as f:
            image_bytes = f.read()
        image_b64 = base64.b64encode(image_bytes).decode()
        
        # Get image dimensions
        img = Image.open(io.BytesIO(image_bytes))
        img_width, img_height = img.size
        
        await db.queue.update_one({"id": city_id}, {"$set": {"progress": 30}})
        
        # Gemini Style Transfer
        client = genai.Client(api_key=settings["gemini_api_key"])
        
        style_instructions = f"Apply this artistic style: {style_text}" if style_text else "Use clean architectural line art style"
        
        prompt = f"""You are a vector line art specialist creating clean SVG artwork for laser cutting.

Transform this city skyline photograph into a clean vector line art SVG.

{style_instructions}

OUTPUT REQUIREMENTS:
1. Create a valid SVG file with viewBox="0 0 {img_width} {img_height}"
2. Use ONLY black strokes (stroke="#000000") on transparent/white background
3. NO fills, NO gradients, NO raster images - LINES ONLY
4. Draw clean, precise outlines of each building
5. Include architectural details (windows, edges) as simple lines
6. Make it suitable for laser cutting
7. Preserve exact positions and proportions of buildings

Return ONLY the complete SVG code starting with <?xml and ending with </svg>
Do not include any explanation or markdown - just the raw SVG."""

        # Determine MIME type from file extension
        file_ext = Path(item["original_filepath"]).suffix.lower()
        mime_types = {'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp'}
        mime_type = mime_types.get(file_ext, 'image/jpeg')
        
        # Create image content
        image_part = genai.types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
        
        result = await client.aio.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=[prompt, image_part],
            config=genai.types.GenerateContentConfig(temperature=0.7)
        )
        response = result.text
        
        await db.queue.update_one({"id": city_id}, {"$set": {"progress": 70}})
        
        # Extract SVG from response
        svg_content = response.strip()
        
        # Clean up response if needed
        if "```" in svg_content:
            # Extract SVG from markdown code block
            svg_match = re.search(r'```(?:svg|xml)?\s*([\s\S]*?)```', svg_content)
            if svg_match:
                svg_content = svg_match.group(1).strip()
        
        # Ensure it starts with XML declaration or SVG tag
        if not svg_content.startswith('<?xml') and not svg_content.startswith('<svg'):
            # Try to find SVG content
            svg_start = svg_content.find('<svg')
            if svg_start != -1:
                svg_content = svg_content[svg_start:]
        
        # Add XML declaration if missing
        if not svg_content.startswith('<?xml'):
            svg_content = '<?xml version="1.0" encoding="UTF-8"?>\n' + svg_content
        
        # Save Stage 1 SVG
        stage1_filename = f"{city_id}_stage1.svg"
        stage1_filepath = UPLOAD_DIR / "processed" / stage1_filename
        with open(stage1_filepath, "w") as f:
            f.write(svg_content)
        
        # Update queue
        await db.queue.update_one(
            {"id": city_id},
            {"$set": {
                "status": "stage1_complete",
                "progress": 100,
                "stage1_svg_path": str(stage1_filepath),
                "original_width": img_width,
                "original_height": img_height,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {
            "status": "stage1_complete",
            "city_id": city_id,
            "message": "Stage 1 complete - Vector line art generated!",
            "next_step": "adjust_spacing",
            "original_dimensions": {"width": img_width, "height": img_height}
        }
        
    except Exception as e:
        logger.error(f"Stage 1 error: {e}")
        await db.queue.update_one(
            {"id": city_id},
            {"$set": {"status": "error", "error_message": str(e), "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        raise HTTPException(status_code=500, detail=str(e))

# Get Stage 1 SVG preview
@api_router.get("/process/stage1/{city_id}/preview")
async def get_stage1_preview(city_id: str):
    """Get Stage 1 SVG content for preview"""
    item = await db.queue.find_one({"id": city_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="City not found")
    
    if not item.get("stage1_svg_path"):
        raise HTTPException(status_code=400, detail="Stage 1 not complete yet")
    
    svg_path = Path(item["stage1_svg_path"])
    if not svg_path.exists():
        raise HTTPException(status_code=404, detail="SVG file not found")
    
    with open(svg_path, "r") as f:
        svg_content = f.read()
    
    return {
        "svg": svg_content,
        "original_width": item.get("original_width", 1000),
        "original_height": item.get("original_height", 1000)
    }

# Apply Spacing
@api_router.post("/process/spacing/{city_id}")
async def apply_spacing(city_id: str, spacing: SpacingInput):
    """Apply horizontal spacing expansion to Stage 1 SVG"""
    item = await db.queue.find_one({"id": city_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="City not found")
    
    if item.get("status") not in ["stage1_complete", "spacing_applied"]:
        raise HTTPException(status_code=400, detail="Complete Stage 1 first")
    
    if not item.get("stage1_svg_path"):
        raise HTTPException(status_code=400, detail="Stage 1 SVG not found")
    
    try:
        # Read Stage 1 SVG
        with open(item["stage1_svg_path"], "r") as f:
            stage1_svg = f.read()
        
        # Apply spacing expansion
        result = expand_horizontal_spacing(stage1_svg, spacing.expansion_percentage)
        
        # Save spaced SVG
        spaced_filename = f"{city_id}_spaced.svg"
        spaced_filepath = UPLOAD_DIR / "processed" / spaced_filename
        with open(spaced_filepath, "w") as f:
            f.write(result["svg"])
        
        # Update queue
        await db.queue.update_one(
            {"id": city_id},
            {"$set": {
                "status": "spacing_applied",
                "expansion_percentage": spacing.expansion_percentage,
                "spaced_svg_path": str(spaced_filepath),
                "new_width": result.get("new_width"),
                "original_aspect_ratio": result.get("original_aspect_ratio"),
                "new_aspect_ratio": result.get("new_aspect_ratio"),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {
            "status": "spacing_applied",
            "expansion_percentage": spacing.expansion_percentage,
            "original_aspect_ratio": result.get("original_aspect_ratio"),
            "new_aspect_ratio": result.get("new_aspect_ratio"),
            "new_width": result.get("new_width"),
            "ready_for_stage2": True
        }
        
    except Exception as e:
        logger.error(f"Spacing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Get Spaced SVG preview
@api_router.get("/process/spacing/{city_id}/preview")
async def get_spaced_preview(city_id: str):
    """Get spaced SVG content for preview"""
    item = await db.queue.find_one({"id": city_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="City not found")
    
    svg_path = item.get("spaced_svg_path") or item.get("stage1_svg_path")
    if not svg_path:
        raise HTTPException(status_code=400, detail="No SVG available")
    
    with open(svg_path, "r") as f:
        svg_content = f.read()
    
    return {
        "svg": svg_content,
        "expansion_percentage": item.get("expansion_percentage", 0),
        "new_aspect_ratio": item.get("new_aspect_ratio")
    }

# STAGE 2: Gemini Layer Separation
@api_router.post("/process/stage2/{city_id}")
async def process_stage2(city_id: str):
    """Stage 2: Use Gemini to separate SVG into 3 layers based on building height"""
    item = await db.queue.find_one({"id": city_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="City not found")
    
    if item.get("status") not in ["spacing_applied", "stage1_complete"]:
        raise HTTPException(status_code=400, detail="Complete spacing adjustment first")
    
    settings = await get_api_keys()
    if not settings.get("gemini_api_key"):
        raise HTTPException(status_code=400, detail="Gemini API key not configured")
    
    try:
        await db.queue.update_one(
            {"id": city_id},
            {"$set": {"status": "stage2_processing", "progress": 10, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Get the spaced SVG (or stage1 if no spacing applied)
        svg_path = item.get("spaced_svg_path") or item.get("stage1_svg_path")
        with open(svg_path, "r") as f:
            input_svg = f.read()
        
        # Get viewBox for prompt
        viewbox_match = re.search(r'viewBox="([^"]+)"', input_svg)
        viewbox = viewbox_match.group(1) if viewbox_match else "0 0 1000 1000"
        
        await db.queue.update_one({"id": city_id}, {"$set": {"progress": 30}})
        
        # Gemini Layer Separation
        client = genai.Client(api_key=settings["gemini_api_key"])
        
        prompt = f"""You are an expert at analyzing city skyline SVG artwork and separating buildings into depth layers for laser cutting.

You are analyzing a city skyline vector line art SVG for laser cutting.

INPUT SVG:
{input_svg}

TASK: Create THREE separate SVG layers based on building HEIGHT.

MEASUREMENT SYSTEM:
- Street level (bottom) = 0
- Tallest building in this skyline = 10
- Measure each building's height on this 0-10 scale

LAYER SEPARATION RULES:

LAYER 1 (Nearest/Foreground):
- Include ONLY buildings with height 0-3 (shortest buildings)
- Delete all buildings taller than 3
- For buildings partially visible, EXTEND them down to street level
- Complete hidden portions with matching line style
- Keep exact X positions - DO NOT shift horizontally

LAYER 2 (Middle):
- Include ONLY buildings with height 3.01-6 (medium buildings)
- Delete buildings ≤3 AND buildings >6
- Extend partially visible buildings to street level
- Keep exact X positions

LAYER 3 (Farthest/Background):
- Include ONLY buildings with height >6 (tallest buildings/skyscrapers)
- Delete all buildings ≤6
- Extend partially visible buildings to street level
- Keep exact X positions

CRITICAL REQUIREMENTS:
1. Each layer must have viewBox="{viewbox}"
2. DO NOT move buildings horizontally
3. DO NOT change building widths or shapes
4. Use stroke="#000000" and fill="none"
5. Each SVG must be complete and valid
6. Include XML declaration

OUTPUT FORMAT (JSON):
Return ONLY a JSON object with three SVG strings:
{{"layer_1": "<complete SVG>", "layer_2": "<complete SVG>", "layer_3": "<complete SVG>"}}

No explanation, no markdown - just the JSON object."""

        result = await client.aio.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=prompt,
            config=genai.types.GenerateContentConfig(temperature=0.3)
        )
        response = result.text
        
        await db.queue.update_one({"id": city_id}, {"$set": {"progress": 70}})
        
        # Parse response
        response_text = response.strip()
        
        # Clean up markdown if present
        if "```" in response_text:
            json_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', response_text)
            if json_match:
                response_text = json_match.group(1).strip()
        
        # Try to extract JSON
        try:
            # Find JSON object
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                response_text = response_text[json_start:json_end]
            
            layers_data = json.loads(response_text)
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}, response: {response_text[:500]}")
            # Fallback: create simple layers from input
            layers_data = {
                "layer_1": input_svg,
                "layer_2": input_svg,
                "layer_3": input_svg
            }
        
        # Save layer SVGs
        layer_paths = {}
        for layer_num in [1, 2, 3]:
            layer_key = f"layer_{layer_num}"
            svg_content = layers_data.get(layer_key, layers_data.get(f"layer{layer_num}", ""))
            
            if not svg_content:
                svg_content = input_svg  # Fallback
            
            # Ensure valid SVG
            if not svg_content.startswith('<?xml'):
                svg_content = '<?xml version="1.0" encoding="UTF-8"?>\n' + svg_content
            
            filename = f"{city_id}_layer_{layer_num}.svg"
            filepath = UPLOAD_DIR / "processed" / filename
            with open(filepath, "w") as f:
                f.write(svg_content)
            layer_paths[layer_key] = str(filepath)
        
        await db.queue.update_one({"id": city_id}, {"$set": {"progress": 90}})
        
        # Move to processed collection
        now = datetime.now(timezone.utc).isoformat()
        processed_doc = {
            "id": city_id,
            "city_name": item["city_name"],
            "style_id": item["style_id"],
            "style_name": item["style_name"],
            "original_filepath": item["original_filepath"],
            "stage1_svg_path": item.get("stage1_svg_path"),
            "spaced_svg_path": item.get("spaced_svg_path"),
            "layer_1_path": layer_paths["layer_1"],
            "layer_2_path": layer_paths["layer_2"],
            "layer_3_path": layer_paths["layer_3"],
            "layer_count": 3,
            "expansion_percentage": item.get("expansion_percentage", 0),
            "original_width": item.get("original_width"),
            "original_height": item.get("original_height"),
            "new_width": item.get("new_width"),
            "original_aspect_ratio": item.get("original_aspect_ratio", ""),
            "new_aspect_ratio": item.get("new_aspect_ratio", ""),
            "created_at": item["created_at"],
            "processed_at": now
        }
        await db.processed.insert_one(processed_doc)
        
        # Update queue status
        await db.queue.update_one(
            {"id": city_id},
            {"$set": {"status": "done", "progress": 100, "updated_at": now}}
        )
        
        return {
            "status": "complete",
            "city_id": city_id,
            "message": "All 3 layers generated!",
            "layer_count": 3
        }
        
    except Exception as e:
        logger.error(f"Stage 2 error: {e}")
        await db.queue.update_one(
            {"id": city_id},
            {"$set": {"status": "error", "error_message": str(e), "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        raise HTTPException(status_code=500, detail=str(e))

# Public API - Processed Cities
@api_router.get("/cities")
async def list_cities():
    """List all processed cities"""
    cities = await db.processed.find({}, {"_id": 0}).sort("processed_at", -1).to_list(100)
    return [{
        "id": c["id"],
        "city_name": c["city_name"],
        "style_name": c["style_name"],
        "layer_count": c["layer_count"],
        "expansion_percentage": c.get("expansion_percentage", 0),
        "created_at": c.get("processed_at", c.get("created_at"))
    } for c in cities]

@api_router.get("/cities/search")
async def search_cities(q: str):
    """Search for a city by name"""
    cities = await db.processed.find(
        {"city_name": {"$regex": q, "$options": "i"}},
        {"_id": 0}
    ).to_list(20)
    
    if not cities:
        all_cities = await db.processed.find({}, {"_id": 0, "city_name": 1, "id": 1}).to_list(100)
        return {"found": False, "message": f"Sorry, we don't have '{q}' yet", "suggestions": all_cities[:6]}
    
    return {"found": True, "cities": cities}

@api_router.get("/cities/{city_id}")
async def get_city(city_id: str):
    """Get a processed city by ID"""
    city = await db.processed.find_one({"id": city_id}, {"_id": 0})
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    return city

@api_router.get("/cities/{city_id}/layer/{layer_num}")
async def download_layer(city_id: str, layer_num: int):
    """Download a specific layer SVG"""
    if layer_num not in [1, 2, 3]:
        raise HTTPException(status_code=400, detail="Layer must be 1, 2, or 3")
    
    city = await db.processed.find_one({"id": city_id}, {"_id": 0})
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    
    layer_path = Path(city.get(f"layer_{layer_num}_path", ""))
    if not layer_path.exists():
        raise HTTPException(status_code=404, detail=f"Layer {layer_num} not found")
    
    return FileResponse(
        layer_path,
        media_type="image/svg+xml",
        filename=f"{city['city_name'].replace(' ', '_')}_layer_{layer_num}.svg"
    )

@api_router.get("/cities/{city_id}/all-layers")
async def download_all_layers(city_id: str):
    """Get all layer paths for download"""
    city = await db.processed.find_one({"id": city_id}, {"_id": 0})
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    
    return {
        "city_name": city["city_name"],
        "layers": {
            "layer_1": f"/api/cities/{city_id}/layer/1",
            "layer_2": f"/api/cities/{city_id}/layer/2",
            "layer_3": f"/api/cities/{city_id}/layer/3"
        }
    }

@api_router.get("/cities/{city_id}/stage1")
async def get_stage1_svg(city_id: str):
    """Get Stage 1 SVG (single layer)"""
    city = await db.processed.find_one({"id": city_id}, {"_id": 0})
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    
    svg_path = Path(city.get("stage1_svg_path", ""))
    if not svg_path.exists():
        raise HTTPException(status_code=404, detail="Stage 1 SVG not found")
    
    return FileResponse(
        svg_path,
        media_type="image/svg+xml",
        filename=f"{city['city_name'].replace(' ', '_')}_stage1.svg"
    )

# Featured cities
@api_router.get("/featured")
async def get_featured():
    """Get featured cities for homepage"""
    cities = await db.processed.find({}, {"_id": 0}).sort("processed_at", -1).to_list(9)
    return [{
        "id": c["id"],
        "city_name": c["city_name"],
        "style_name": c["style_name"],
        "layer_count": c["layer_count"],
        "expansion_percentage": c.get("expansion_percentage", 0)
    } for c in cities]

# City Bank Stats
@api_router.get("/citybank/stats", response_model=CityBankStats)
async def get_citybank_stats():
    """Get City Bank overview statistics"""
    all_cities = await db.processed.find({}, {"_id": 0}).to_list(1000)
    
    total = len(all_cities)
    ready = sum(1 for c in all_cities if c.get("status", "ready") == "ready")
    in_progress = sum(1 for c in all_cities if c.get("status") in ["styled", "layered", "photo_uploaded"])
    awaiting = sum(1 for c in all_cities if c.get("status") == "not_started")
    archived = sum(1 for c in all_cities if c.get("status") == "archived")
    
    # Get most viewed cities
    sorted_by_views = sorted(all_cities, key=lambda x: x.get("views", 0), reverse=True)
    most_popular = [c["city_name"] for c in sorted_by_views[:3]] if sorted_by_views else []
    
    return CityBankStats(
        total_cities=total,
        ready_for_sale=ready,
        in_progress=in_progress,
        awaiting_upload=awaiting,
        archived=archived,
        most_popular=most_popular
    )

# City Bank - Full list with filters
@api_router.get("/citybank/cities")
async def list_citybank_cities(
    status: Optional[str] = None,
    region: Optional[str] = None,
    style: Optional[str] = None,
    search: Optional[str] = None
):
    """List all cities with optional filters for City Bank admin"""
    query = {}
    
    if status:
        query["status"] = status
    if region:
        query["region"] = {"$regex": region, "$options": "i"}
    if style:
        query["style_name"] = {"$regex": style, "$options": "i"}
    if search:
        query["city_name"] = {"$regex": search, "$options": "i"}
    
    cities = await db.processed.find(query, {"_id": 0}).sort("processed_at", -1).to_list(500)
    
    return [{
        "id": c["id"],
        "city_name": c["city_name"],
        "country": c.get("country", ""),
        "region": c.get("region", ""),
        "tagline": c.get("tagline", ""),
        "style_name": c["style_name"],
        "layer_count": c["layer_count"],
        "status": c.get("status", "ready"),
        "expansion_percentage": c.get("expansion_percentage", 0),
        "views": c.get("views", 0),
        "purchases": c.get("purchases", 0),
        "poems_count": len(c.get("poems", [])),
        "art_3d_count": len(c.get("art_3d", [])),
        "related_art_count": len(c.get("related_art", [])),
        "has_color_palette": c.get("color_palette") is not None,
        "created_at": c.get("processed_at", c.get("created_at"))
    } for c in cities]

# City Bank - Update city details
@api_router.patch("/citybank/cities/{city_id}")
async def update_city_details(city_id: str, update: CityUpdateInput):
    """Update city details for City Bank"""
    city = await db.processed.find_one({"id": city_id}, {"_id": 0})
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    
    update_data = {}
    if update.country is not None:
        update_data["country"] = update.country
    if update.region is not None:
        update_data["region"] = update.region
    if update.tagline is not None:
        update_data["tagline"] = update.tagline
    if update.status is not None:
        update_data["status"] = update.status
    if update.poems is not None:
        update_data["poems"] = [p.model_dump() for p in update.poems]
    if update.art_3d is not None:
        update_data["art_3d"] = [a.model_dump() for a in update.art_3d]
    if update.related_art is not None:
        update_data["related_art"] = [a.model_dump() for a in update.related_art]
    if update.color_palette is not None:
        update_data["color_palette"] = update.color_palette.model_dump()
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.processed.update_one({"id": city_id}, {"$set": update_data})
    
    return {"success": True, "message": "City updated"}

# City Bank - Archive city
@api_router.post("/citybank/cities/{city_id}/archive")
async def archive_city(city_id: str):
    """Archive a city (remove from active catalog)"""
    city = await db.processed.find_one({"id": city_id}, {"_id": 0})
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    
    await db.processed.update_one(
        {"id": city_id},
        {"$set": {"status": "archived", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True, "message": f"{city['city_name']} archived"}

# City Bank - Restore city
@api_router.post("/citybank/cities/{city_id}/restore")
async def restore_city(city_id: str):
    """Restore an archived city"""
    city = await db.processed.find_one({"id": city_id}, {"_id": 0})
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    
    await db.processed.update_one(
        {"id": city_id},
        {"$set": {"status": "ready", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True, "message": f"{city['city_name']} restored"}

# City Bank - Delete city permanently
@api_router.delete("/citybank/cities/{city_id}")
async def delete_city_permanently(city_id: str):
    """Permanently delete a city"""
    city = await db.processed.find_one({"id": city_id}, {"_id": 0})
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    
    # Delete associated files
    for key in ["layer_1_path", "layer_2_path", "layer_3_path", "stage1_svg_path", "spaced_svg_path", "original_filepath"]:
        if city.get(key):
            try:
                Path(city[key]).unlink(missing_ok=True)
            except Exception as e:
                logger.warning(f"Could not delete file {city[key]}: {e}")
    
    await db.processed.delete_one({"id": city_id})
    return {"success": True, "message": f"{city['city_name']} deleted permanently"}

# City Bank - Bulk archive
@api_router.post("/citybank/bulk/archive")
async def bulk_archive_cities(city_ids: List[str]):
    """Archive multiple cities"""
    result = await db.processed.update_many(
        {"id": {"$in": city_ids}},
        {"$set": {"status": "archived", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True, "archived_count": result.modified_count}

# City Bank - Get city with full immersive data
@api_router.get("/citybank/cities/{city_id}/full")
async def get_city_full_data(city_id: str):
    """Get complete city data for immersive page"""
    city = await db.processed.find_one({"id": city_id}, {"_id": 0})
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    
    # Increment view count
    await db.processed.update_one({"id": city_id}, {"$inc": {"views": 1}})
    
    return city

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
