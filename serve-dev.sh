#!/bin/bash

echo "Setting up development server..."

# Create symlinks for data and icons in dist
mkdir -p dist
ln -sf ../out/data.min.json dist/
ln -sf ../out/icons dist/

echo "Starting server at http://localhost:8080"
npx http-server dist -p 8080 -c-1