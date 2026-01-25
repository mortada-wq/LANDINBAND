#!/bin/bash

# Backend Build Script
# This script sets up and builds the backend Python/FastAPI application

set -e  # Exit on error

echo "======================================"
echo "Building Backend..."
echo "======================================"

# Navigate to backend directory
cd "$(dirname "$0")"

# Check Python version
echo "Checking Python version..."
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d ' ' -f 2 | cut -d '.' -f 1,2)
echo "Python version: $PYTHON_VERSION"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Check for .env file
if [ ! -f ".env" ]; then
    echo ""
    echo "WARNING: .env file not found!"
    echo "Please copy .env.example to .env and configure your environment variables:"
    echo "  cp .env.example .env"
    echo "  # Then edit .env with your actual values"
    echo ""
fi

# Create upload directories
echo "Creating upload directories..."
mkdir -p /tmp/layered_art_uploads/cities
mkdir -p /tmp/layered_art_uploads/styles
mkdir -p /tmp/layered_art_uploads/processed

echo ""
echo "======================================"
echo "Backend build completed successfully!"
echo "======================================"
echo ""
echo "To start the backend server:"
echo "  1. Ensure MongoDB is running"
echo "  2. Configure backend/.env file"
echo "  3. Run: cd backend && source venv/bin/activate && python server.py"
echo ""
