#!/bin/bash

# Navigate to the game directory
cd ant-hill-invasion

# Check if cd was successful
if [ $? -ne 0 ]; then
  echo "❌ Failed to change directory to ant-hill-invasion. Make sure you are in the root 'ant' directory."
  exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "⏳ node_modules not found. Running npm install..."
  npm install
  if [ $? -ne 0 ]; then
    echo "❌ npm install failed. Please check for errors."
    exit 1
  fi
  echo "✅ Dependencies installed."
fi

# Start the Vite development server
echo "🚀 Starting the Ant Hill Invasion development server..."
npm run dev

# Check if npm run dev started successfully (this is tricky, dev server runs indefinitely)
# We'll assume it works if the command executes without immediate error.
if [ $? -ne 0 ]; then
  echo "❌ Failed to start the dev server. Check Vite configuration and dependencies."
  exit 1
fi

# The server is running in the foreground. Script ends when server is stopped (Ctrl+C).
echo "🎉 Game server running! Access it in your browser (usually http://localhost:5173). Press Ctrl+C to stop." 