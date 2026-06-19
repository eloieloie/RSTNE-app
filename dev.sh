#!/bin/bash
# Kill any process on port 5200 and start the dev server on port 5200

echo "Clearing port 5200..."
lsof -ti:5200 | xargs kill -9 2>/dev/null
echo "Starting dev server on port 5200..."
PORT=5200 npx vite --port 5200 --host 0.0.0.0
