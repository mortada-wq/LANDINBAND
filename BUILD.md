# 🏗️ LANDINBAND - Build Instructions

## Overview

This document provides complete instructions for building the LANDINBAND (Layered Relief Art App) project from scratch.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Manual Build Process](#manual-build-process)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Troubleshooting](#troubleshooting)
- [Development Setup](#development-setup)

---

## Prerequisites

Before building the project, ensure you have the following installed:

### Required Software

| Software | Minimum Version | Purpose | Download Link |
|----------|----------------|---------|---------------|
| **Python** | 3.8+ | Backend server | https://www.python.org/downloads/ |
| **Node.js** | 16+ | Frontend build | https://nodejs.org/ |
| **MongoDB** | 4.0+ | Database | https://www.mongodb.com/try/download/community |
| **Yarn** | 1.22+ | Package manager | Installed automatically by build script |

### Optional Software

| Software | Purpose |
|----------|---------|
| **Git** | Version control and cloning the repository |
| **MongoDB Compass** | GUI for MongoDB database management |

### API Keys Required

Before running the application, you need:

1. **Google Gemini API Key** - Get it from [Google AI Studio](https://aistudio.google.com/app/apikey)

---

## Quick Start

The easiest way to build the entire project is using the master build script:

```bash
# 1. Clone the repository (if you haven't already)
git clone https://github.com/mortada-wq/LANDINBAND.git
cd LANDINBAND

# 2. Run the master build script
chmod +x build.sh
./build.sh

# 3. Follow the post-build configuration steps shown by the script
```

The master build script will:
- ✅ Check all prerequisites
- ✅ Create environment files from templates
- ✅ Build the backend (install Python dependencies)
- ✅ Build the frontend (install npm packages and create production build)
- ✅ Display next steps for configuration and running

---

## Manual Build Process

If you prefer to build components individually:

### 1. Backend Build

```bash
# Navigate to backend directory
cd backend

# Make the build script executable
chmod +x build.sh

# Run the build script
./build.sh

# The script will:
# - Create a Python virtual environment
# - Install all Python dependencies from requirements.txt
# - Create necessary upload directories
```

#### Manual Backend Build (without script)

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Create upload directories
mkdir -p /tmp/layered_art_uploads/cities
mkdir -p /tmp/layered_art_uploads/styles
mkdir -p /tmp/layered_art_uploads/processed
```

### 2. Frontend Build

```bash
# Navigate to frontend directory
cd frontend

# Make the build script executable
chmod +x build.sh

# Run the build script
./build.sh

# The script will:
# - Install Yarn (if not present)
# - Clean previous builds
# - Install all npm dependencies
# - Create production build
```

#### Manual Frontend Build (without script)

```bash
cd frontend

# Install dependencies
yarn install
# or
npm install

# Build production version
yarn build
# or
npm run build
```

---

## Configuration

### Backend Configuration

1. Copy the example environment file:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Edit `backend/.env` with your actual values:
   ```env
   # MongoDB Configuration
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=layered_art_db

   # Admin Credentials
   ADMIN_EMAIL=Mortada@howvier.com
   ADMIN_PASSWORD=Mo1982#

   # API Keys
   GEMINI_API_KEY=your_actual_gemini_api_key_here

   # Server Configuration
   PORT=8000
   HOST=0.0.0.0
   ```

### Frontend Configuration

1. Copy the example environment file:
   ```bash
   cp frontend/.env.example frontend/.env
   ```

2. Edit `frontend/.env` with your backend URL:
   ```env
   REACT_APP_API_URL=http://localhost:8000/api
   ```

### MongoDB Setup

1. **Install MongoDB** (if not already installed)
   - macOS: `brew install mongodb-community`
   - Ubuntu: `sudo apt-get install mongodb`
   - Windows: Download from MongoDB website

2. **Create data directory**:
   ```bash
   mkdir -p ~/mongodb-data
   ```

3. **Start MongoDB**:
   ```bash
   mongod --dbpath ~/mongodb-data
   ```

---

## Running the Application

### Start the Backend Server

```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Start the server
python server.py
```

The backend will be available at:
- **API**: http://localhost:8000/api
- **API Docs**: http://localhost:8000/docs

### Start the Frontend Development Server

```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Start development server
yarn start
# or
npm start
```

The frontend will be available at:
- **Application**: http://localhost:3000

### Production Deployment

For production, serve the built frontend:

```bash
cd frontend

# Serve the build directory with a static server
npx serve -s build -l 3000
```

---

## Troubleshooting

### Common Issues

#### 1. Python Version Error

**Problem**: Python version is too old

**Solution**:
```bash
# Check your Python version
python3 --version

# If < 3.8, upgrade Python
# macOS: brew upgrade python3
# Ubuntu: sudo apt-get upgrade python3
```

#### 2. Node.js Version Error

**Problem**: Node.js version is too old

**Solution**:
```bash
# Check your Node.js version
node --version

# If < 16, use nvm to upgrade
# Install nvm: https://github.com/nvm-sh/nvm
nvm install 16
nvm use 16
```

#### 3. MongoDB Connection Error

**Problem**: Cannot connect to MongoDB

**Solution**:
```bash
# Check if MongoDB is running
ps aux | grep mongod

# If not running, start it
mongod --dbpath ~/mongodb-data

# Or start MongoDB service
# macOS: brew services start mongodb-community
# Ubuntu: sudo systemctl start mongodb
```

#### 4. Port Already in Use

**Problem**: Port 8000 or 3000 is already in use

**Solution**:
```bash
# Find the process using the port
# macOS/Linux:
lsof -i :8000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change the port in backend/.env or frontend/.env
```

#### 5. Gemini API Errors

**Problem**: API key not working or quota exceeded

**Solution**:
- Verify your API key at https://aistudio.google.com/app/apikey
- Check your API quota and usage limits
- Ensure the key is correctly set in `backend/.env`

#### 6. Build Fails on Frontend

**Problem**: Yarn or npm install fails

**Solution**:
```bash
# Clear cache
yarn cache clean
# or
npm cache clean --force

# Delete node_modules and lock files
rm -rf node_modules package-lock.json yarn.lock

# Try again
yarn install
```

---

## Development Setup

### Hot Reload Development

For active development with hot reload:

**Terminal 1 - Backend with auto-reload**:
```bash
cd backend
source venv/bin/activate
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend with hot reload**:
```bash
cd frontend
yarn start
```

### Running Tests

**Backend tests**:
```bash
cd backend
source venv/bin/activate
pytest
```

**Frontend tests**:
```bash
cd frontend
yarn test
```

### Code Linting

**Backend (Python)**:
```bash
cd backend
source venv/bin/activate
flake8 .
black . --check
```

**Frontend (JavaScript)**:
```bash
cd frontend
yarn lint
```

### Database Management

**Access MongoDB shell**:
```bash
mongosh
use layered_art_db
db.queue.find()
db.processed.find()
```

**Backup database**:
```bash
mongodump --db layered_art_db --out ./backup
```

**Restore database**:
```bash
mongorestore --db layered_art_db ./backup/layered_art_db
```

---

## Project Structure

```
LANDINBAND/
├── backend/              # Python FastAPI backend
│   ├── server.py        # Main server file
│   ├── requirements.txt # Python dependencies
│   ├── build.sh         # Backend build script
│   ├── .env.example     # Environment template
│   └── venv/            # Virtual environment (created by build)
├── frontend/            # React frontend
│   ├── src/             # Source code
│   ├── public/          # Static files
│   ├── build/           # Production build (created by build)
│   ├── package.json     # npm dependencies
│   ├── build.sh         # Frontend build script
│   └── .env.example     # Environment template
├── build.sh             # Master build script
├── .env.example         # Root environment template
├── BUILD.md             # This file
├── DOCUMENTATION.md     # Application documentation
└── README.md            # Project overview
```

---

## Build Script Reference

### Master Build Script (`build.sh`)

Builds the entire project from scratch.

**Usage**:
```bash
./build.sh
```

**What it does**:
1. Checks prerequisites (Python, Node.js, MongoDB)
2. Creates environment files from templates
3. Runs backend build script
4. Runs frontend build script
5. Displays configuration and run instructions

### Backend Build Script (`backend/build.sh`)

Builds only the backend.

**Usage**:
```bash
cd backend
./build.sh
```

**What it does**:
1. Creates Python virtual environment
2. Installs all Python dependencies
3. Creates upload directories
4. Displays run instructions

### Frontend Build Script (`frontend/build.sh`)

Builds only the frontend.

**Usage**:
```bash
cd frontend
./build.sh
```

**What it does**:
1. Installs Yarn (if needed)
2. Cleans previous builds
3. Installs all npm dependencies
4. Creates production build
5. Displays run instructions

---

## Additional Resources

- **Application Documentation**: See [DOCUMENTATION.md](DOCUMENTATION.md)
- **Project Repository**: https://github.com/mortada-wq/LANDINBAND
- **Google Gemini API**: https://ai.google.dev/docs
- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **React Documentation**: https://react.dev/

---

## Support

If you encounter issues not covered in this guide:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [DOCUMENTATION.md](DOCUMENTATION.md) for application-specific details
3. Open an issue on GitHub with:
   - Your operating system
   - Python and Node.js versions
   - Full error message
   - Steps to reproduce the issue

---

*Last Updated: January 2026*
