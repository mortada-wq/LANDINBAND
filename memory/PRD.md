# Skyline Art Layerizer - PRD

## Original Problem Statement
Create a full-stack web application called "Skyline Art Layerizer" that transforms real city skyline photographs into 3-layer stacked art pieces with the following workflow:
1. **Stage 1 - Style Application:** Upload cityscape photo + PDF style file, send to Google Gemini API for vector line art transformation
2. **Stage 2 - Building Layering:** Use Google Cloud Vision API to detect buildings and segment into 3 depth layers (Far, Mid, Front)
3. **Stage 3 - Composition & Export:** Create stacked composite and allow PNG download

## User Personas
- **Artists/Designers:** Looking for unique cityscape visualization tools
- **Architects:** Want to create stylized representations of urban landscapes
- **Creative Professionals:** Need layered art for presentations or portfolios

## Core Requirements
- User-provided Google Gemini and Vision API keys
- PDF style files (max 50MB) for custom style rules
- 3-stage processing workflow
- PNG export of final composite
- No user authentication required

## What's Been Implemented (January 21, 2026)
### Backend (FastAPI + MongoDB)
- ✅ Settings API (save/retrieve API keys securely)
- ✅ Projects API (create, list, get projects)
- ✅ File upload endpoints (images, PDFs up to 50MB)
- ✅ PDF text extraction using pdfplumber
- ✅ Stage 1 processing (Gemini integration for vector style)
- ✅ Stage 2 processing (Vision API for building detection)
- ✅ Stage 3 processing (composite image creation)
- ✅ Download endpoint for final PNG

### Frontend (React + Framer Motion + shadcn/ui)
- ✅ Dark theme workspace with grid background
- ✅ Sidebar navigation with settings access
- ✅ Drag & drop upload zones for images and PDFs
- ✅ 4-stage progress indicator (Upload → Style → Layer → Export)
- ✅ API status indicators in control panel
- ✅ Settings modal with API key inputs and visibility toggles
- ✅ Stage preview components (split view, layer breakdown, composite)
- ✅ Processing buttons with loading states
- ✅ Download functionality

## Tech Stack
- **Backend:** FastAPI, MongoDB, pdfplumber, Pillow, emergentintegrations (Gemini), google-cloud-vision
- **Frontend:** React 19, Framer Motion, react-dropzone, Tailwind CSS, shadcn/ui

## Prioritized Backlog
### P0 (Critical)
- ✅ Core 3-stage workflow
- ✅ API key management
- ✅ File uploads and processing

### P1 (High Priority)
- [ ] Better building detection with machine learning refinement
- [ ] Layer opacity controls for manual adjustment
- [ ] History/gallery of processed projects

### P2 (Medium Priority)
- [ ] User accounts for saving projects long-term
- [ ] Multiple style presets (minimal, detailed, artistic)
- [ ] SVG export option

## Next Tasks
1. Test with real Google API keys to verify end-to-end workflow
2. Add more sophisticated building segmentation algorithm
3. Implement layer preview toggle in Stage 2
4. Add progress percentage during AI processing
