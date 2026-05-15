#!/bin/bash
# Kill any process on port 7500 and start the dev server on port 7500

echo "Clearing port 7500..."
lsof -ti:7500 | xargs kill -9 2>/dev/null
echo "Starting dev server on port 7500..."
PORT=7500 npx vite --port 7500 --host 0.0.0.0
