#!/bin/bash

# Master Build Script
# This script rebuilds the entire LANDINBAND project from scratch

set -e  # Exit on error

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║         LANDINBAND - Master Build Script                  ║"
echo "║         Layered Relief Art Application                    ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Function to print section headers
print_section() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "$1"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Check prerequisites
print_section "Step 1: Checking Prerequisites"

echo "Checking required tools..."
MISSING_TOOLS=()

if ! command -v python3 &> /dev/null; then
    MISSING_TOOLS+=("Python 3")
fi

if ! command -v node &> /dev/null; then
    MISSING_TOOLS+=("Node.js")
fi

if ! command -v mongod &> /dev/null; then
    echo "WARNING: MongoDB does not appear to be installed."
    echo "You will need MongoDB to run the application."
fi

if [ ${#MISSING_TOOLS[@]} -gt 0 ]; then
    echo ""
    echo "ERROR: Missing required tools:"
    for tool in "${MISSING_TOOLS[@]}"; do
        echo "  - $tool"
    done
    echo ""
    echo "Please install the missing tools and try again."
    exit 1
fi

echo "✓ All required tools are installed"

# Environment setup
print_section "Step 2: Environment Configuration"

# Check root .env
if [ ! -f "$SCRIPT_DIR/.env.example" ]; then
    echo "ERROR: .env.example not found in project root"
    exit 1
fi

# Setup backend .env
if [ ! -f "$SCRIPT_DIR/backend/.env" ]; then
    echo "Setting up backend .env from example..."
    cp "$SCRIPT_DIR/backend/.env.example" "$SCRIPT_DIR/backend/.env"
    echo "⚠  Created backend/.env - Please configure it with your actual values"
else
    echo "✓ Backend .env already exists"
fi

# Setup frontend .env
if [ ! -f "$SCRIPT_DIR/frontend/.env" ]; then
    echo "Setting up frontend .env from example..."
    cp "$SCRIPT_DIR/frontend/.env.example" "$SCRIPT_DIR/frontend/.env"
    echo "⚠  Created frontend/.env - Please configure it with your actual values"
else
    echo "✓ Frontend .env already exists"
fi

# Build Backend
print_section "Step 3: Building Backend"

cd "$SCRIPT_DIR/backend"
chmod +x build.sh
./build.sh

# Build Frontend
print_section "Step 4: Building Frontend"

cd "$SCRIPT_DIR/frontend"
chmod +x build.sh
./build.sh

# Final summary
print_section "Build Complete!"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    BUILD SUCCESSFUL!                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Next Steps:"
echo ""
echo "1. Configure Environment Variables:"
echo "   - Edit backend/.env with your actual values"
echo "   - Edit frontend/.env with your actual values"
echo ""
echo "2. Start MongoDB:"
echo "   mongod --dbpath /path/to/your/data/directory"
echo ""
echo "3. Start Backend Server:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   python server.py"
echo ""
echo "4. Start Frontend (in a new terminal):"
echo "   cd frontend"
echo "   yarn start"
echo ""
echo "5. Access the Application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:8000/api"
echo "   - API Docs: http://localhost:8000/docs"
echo ""
echo "For more information, see DOCUMENTATION.md"
echo ""
