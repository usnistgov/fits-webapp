#!/bin/sh
#Script only to be used within nist775hit/fits-dev-environment container
#Made to be automatically executed in docker compose
set -e  # Exit on any error

echo "--- Starting Build Process ---"

cd cds-tcamt-client

echo "Installing NPM dependencies..."
npm install

echo "Installing Bower dependencies..."
# Added --allow-root in case the container runs as root
npm run bower -- --config.interactive=false --allow-root

echo "Running build..."
npm run build

echo "Build complete!"
exit;