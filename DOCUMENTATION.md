# Layered Relief Art App - Technical Documentation v2

## 📋 Executive Summary

**App Name:** Layered Relief Art App  
**Purpose:** Transform city skyline photographs into laser-ready layered vector art  
**Target Users:** Laser cutting enthusiasts, watch strap manufacturers, makers  
**Output:** 3 separate SVG layer files optimized for CNC/laser cutting

---

## 🎯 What This App Does

The Layered Relief Art App converts a **photorealistic city skyline image** into **3 separate SVG layer files** for laser cutting. The layers create a 3D relief effect when cut and stacked.

### NEW 2-Stage Gemini Workflow

```
[City Photo] 
    ↓
STAGE 1: Gemini Style Transfer
    → Convert photo to clean vector line art SVG
    ↓
>>> PAUSE: MANUAL SPACING ADJUSTMENT <<<
    → Admin uses slider (0-200%) to expand horizontal spacing
    ↓
STAGE 2: Gemini Layer Separation
    → Gemini analyzes heights and creates 3 separate layers
    ↓
OUTPUT: 3 SVG files (layer_1.svg, layer_2.svg, layer_3.svg)
```

### Key Changes from v1
- ❌ **REMOVED:** Google Cloud Vision API (building detection)
- ✅ **NEW:** Horizontal spacing slider (0-200% expansion)
- ✅ **NEW:** Gemini-powered layer separation (Stage 2)
- ✅ **NEW:** 3 separate SVG layer outputs

---

## 🔄 Complete Workflow

### Phase 1: Admin Uploads City

1. Login with credentials (`Mortada@howvier.com` / `Mo1982#`)
2. Go to "Upload City" tab
3. Drag & drop city skyline photo
4. Enter city name
5. Select a style from the Style Library
6. Click "ADD TO QUEUE"

### Phase 2: Stage 1 - Style Transfer

1. Go to "Processing Queue" tab
2. Find the city with "Waiting" status
3. Click "Run Stage 1"
4. Gemini AI converts photo to vector line art SVG
5. Status changes to "Stage 1 Done → Adjust Spacing"

### Phase 3: Spacing Adjustment (NEW!)

**Purpose:** Expand horizontal distance between buildings for watch strap production or aesthetic preference.

1. Click "Adjust Spacing" on the completed Stage 1 item
2. Use the slider to set expansion (0-200%)
   - **0%** = Original spacing
   - **100%** = Double the horizontal gaps
   - **200%** = Triple the horizontal gaps
3. Click "Apply Spacing"
4. Buildings shift outward from center (shapes unchanged!)

**Algorithm:**
```
For each building:
  1. Calculate distance from canvas center
  2. Multiply distance by expansion factor
  3. Shift building X position proportionally
  4. DO NOT change Y position or building shape
```

### Phase 4: Stage 2 - Layer Separation

1. Click "Run Stage 2"
2. Gemini AI analyzes building heights (0-10 scale)
3. Creates 3 separate layers:
   - **Layer 1 (Foreground):** Height 0-3 (shortest buildings)
   - **Layer 2 (Middle):** Height 3-6 (medium buildings)
   - **Layer 3 (Background):** Height 6-10 (tallest buildings)
4. Each layer is a complete SVG file
5. Status changes to "Complete!"

### Phase 5: Download

1. Go to City Bank or click "View Result"
2. Download individual layers or all 3 at once
3. Import into laser cutter software
4. Cut and stack!

---

## 🤖 AI Integration - Gemini Only!

### Stage 1: Style Transfer Prompt

```
Transform this city skyline photograph into a clean vector line art SVG.

{style_instructions}

OUTPUT REQUIREMENTS:
1. Create a valid SVG file with viewBox="0 0 {width} {height}"
2. Use ONLY black strokes (stroke="#000000") on transparent/white background
3. NO fills, NO gradients, NO raster images - LINES ONLY
4. Draw clean, precise outlines of each building
5. Include architectural details (windows, edges) as simple lines
6. Make it suitable for laser cutting
7. Preserve exact positions and proportions of buildings

Return ONLY the complete SVG code.
```

### Stage 2: Layer Separation Prompt

```
You are analyzing a city skyline vector line art SVG for laser cutting.

INPUT SVG: {spaced_svg}

TASK: Create THREE separate SVG layers based on building HEIGHT.

MEASUREMENT SYSTEM:
- Street level (bottom) = 0
- Tallest building = 10
- Measure each building's height on this 0-10 scale

LAYER SEPARATION RULES:

LAYER 1 (Nearest/Foreground):
- Include ONLY buildings with height 0-3
- Extend partially visible buildings to street level
- Keep exact X positions

LAYER 2 (Middle):
- Include ONLY buildings with height 3.01-6
- Extend partially visible buildings to street level
- Keep exact X positions

LAYER 3 (Farthest/Background):
- Include ONLY buildings with height >6
- Extend partially visible buildings to street level
- Keep exact X positions

CRITICAL:
- Each layer must have same viewBox: "{viewbox}"
- DO NOT move buildings horizontally
- Use stroke="#000000" and fill="none"

OUTPUT FORMAT (JSON):
{"layer_1": "<svg>...</svg>", "layer_2": "<svg>...</svg>", "layer_3": "<svg>...</svg>"}
```

---

## 📁 File Formats

### Input Formats

| Type | Format | Max Size | Purpose |
|------|--------|----------|---------|
| City Photo | PNG, JPG, JPEG, WebP | 50 MB | Source skyline image |
| Style Guide | PDF | 50 MB | Artistic style rules |

### Output Formats

| File | Description |
|------|-------------|
| `{city}_stage1.svg` | Combined vector art (all buildings) |
| `{city}_spaced.svg` | After spacing adjustment |
| `{city}_layer_1.svg` | Foreground layer (shortest buildings) |
| `{city}_layer_2.svg` | Middle layer (medium buildings) |
| `{city}_layer_3.svg` | Background layer (tallest buildings) |

---

## 📐 SVG Layer Structure

Each layer SVG contains:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     viewBox="0 0 1920 1080"
     width="1920" height="1080">
  
  <!-- Buildings for this layer only -->
  <path d="..." stroke="#000000" fill="none" stroke-width="2"/>
  
</svg>
```

### Layer Assembly for Laser Cutting

```
┌─────────────────────────────────┐
│   Layer 3 (Back) - 6mm material │  ← Tallest buildings
├─────────────────────────────────┤
│   3-5mm spacer                  │
├─────────────────────────────────┤
│   Layer 2 (Mid) - 4mm material  │  ← Medium buildings
├─────────────────────────────────┤
│   3-5mm spacer                  │
├─────────────────────────────────┤
│   Layer 1 (Front) - 3mm material│  ← Shortest buildings
└─────────────────────────────────┘
```

---

## 🗄️ Database Schema (MongoDB)

### `settings` Collection
```javascript
{
  gemini_api_key: "AIza...",      // Google Gemini API key
  updated_at: "2026-01-21T..."
}
```

### `queue` Collection
```javascript
{
  id: "uuid",
  city_name: "Seattle",
  style_id: "uuid",
  style_name: "Art Deco",
  original_filepath: "/tmp/.../photo.jpg",
  stage1_svg_path: "/tmp/.../stage1.svg",      // NEW
  spaced_svg_path: "/tmp/.../spaced.svg",      // NEW
  expansion_percentage: 75,                     // NEW
  original_width: 1920,
  original_height: 1080,
  new_width: 3360,                              // After spacing
  original_aspect_ratio: "1920:1080",
  new_aspect_ratio: "3360:1080",                // After spacing
  status: "waiting|stage1_processing|stage1_complete|spacing_applied|stage2_processing|done|error",
  progress: 0-100,
  error_message: null,
  created_at: "...",
  updated_at: "..."
}
```

### `processed` Collection
```javascript
{
  id: "uuid",
  city_name: "Seattle",
  style_name: "Art Deco",
  stage1_svg_path: "/tmp/.../stage1.svg",
  spaced_svg_path: "/tmp/.../spaced.svg",
  layer_1_path: "/tmp/.../layer_1.svg",        // NEW
  layer_2_path: "/tmp/.../layer_2.svg",        // NEW
  layer_3_path: "/tmp/.../layer_3.svg",        // NEW
  layer_count: 3,
  expansion_percentage: 75,
  original_aspect_ratio: "1920:1080",
  new_aspect_ratio: "3360:1080",
  created_at: "...",
  processed_at: "..."
}
```

---

## 🔌 API Endpoints

### Processing Endpoints (NEW!)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/process/stage1/{city_id}` | Run Stage 1 (Gemini style transfer) |
| GET | `/api/process/stage1/{city_id}/preview` | Get Stage 1 SVG preview |
| POST | `/api/process/spacing/{city_id}` | Apply horizontal spacing |
| GET | `/api/process/spacing/{city_id}/preview` | Get spaced SVG preview |
| POST | `/api/process/stage2/{city_id}` | Run Stage 2 (Gemini layer separation) |

### Download Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cities/{id}/layer/1` | Download Layer 1 SVG |
| GET | `/api/cities/{id}/layer/2` | Download Layer 2 SVG |
| GET | `/api/cities/{id}/layer/3` | Download Layer 3 SVG |
| GET | `/api/cities/{id}/stage1` | Download Stage 1 SVG |
| GET | `/api/cities/{id}/all-layers` | Get all layer download URLs |

### Other Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/admin/login` | Admin authentication |
| GET/POST | `/api/settings` | Gemini API key management |
| CRUD | `/api/styles` | Style library management |
| POST | `/api/cities/upload` | Upload city + add to queue |
| GET | `/api/queue` | Get processing queue |
| GET | `/api/cities` | List processed cities |
| GET | `/api/cities/search?q=` | Search cities |
| GET | `/api/featured` | Get featured cities |

---

## 🎨 UI Components

### Admin Dashboard Tabs

1. **Upload City** - Drag-drop photo, select style, add to queue
2. **Style Library** - Upload/manage style PDFs
3. **Processing Queue** - NEW 2-stage workflow with spacing slider
4. **City Bank** - View all completed cities

### Processing Queue Features

- **Workflow diagram** showing all 5 steps
- **Status badges** for each stage
- **Run Stage 1** button for waiting items
- **Spacing slider** (0-200%) after Stage 1
- **Run Stage 2** button after spacing
- **View Result** link for completed items

### City Detail Page

- **3 Layer Downloads** with color-coded cards
- **Layer stack visualization**
- **Download All 3 Layers** button
- **Laser cutting instructions**

---

## 🔧 Spacing Algorithm

```python
def expand_horizontal_spacing(svg_content, expansion_percentage):
    """
    Expands horizontal distance between buildings uniformly
    WITHOUT distorting building shapes
    
    Args:
        svg_content: Stage 1 SVG output from Gemini
        expansion_percentage: 0-200% (from slider)
    
    Returns:
        Modified SVG with expanded spacing
    """
    
    # 1. Parse SVG viewBox to get canvas dimensions
    # 2. Calculate expansion factor: 1 + (percentage / 100)
    # 3. Find canvas center X coordinate
    
    # For each element with X position:
    #   - Calculate distance from center
    #   - Multiply distance by expansion factor
    #   - Shift element X position accordingly
    #   - DO NOT change Y position or element shape
    
    # 4. Update viewBox width: original_width * expansion_factor
    # 5. Return modified SVG with new dimensions
```

**Example:**
```
Original (0% expansion):
  Canvas: 1000px wide
  Building A at X=200
  Building B at X=500 (center)
  Building C at X=800

After 50% expansion:
  Canvas: 1500px wide
  Building A at X=50 (shifted LEFT from center)
  Building B at X=750 (new center)
  Building C at X=1450 (shifted RIGHT from center)

Buildings unchanged in shape - only X positions shift!
```

---

## ⚠️ Requirements

### API Requirements

| API | Purpose | Get Key |
|-----|---------|---------|
| Google Gemini | Style transfer + Layer separation | [aistudio.google.com](https://aistudio.google.com/app/apikey) |

**Note:** Only ONE API key needed now - Gemini handles both stages!

### Image Requirements

- **Format:** PNG, JPG, JPEG, WebP
- **Size:** Under 50 MB
- **Orientation:** Landscape preferred
- **View:** Front-facing (no extreme angles)
- **Quality:** High resolution (2000+ pixels)

---

## 📈 Future Enhancements

- [ ] Real-time spacing preview (without saving)
- [ ] Custom layer height thresholds
- [ ] Batch processing
- [ ] Cloud storage for files
- [ ] Payment integration

---

## 📞 Support

**Admin Access:** `/admin`  
**Credentials:** Mortada@howvier.com / Mo1982#  
**API:** Only Gemini key required

---

*Documentation v2 - January 21, 2026*  
*2-Stage Gemini Workflow - No Vision API!*  
*Made with coffee and frustration ☕*
