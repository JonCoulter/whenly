#!/bin/bash

# Build frontend and copy to backend for middleware access
# This script is used by the Makefile to ensure frontend is available for meta tag middleware

set -e

echo "Building frontend for middleware access..."

# Navigate to frontend directory
cd frontend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Build the frontend
echo "Building frontend..."
if npm run build; then
    echo "Frontend built successfully!"
    
    # Create backend/frontend directory if it doesn't exist
    cd ../backend
    mkdir -p frontend
    
    # Copy built frontend files to backend directory
    echo "Copying frontend files to backend..."
    cp -r ../frontend/dist/* frontend/
    
    echo "Frontend files copied to backend/frontend/"
    echo "Middleware is ready to serve dynamic meta tags."
else
    echo "Warning: Frontend build failed, but middleware will use fallback template"
    echo "Middleware will still work with fallback HTML template for meta tags"
fi
