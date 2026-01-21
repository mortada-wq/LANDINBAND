# Layered Relief Art App - Technical Documentation

## 📋 Executive Summary

**App Name:** Layered Relief Art App  
**Purpose:** Transform city skyline photographs into laser-ready layered vector art  
**Target Users:** Laser cutting enthusiasts, artists, makers, architects  
**Output:** Multi-layer SVG files optimized for CNC/laser cutting machines

---

## 🎯 What This App Does

The Layered Relief Art App takes a **photorealistic city skyline image** and converts it into a **layered vector art file** suitable for laser cutting or CNC machining. The final output creates a 3D relief effect when layers are cut from different materials and stacked together.

### The Transformation Pipeline

```
[City Photo] → [AI Style Transfer] → [Vector Line Art] → [Building Detection] → [Layer Separation] → [Laser-Ready SVG]
```

### Key Value Proposition

1. **Automated Conversion** - No manual tracing required
2. **AI-Powered** - Uses Google Gemini for artistic transformation
3. **Smart Layering** - Buildings automatically sorted by depth
4. **Laser-Ready Output** - SVG files with proper structure for cutting software

---

## 👥 User Roles

### 1. Admin (You - Mortada)
- Upload city photographs
- Manage style library (PDF style guides)
- Monitor processing queue
- View completed cities in City Bank

### 2. Public Users
- Search for available cities
- Preview layered artwork
- Download SVG/PNG files
- No registration required

---

## 🔄 Complete Workflow

### Phase 1: Admin Uploads City

```
Admin Login → Upload City Photo → Select Style → Add to Queue → Click "Process Next"
```

**Steps:**
1. Login with credentials (`Mortada@howvier.com` / `Mo1982#`)
2. Go to "Upload City" tab
3. Drag & drop a high-quality city skyline photo (front view, no perspective)
4. Enter city name (e.g., "Seattle")
5. Select a style from the Style Library
6. Click "PROCESS THIS SHIT" button
7. City is added to queue
8. Go to "Queue Monitor" tab
9. Click "Process Next" to start AI processing

### Phase 2: AI Processing Pipeline

```
Style Transfer (Gemini) → Building Detection (Vision API) → SVG Generation → Save to Database
```

**Step A - Style Transfer (Google Gemini API)**
- Input: Original city photo + Style PDF text
- Process: AI converts photorealistic image to vector line art
- Output: Black lines on white background PNG
- Time: ~10-30 seconds

**Step B - Building Detection (Google Cloud Vision API)**
- Input: Original city photo
- Process: Object localization to find all buildings
- Output: Bounding boxes with coordinates for each building
- Sorting: Buildings sorted by size (largest = front layer)

**Step C - SVG Generation**
- Input: Building coordinates + Styled image
- Process: Create vector paths for each building
- Output: Multi-layer SVG file
- Structure: Each building in separate `<g>` group with layer number

**Step D - Storage**
- Styled PNG saved to filesystem
- SVG file saved to filesystem
- Metadata saved to MongoDB
- City moved from "queue" to "processed" collection

### Phase 3: Public Download

```
User Searches City → Views Preview → Downloads SVG → Laser Cuts → Stacks Layers
```

**Steps:**
1. Go to public homepage
2. Click search bar to see dropdown of 40 US cities
3. Select a city (green "Available" badge = ready)
4. View city page with:
   - Styled image preview
   - Layer breakdown visualization
   - Building count and layer count
5. Click "Download SVG (Laser Ready)"
6. Import SVG into laser software (LightBurn, LaserGRBL, etc.)
7. Cut each layer from different material thickness
8. Stack layers with spacers for 3D effect

---

## 🤖 AI Integration Details

### Google Gemini API (Style Transfer)

**Model:** `gemini-3-pro-image-preview`  
**Capability:** Multimodal (text + image input → image output)

**Prompt Used:**
```
Transform this city skyline photograph into a clean vector line drawing.

Apply this artistic style: [EXTRACTED PDF TEXT]

CRITICAL REQUIREMENTS:
1. Output MUST be white background with black lines ONLY
2. Draw clean, precise outlines of each building
3. Include window patterns and architectural details as simple lines
4. NO shading, NO gradients, NO fills - LINES ONLY
5. Make it suitable for laser cutting
6. Preserve the exact positions and proportions of buildings
```

**Why Gemini:**
- Best-in-class image understanding
- Can follow complex artistic instructions
- Outputs high-quality stylized images
- Supports custom style descriptions from PDF

### Google Cloud Vision API (Building Detection)

**Method:** `objectLocalization`  
**Purpose:** Detect and locate buildings in the image

**Process:**
1. Send image to Vision API
2. API returns detected objects with:
   - Object name (e.g., "Building", "Skyscraper", "Tower")
   - Confidence score (0-1)
   - Normalized bounding polygon (4 vertices)
3. Filter for building-related objects
4. Sort by bounding box area (largest = closest/front)
5. Assign layer numbers (1 = front, 2 = middle, 3+ = back)

**Fallback Logic:**
If no buildings detected, create 3 default layers:
- Layer 1: Bottom third (foreground)
- Layer 2: Middle third
- Layer 3: Top third (background)

---

## 📁 File Formats

### Input Formats

| Type | Format | Max Size | Purpose |
|------|--------|----------|---------|
| City Photo | PNG, JPG, JPEG, WebP | 50 MB | Source skyline image |
| Style Guide | PDF | 50 MB | Artistic style rules |

**City Photo Requirements:**
- High resolution (2000+ pixels width recommended)
- Front-facing view (no extreme angles)
- Clear sky or simple background
- Daylight photos work best
- Iconic buildings visible

**Style PDF Content:**
- Text descriptions of artistic style
- Can include example images (AI extracts text only)
- Describes line weights, detail level, artistic influences

### Output Formats

| Type | Format | Purpose |
|------|--------|---------|
| Styled Image | PNG | Vector line art preview |
| Laser File | SVG | Multi-layer cutting file |
| Preview | PNG | Thumbnail for display |

---

## 📐 SVG File Structure

### Layer Organization

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <!-- White background -->
  <rect width="100%" height="100%" fill="white"/>
  
  <!-- Layer 3 - Background (furthest buildings) -->
  <g id="layer-3" data-layer="3" data-name="Building 3">
    <path d="M100 200 L200 200 L200 400 L100 400 Z" fill="none" stroke="black" stroke-width="2"/>
  </g>
  
  <!-- Layer 2 - Middle ground -->
  <g id="layer-2" data-layer="2" data-name="Building 2">
    <path d="M300 150 L450 150 L450 400 L300 400 Z" fill="none" stroke="black" stroke-width="2"/>
  </g>
  
  <!-- Layer 1 - Foreground (closest buildings) -->
  <g id="layer-1" data-layer="1" data-name="Building 1">
    <path d="M500 250 L700 250 L700 400 L500 400 Z" fill="none" stroke="black" stroke-width="2"/>
  </g>
</svg>
```

### SVG Attributes

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `id` | `layer-N` | Unique layer identifier |
| `data-layer` | `1`, `2`, `3`... | Layer number (1 = front) |
| `data-name` | Building name | Human-readable label |
| `fill` | `none` | No fill (cut lines only) |
| `stroke` | `black` | Line color |
| `stroke-width` | `2` | Line thickness |

### Laser Cutting Compatibility

The SVG is designed for:
- **LightBurn** - Popular laser software
- **LaserGRBL** - Free laser control
- **Inkscape** - Vector editing
- **Adobe Illustrator** - Professional editing
- **CorelDRAW** - Windows vector software

**How to Use:**
1. Import SVG into laser software
2. Each `<g>` group appears as separate layer
3. Assign different cut depths/powers per layer
4. Cut from materials like:
   - 3mm plywood (multiple sheets)
   - Acrylic (various colors)
   - Cardboard/chipboard
   - MDF
5. Stack layers with 3-5mm spacers between

---

## 🗄️ Database Structure (MongoDB)

### Collections

#### `settings`
```javascript
{
  gemini_api_key: "AIza...",      // Google Gemini API key
  vision_api_key: "AIza...",      // Google Vision API key
  updated_at: "2026-01-21T..."    // Last update timestamp
}
```

#### `styles`
```javascript
{
  id: "uuid",                      // Unique identifier
  name: "Art Deco",                // Style name
  description: "1920s geometric",  // Description
  filename: "uuid.pdf",            // Stored filename
  filepath: "/tmp/.../uuid.pdf",   // Full path
  text_preview: "First 500 chars", // Extracted text
  created_at: "2026-01-21T..."     // Upload timestamp
}
```

#### `queue`
```javascript
{
  id: "uuid",                      // City ID
  city_name: "Seattle",            // City name
  style_id: "uuid",                // Reference to style
  style_name: "Art Deco",          // Style name (denormalized)
  original_filepath: "/tmp/...",   // Original image path
  status: "waiting",               // waiting|stylizing|detecting|creating_svg|done|error
  progress: 0,                     // 0-100 percentage
  error_message: null,             // Error details if failed
  created_at: "2026-01-21T...",    // Queue timestamp
  updated_at: "2026-01-21T..."     // Last status change
}
```

#### `processed`
```javascript
{
  id: "uuid",                           // City ID
  city_name: "Seattle",                 // City name
  style_id: "uuid",                     // Style used
  style_name: "Art Deco",               // Style name
  building_count: 5,                    // Number of buildings detected
  layer_count: 5,                       // Number of layers in SVG
  original_image_path: "/tmp/...",      // Original photo
  styled_image_path: "/tmp/...",        // AI-styled PNG
  svg_path: "/tmp/...",                 // Final SVG file
  png_preview_path: "/tmp/...",         // Thumbnail
  buildings: [                          // Building metadata
    {
      name: "Building 1",
      layer: 1,
      vertices: [{x: 100, y: 200}, ...],
      area: 50000
    }
  ],
  processing_time_seconds: 45.2,        // How long it took
  created_at: "2026-01-21T..."          // Completion timestamp
}
```

---

## 🔌 API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/featured` | Get featured cities (up to 9) |
| GET | `/api/cities` | List all processed cities |
| GET | `/api/cities/search?q=seattle` | Search cities by name |
| GET | `/api/cities/{id}` | Get city details |
| GET | `/api/cities/{id}/svg` | Download SVG file |
| GET | `/api/cities/{id}/png` | Download PNG preview |
| GET | `/api/cities/{id}/styled` | Get styled image |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Authenticate admin |
| GET | `/api/settings` | Get API key status |
| POST | `/api/settings` | Save API keys (individual) |
| GET | `/api/styles` | List all styles |
| POST | `/api/styles` | Upload new style PDF |
| DELETE | `/api/styles/{id}` | Delete a style |
| POST | `/api/cities/upload` | Upload city + add to queue |
| GET | `/api/queue` | Get processing queue |
| DELETE | `/api/queue/{id}` | Cancel queue item |
| POST | `/api/queue/process-next` | Process next item |

---

## 🏗️ Technical Architecture

### Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18, Tailwind CSS, Lucide Icons |
| Backend | FastAPI (Python 3.11) |
| Database | MongoDB |
| File Storage | Local filesystem (`/tmp/layered_art_uploads/`) |
| AI - Style | Google Gemini API via emergentintegrations |
| AI - Detection | Google Cloud Vision API |
| Image Processing | Pillow (PIL) |
| PDF Processing | pdfplumber |

### File Structure

```
/app/
├── backend/
│   ├── server.py           # Main FastAPI application
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.js         # Main React app with routing
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx  # Admin panel (4 tabs)
│   │   │   ├── PublicHome.jsx      # Public homepage + search
│   │   │   └── CityPage.jsx        # City detail + download
│   │   ├── components/ui/  # Shadcn UI components
│   │   └── index.css      # Global styles
│   └── package.json       # Node dependencies
└── memory/
    └── PRD.md             # Product requirements document
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        ADMIN FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Upload Photo] ──→ [Select Style] ──→ [Add to Queue]           │
│                                                                  │
│  [Process Next] ──→ [Gemini API] ──→ [Styled PNG]               │
│                          │                                       │
│                          ▼                                       │
│                    [Vision API] ──→ [Building Data]              │
│                          │                                       │
│                          ▼                                       │
│                    [SVG Generator] ──→ [Layered SVG]            │
│                          │                                       │
│                          ▼                                       │
│                    [Save to MongoDB + Filesystem]                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        PUBLIC FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Search/Browse] ──→ [View City] ──→ [Download SVG/PNG]         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 UI Components

### Admin Dashboard Tabs

1. **Upload City**
   - Drag & drop image upload
   - City name input
   - Style selection grid
   - "PROCESS THIS SHIT" button

2. **Style Library**
   - PDF upload zone
   - Style name & description inputs
   - Grid of uploaded styles
   - Delete functionality

3. **Queue Monitor**
   - Real-time status table
   - Progress bars
   - "Process Next" button
   - Auto-refresh every 30 seconds
   - "View Result" link for completed items

4. **City Bank**
   - Grid of completed city cards
   - Thumbnail preview
   - Layer count badge
   - Click to view full details

### Public Pages

1. **Homepage**
   - Hero section with title
   - Search bar with dropdown
   - 40 US cities organized by category
   - "Available" badges for processed cities
   - Featured cities grid (City Bank)
   - "How It Works" section

2. **City Detail Page**
   - Large styled image preview
   - Layer stack visualization
   - Building/layer statistics
   - Download buttons (SVG + PNG)
   - Laser cutting instructions

---

## 📊 US Cities Database

The app includes a curated list of **40 major US cities** organized into 4 categories:

### Major Metropolitan Skylines (10 cities)
New York City, Chicago, Los Angeles, San Francisco, Seattle, Miami, Boston, Philadelphia, Washington DC, Houston

### Distinctive Regional Skylines (10 cities)
Denver, Atlanta, Dallas, Las Vegas, Phoenix, San Diego, Portland, Austin, Nashville, Charlotte

### Waterfront & Scenic Skylines (10 cities)
Pittsburgh, Baltimore, Cleveland, Detroit, St. Louis, Minneapolis, New Orleans, San Antonio, Tampa, Honolulu

### Growing & Distinctive Skylines (10 cities)
Salt Lake City, Kansas City, Indianapolis, Columbus, Milwaukee, Oklahoma City, Memphis, Louisville, Jacksonville, Sacramento

---

## ⚠️ Requirements & Limitations

### API Requirements

| API | Required For | How to Get |
|-----|--------------|------------|
| Google Gemini | Style transfer | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| Google Vision | Building detection | [console.cloud.google.com](https://console.cloud.google.com/apis/credentials) |

**Note:** Vision API requires:
- Google Cloud project with billing enabled
- Cloud Vision API enabled in the project

### Image Requirements

- **Format:** PNG, JPG, JPEG, WebP
- **Size:** Under 50 MB
- **Orientation:** Landscape preferred
- **View:** Front-facing (no extreme angles)
- **Quality:** High resolution (2000+ pixels)
- **Content:** Clear skyline with visible buildings

### Processing Limitations

- One city processed at a time
- Manual trigger required (no auto-queue)
- Processing time: 30-90 seconds typical
- Building detection accuracy varies with image quality

---

## 🔐 Security

### Admin Authentication
- Hardcoded credentials (single admin)
- Session stored in browser localStorage
- No password reset functionality

### API Key Storage
- Keys stored in MongoDB (encrypted at rest)
- Keys never exposed to frontend
- All AI calls routed through backend

### File Security
- Files stored in `/tmp/` (cleared on restart)
- No public file listing
- Access only via specific API endpoints

---

## 📈 Future Enhancements

### P1 - High Priority
- [ ] Improved SVG tracing (edge detection algorithms)
- [ ] Email notifications on completion
- [ ] Batch processing multiple cities
- [ ] Better error recovery

### P2 - Medium Priority
- [ ] Payment integration for commercial use
- [ ] User accounts for saved downloads
- [ ] Custom style creation tool
- [ ] Cloud storage (AWS S3 / Google Cloud Storage)

### P3 - Nice to Have
- [ ] International cities database
- [ ] Mobile app
- [ ] API for third-party integrations
- [ ] Community style sharing

---

## 📞 Support

**Admin Access:** `/admin`  
**Credentials:** See project documentation  
**Contact:** Custom city requests via homepage footer

---

*Documentation generated: January 21, 2026*  
*App Version: 1.0.0*  
*Made with coffee and frustration ☕*
