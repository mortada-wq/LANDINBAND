#!/bin/bash

# Frontend Build Script
# This script sets up and builds the frontend React application

set -e  # Exit on error

echo "======================================"
echo "Building Frontend..."
echo "======================================"

# Navigate to frontend directory
cd "$(dirname "$0")"

# Check Node.js version
echo "Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d 'v' -f 2 | cut -d '.' -f 1)
echo "Node.js version: v$(node --version | cut -d 'v' -f 2)"

if [ "$NODE_VERSION" -lt 16 ]; then
    echo "WARNING: Node.js version is less than 16. Please upgrade to Node.js 16 or higher."
fi

# Check for yarn
echo "Checking for Yarn..."
if ! command -v yarn &> /dev/null; then
    echo "Yarn is not installed. Installing Yarn..."
    npm install -g yarn
fi

# Clean install (remove node_modules and package-lock.json)
echo "Cleaning previous builds..."
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock

# Install dependencies
echo "Installing frontend dependencies..."
yarn install

# Check for .env file
if [ ! -f ".env" ]; then
    echo ""
    echo "WARNING: .env file not found!"
    echo "Please copy .env.example to .env and configure your environment variables:"
    echo "  cp .env.example .env"
    echo "  # Then edit .env with your actual values"
    echo ""
fi

# Build the production version
echo "Building production version..."
yarn build

echo ""
echo "======================================"
echo "Frontend build completed successfully!"
echo "======================================"
echo ""
echo "To start the frontend development server:"
echo "  1. Configure frontend/.env file"
echo "  2. Run: cd frontend && yarn start"
echo ""
echo "Production build is available in: frontend/build"
echo ""
