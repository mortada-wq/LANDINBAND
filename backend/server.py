from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Form, Depends, Response
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
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
import asyncio
import pdfplumber
from PIL import Image, ImageDraw, ImageFilter
import secrets
import traceback

# Gemini integration
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

# Google Cloud Vision
from google.cloud import vision_v1

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

# Hardcoded admin credentials
ADMIN_EMAIL = "Mortada@howvier.com"
ADMIN_PASSWORD = "Mo1982#"

security = HTTPBasic()

# Models
class AdminLogin(BaseModel):
    email: str
    password: str

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

class CityCreate(BaseModel):
    name: str
    style_id: str

class QueueItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    city_name: str
    style_id: str
    style_name: str
    status: str  # waiting, stylizing, detecting, creating_svg, done, error
    progress: int = 0
    error_message: Optional[str] = None
    created_at: str
    updated_at: str

class ProcessedCity(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    city_name: str
    style_name: str
    building_count: int
    layer_count: int
    original_image_path: str
    styled_image_path: str
    svg_path: str
    png_preview_path: str
    buildings: List[dict]
    processing_time_seconds: float
    created_at: str

class SettingsInput(BaseModel):
    gemini_api_key: Optional[str] = None
    vision_api_key: Optional[str] = None

class SettingsResponse(BaseModel):
    gemini_api_key_set: bool
    vision_api_key_set: bool

# Helper functions
def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    """Verify admin credentials"""
    is_correct_email = secrets.compare_digest(credentials.username.lower(), ADMIN_EMAIL.lower())
    is_correct_password = secrets.compare_digest(credentials.password, ADMIN_PASSWORD)
    if not (is_correct_email and is_correct_password):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

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

def generate_simple_svg(buildings: List[dict], image_width: int, image_height: int) -> str:
    """Generate a laser-ready SVG with buildings on separate layers"""
    svg_parts = [
        f'<?xml version="1.0" encoding="UTF-8"?>',
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{image_width}" height="{image_height}" viewBox="0 0 {image_width} {image_height}">',
        f'  <rect width="100%" height="100%" fill="white"/>',
    ]
    
    # Sort buildings by size (area) - largest first (front layer)
    sorted_buildings = sorted(buildings, key=lambda b: b.get('area', 0), reverse=True)
    
    # Assign layers
    for i, building in enumerate(sorted_buildings):
        layer_num = i + 1
        building['layer'] = layer_num
    
    # Create SVG groups for each layer (back to front for proper rendering)
    for building in reversed(sorted_buildings):
        layer = building.get('layer', 1)
        vertices = building.get('vertices', [])
        name = building.get('name', f'Building {layer}')
        
        if len(vertices) >= 4:
            # Create path from vertices
            path_d = f"M {vertices[0]['x']} {vertices[0]['y']}"
            for v in vertices[1:]:
                path_d += f" L {v['x']} {v['y']}"
            path_d += " Z"
            
            svg_parts.append(f'  <g id="layer-{layer}" data-layer="{layer}" data-name="{name}">')
            svg_parts.append(f'    <path d="{path_d}" fill="none" stroke="black" stroke-width="2"/>')
            svg_parts.append(f'  </g>')
    
    svg_parts.append('</svg>')
    return '\n'.join(svg_parts)

# API Routes

@api_router.get("/")
async def root():
    return {"message": "Layered Relief Art API - Ready to make art!"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Admin Authentication
@api_router.post("/admin/login")
async def admin_login(login: AdminLogin):
    """Verify admin login"""
    if login.email.lower() == ADMIN_EMAIL.lower() and login.password == ADMIN_PASSWORD:
        return {"success": True, "message": "Welcome back, Mortada!"}
    raise HTTPException(status_code=401, detail="Wrong credentials. Check your sticky note.")

# Settings
@api_router.post("/settings")
async def save_settings(settings: SettingsInput):
    """Save API keys - can save one at a time"""
    # Get existing settings first
    existing = await db.settings.find_one({}, {"_id": 0}) or {}
    
    # Only update the key that was provided
    doc = {
        "gemini_api_key": settings.gemini_api_key if settings.gemini_api_key else existing.get("gemini_api_key", ""),
        "vision_api_key": settings.vision_api_key if settings.vision_api_key else existing.get("vision_api_key", ""),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.settings.delete_many({})
    await db.settings.insert_one(doc)
    
    # Tell user which key was saved
    saved_keys = []
    if settings.gemini_api_key:
        saved_keys.append("Gemini")
    if settings.vision_api_key:
        saved_keys.append("Vision")
    
    return {"success": True, "message": f"{' & '.join(saved_keys)} API key saved!"}

@api_router.get("/settings", response_model=SettingsResponse)
async def get_settings():
    """Get settings status"""
    settings = await get_api_keys()
    return SettingsResponse(
        gemini_api_key_set=bool(settings.get("gemini_api_key")),
        vision_api_key_set=bool(settings.get("vision_api_key"))
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
    
    # Save file
    style_id = str(uuid.uuid4())
    filename = f"{style_id}.pdf"
    filepath = UPLOAD_DIR / "styles" / filename
    with open(filepath, "wb") as f:
        f.write(content)
    
    # Extract text preview
    text_preview = await extract_text_from_pdf(str(filepath))
    
    # Save to DB
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
    
    # Delete file
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
    
    # Verify style exists
    style = await db.styles.find_one({"id": style_id}, {"_id": 0})
    if not style:
        raise HTTPException(status_code=404, detail="Style not found")
    
    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Max 50MB please")
    
    # Save file
    city_id = str(uuid.uuid4())
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{city_id}.{ext}"
    filepath = UPLOAD_DIR / "cities" / filename
    with open(filepath, "wb") as f:
        f.write(content)
    
    # Add to queue
    now = datetime.now(timezone.utc).isoformat()
    queue_doc = {
        "id": city_id,
        "city_name": city_name,
        "style_id": style_id,
        "style_name": style["name"],
        "original_filepath": str(filepath),
        "status": "waiting",
        "progress": 0,
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

@api_router.post("/queue/process-next")
async def process_next():
    """Process the next item in queue"""
    # Get next waiting item
    item = await db.queue.find_one({"status": "waiting"}, {"_id": 0})
    if not item:
        return {"message": "Queue is empty!", "processed": False}
    
    item_id = item["id"]
    
    try:
        # Get API keys
        settings = await get_api_keys()
        if not settings.get("gemini_api_key"):
            raise HTTPException(status_code=400, detail="Gemini API key not configured")
        if not settings.get("vision_api_key"):
            raise HTTPException(status_code=400, detail="Vision API key not configured")
        
        start_time = datetime.now()
        
        # Update status: Stylizing
        await db.queue.update_one(
            {"id": item_id},
            {"$set": {"status": "stylizing", "progress": 10, "updated_at": datetime.now(timezone.utc).isoformat()}}
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
        
        # Step A: Style Transfer with Gemini
        await db.queue.update_one(
            {"id": item_id},
            {"$set": {"progress": 20}}
        )
        
        chat = LlmChat(
            api_key=settings["gemini_api_key"],
            session_id=f"style-{item_id}",
            system_message="You are a vector line art specialist. Create clean, precise line drawings suitable for laser cutting."
        )
        chat.with_model("gemini", "gemini-3-pro-image-preview").with_params(modalities=["image", "text"])
        
        style_instructions = f"Apply this artistic style: {style_text}" if style_text else "Use clean architectural line art style"
        prompt = f"""Transform this city skyline photograph into a clean vector line drawing.

{style_instructions}

CRITICAL REQUIREMENTS:
1. Output MUST be white background with black lines ONLY
2. Draw clean, precise outlines of each building
3. Include window patterns and architectural details as simple lines
4. NO shading, NO gradients, NO fills - LINES ONLY
5. Make it suitable for laser cutting
6. Preserve the exact positions and proportions of buildings"""

        msg = UserMessage(text=prompt, file_contents=[ImageContent(image_b64)])
        text_response, images = await chat.send_message_multimodal_response(msg)
        
        if not images:
            raise Exception("Gemini didn't generate an image. Try a different style.")
        
        # Save styled image
        styled_filename = f"{item_id}_styled.png"
        styled_filepath = UPLOAD_DIR / "processed" / styled_filename
        styled_bytes = base64.b64decode(images[0]["data"])
        with open(styled_filepath, "wb") as f:
            f.write(styled_bytes)
        
        await db.queue.update_one(
            {"id": item_id},
            {"$set": {"status": "detecting", "progress": 50, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Step B: Building Detection with Vision API
        client_options = {"api_key": settings["vision_api_key"]}
        vision_client = vision_v1.ImageAnnotatorClient(client_options=client_options)
        
        # Use original image for detection (better accuracy)
        vision_image = vision_v1.Image(content=image_bytes)
        response = vision_client.object_localization(image=vision_image)
        
        if response.error.message:
            raise Exception(f"Vision API error: {response.error.message}")
        
        # Process detections
        buildings = []
        building_terms = ["building", "skyscraper", "tower", "house", "structure", "architecture", "high-rise"]
        
        for i, obj in enumerate(response.localized_object_annotations):
            obj_name = obj.name.lower()
            is_building = any(term in obj_name for term in building_terms)
            
            if is_building or obj.score > 0.6:  # Include high-confidence objects
                vertices = []
                for vertex in obj.bounding_poly.normalized_vertices:
                    vertices.append({
                        "x": int(vertex.x * img_width),
                        "y": int(vertex.y * img_height)
                    })
                
                # Calculate area for sorting
                if len(vertices) >= 4:
                    width = abs(vertices[2]["x"] - vertices[0]["x"])
                    height = abs(vertices[2]["y"] - vertices[0]["y"])
                    area = width * height
                else:
                    area = 0
                
                buildings.append({
                    "name": f"Building {len(buildings) + 1}",
                    "original_name": obj.name,
                    "confidence": obj.score,
                    "vertices": vertices,
                    "area": area
                })
        
        # If no buildings detected, create default layers based on image regions
        if len(buildings) == 0:
            third_height = img_height // 3
            buildings = [
                {
                    "name": "Background Layer",
                    "vertices": [{"x": 0, "y": 0}, {"x": img_width, "y": 0}, {"x": img_width, "y": third_height}, {"x": 0, "y": third_height}],
                    "area": img_width * third_height
                },
                {
                    "name": "Middle Layer", 
                    "vertices": [{"x": 0, "y": third_height}, {"x": img_width, "y": third_height}, {"x": img_width, "y": 2*third_height}, {"x": 0, "y": 2*third_height}],
                    "area": img_width * third_height
                },
                {
                    "name": "Foreground Layer",
                    "vertices": [{"x": 0, "y": 2*third_height}, {"x": img_width, "y": 2*third_height}, {"x": img_width, "y": img_height}, {"x": 0, "y": img_height}],
                    "area": img_width * third_height
                }
            ]
        
        await db.queue.update_one(
            {"id": item_id},
            {"$set": {"status": "creating_svg", "progress": 75, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Step C: Generate SVG
        svg_content = generate_simple_svg(buildings, img_width, img_height)
        svg_filename = f"{item_id}.svg"
        svg_filepath = UPLOAD_DIR / "processed" / svg_filename
        with open(svg_filepath, "w") as f:
            f.write(svg_content)
        
        # Create PNG preview from styled image
        preview_filename = f"{item_id}_preview.png"
        preview_filepath = UPLOAD_DIR / "processed" / preview_filename
        styled_img = Image.open(styled_filepath)
        styled_img.thumbnail((800, 800))
        styled_img.save(preview_filepath, "PNG")
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # Step D: Save to processed collection
        processed_doc = {
            "id": item_id,
            "city_name": item["city_name"],
            "style_id": item["style_id"],
            "style_name": item["style_name"],
            "building_count": len(buildings),
            "layer_count": len(buildings),
            "original_image_path": item["original_filepath"],
            "styled_image_path": str(styled_filepath),
            "svg_path": str(svg_filepath),
            "png_preview_path": str(preview_filepath),
            "buildings": buildings,
            "processing_time_seconds": processing_time,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.processed.insert_one(processed_doc)
        
        # Update queue status
        await db.queue.update_one(
            {"id": item_id},
            {"$set": {"status": "done", "progress": 100, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        return {
            "message": f"Processed {item['city_name']}!",
            "processed": True,
            "city_id": item_id,
            "building_count": len(buildings),
            "processing_time": f"{processing_time:.1f}s"
        }
        
    except Exception as e:
        logger.error(f"Processing error: {e}\n{traceback.format_exc()}")
        await db.queue.update_one(
            {"id": item_id},
            {"$set": {"status": "error", "error_message": str(e), "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        raise HTTPException(status_code=500, detail=str(e))

# Public API - Processed Cities
@api_router.get("/cities")
async def list_cities():
    """List all processed cities (for public site)"""
    cities = await db.processed.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    # Return simplified data for listing
    return [{
        "id": c["id"],
        "city_name": c["city_name"],
        "style_name": c["style_name"],
        "building_count": c["building_count"],
        "layer_count": c["layer_count"],
        "created_at": c["created_at"]
    } for c in cities]

@api_router.get("/cities/search")
async def search_cities(q: str):
    """Search for a city by name"""
    # Case-insensitive search
    cities = await db.processed.find(
        {"city_name": {"$regex": q, "$options": "i"}},
        {"_id": 0}
    ).to_list(20)
    
    if not cities:
        # Find similar cities
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

@api_router.get("/cities/{city_id}/svg")
async def download_svg(city_id: str):
    """Download city SVG file"""
    city = await db.processed.find_one({"id": city_id}, {"_id": 0})
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    
    svg_path = Path(city["svg_path"])
    if not svg_path.exists():
        raise HTTPException(status_code=404, detail="SVG file not found")
    
    return FileResponse(
        svg_path,
        media_type="image/svg+xml",
        filename=f"{city['city_name'].replace(' ', '_')}_layered.svg"
    )

@api_router.get("/cities/{city_id}/png")
async def download_png(city_id: str):
    """Download city PNG preview"""
    city = await db.processed.find_one({"id": city_id}, {"_id": 0})
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    
    png_path = Path(city["png_preview_path"])
    if not png_path.exists():
        raise HTTPException(status_code=404, detail="PNG file not found")
    
    return FileResponse(
        png_path,
        media_type="image/png",
        filename=f"{city['city_name'].replace(' ', '_')}_preview.png"
    )

@api_router.get("/cities/{city_id}/styled")
async def get_styled_image(city_id: str):
    """Get the styled image"""
    city = await db.processed.find_one({"id": city_id}, {"_id": 0})
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    
    styled_path = Path(city["styled_image_path"])
    if not styled_path.exists():
        raise HTTPException(status_code=404, detail="Styled image not found")
    
    return FileResponse(styled_path, media_type="image/png")

# Featured cities
@api_router.get("/featured")
async def get_featured():
    """Get featured cities for homepage"""
    cities = await db.processed.find({}, {"_id": 0}).sort("created_at", -1).to_list(9)
    return [{
        "id": c["id"],
        "city_name": c["city_name"],
        "style_name": c["style_name"],
        "layer_count": c["layer_count"]
    } for c in cities]

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
