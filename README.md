# LANDINBAND - Layered Relief Art App

Transform city skyline photographs into laser-ready layered vector art.

## 🚀 Quick Start - Build from Scratch

To rebuild the entire project from scratch:

```bash
# Clone the repository
git clone https://github.com/mortada-wq/LANDINBAND.git
cd LANDINBAND

# Run the master build script
chmod +x build.sh
./build.sh
```

The build script will:
- ✅ Check prerequisites (Python 3.8+, Node.js 16+, MongoDB)
- ✅ Set up environment configuration files
- ✅ Build the backend (Python/FastAPI)
- ✅ Build the frontend (React)
- ✅ Display next steps for configuration and running

## 📖 Documentation

- **[BUILD.md](BUILD.md)** - Complete build instructions and troubleshooting
- **[DOCUMENTATION.md](DOCUMENTATION.md)** - Full application documentation

## 🔧 Prerequisites

- **Python** 3.8+
- **Node.js** 16+
- **MongoDB** 4.0+
- **Google Gemini API Key** (get from [Google AI Studio](https://aistudio.google.com/app/apikey))

## 🏃 Running the Application

After building, configure and run:

1. **Configure environment variables**:
   ```bash
   # Edit with your actual values
   nano backend/.env
   nano frontend/.env
   ```

2. **Start MongoDB**:
   ```bash
   mongod --dbpath ~/mongodb-data
   ```

3. **Start backend** (Terminal 1):
   ```bash
   cd backend
   source venv/bin/activate
   python server.py
   ```

4. **Start frontend** (Terminal 2):
   ```bash
   cd frontend
   yarn start
   ```

5. **Access the app**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api
   - API Docs: http://localhost:8000/docs

## 📦 Individual Component Builds

Build backend only:
```bash
cd backend
./build.sh
```

Build frontend only:
```bash
cd frontend
./build.sh
```

## 🛠️ Development

Hot reload for development:

```bash
# Backend with auto-reload
cd backend && source venv/bin/activate
uvicorn server:app --reload

# Frontend with hot reload
cd frontend && yarn start
```

## 🎯 What This App Does

Converts city skyline photos into 3 separate SVG layers for laser cutting:
- **Layer 1**: Foreground buildings (shortest)
- **Layer 2**: Middle buildings (medium)
- **Layer 3**: Background buildings (tallest)

## 🤝 Support

For detailed build instructions and troubleshooting, see [BUILD.md](BUILD.md).

For application features and usage, see [DOCUMENTATION.md](DOCUMENTATION.md).
