# Layered Relief Art App - PRD

## Original Problem Statement
Build a tool that turns city photos into layered art files for laser cutting with:
1. **Admin Dashboard** - Upload cities, manage style PDFs, monitor processing queue
2. **AI Processing Pipeline** - Gemini for style transfer, Vision API for building detection, SVG generation
3. **Public Landing Page** - Search cities, preview layers, download SVG/PNG

## User Personas
- **Admin (Mortada):** Uploads city photos, manages styles, monitors processing
- **Public Users:** Search for cities, preview layered art, download laser-ready files

## Core Requirements
- White background, black text, clean simple design
- Admin login (Mortada@howvier.com / Mo1982#)
- 3 admin tabs: Upload City, Style Library, Queue Monitor
- Manual "Process Next" trigger for queue
- PDF style files (max 50MB)
- Laser-ready SVG output with separate building layers

## What's Been Implemented (January 21, 2026)

### Backend (FastAPI + MongoDB)
- ✅ Admin authentication (hardcoded credentials)
- ✅ Settings API for Google API keys (Gemini + Vision)
- ✅ Style Library CRUD (upload/list/delete PDFs)
- ✅ City upload with queue system
- ✅ Queue management (list, cancel, process-next)
- ✅ AI Processing Pipeline:
  - PDF text extraction
  - Gemini style transfer (vector line art)
  - Vision API building detection
  - SVG generation with layers
- ✅ Public API (search, featured, city details, download)

### Frontend (React + Tailwind)
- ✅ Public Homepage with search and "How It Works"
- ✅ City detail page with layer visualization
- ✅ Admin login page
- ✅ Admin Dashboard with 3 tabs:
  - Upload City (drag-drop + style selection)
  - Style Library (upload/manage PDFs)
  - Queue Monitor (status, progress, process-next)
- ✅ Settings modal for API keys
- ✅ SVG/PNG download functionality

## Tech Stack
- Backend: FastAPI, MongoDB, pdfplumber, Pillow, emergentintegrations
- Frontend: React, Tailwind CSS, react-dropzone, Lucide icons
- AI: Google Gemini (style transfer), Google Vision (building detection)

## Known Issues
- Gemini API requires "Generative Language API" enabled in Google Cloud Console
- Vision API requires billing-enabled Google Cloud project

## Prioritized Backlog
### P0 (Done)
- ✅ Admin dashboard with 3 tabs
- ✅ AI processing pipeline
- ✅ Public site with search/download

### P1 (Next)
- [ ] Better SVG tracing (use actual edge detection)
- [ ] Email notifications when processing completes
- [ ] Batch processing option

### P2 (Future)
- [ ] Payment integration
- [ ] User accounts for saved downloads
- [ ] Custom style creation tool

## Admin Credentials
- Email: Mortada@howvier.com
- Password: Mo1982#
