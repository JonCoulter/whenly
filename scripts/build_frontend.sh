#!/bin/bash

# Build frontend for production to ensure middleware has access to index.html
# This script should be run before starting the backend server

set -e

echo "Building frontend for production..."

# Navigate to frontend directory
cd frontend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Build the frontend
echo "Building frontend..."
npm run build

# Check if build was successful
if [ ! -f "dist/index.html" ]; then
    echo "Error: Frontend build failed - dist/index.html not found"
    exit 1
fi

echo "Frontend built successfully!"
echo "Built files are in: frontend/dist/"

# Return to original directory
cd ..

echo "Frontend is ready for backend middleware."
