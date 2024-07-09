#!/bin/bash

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "Node.js is not installed. Please install Node.js and run this script again."
    exit 1
fi

cd Trainiese

# Initialize npm and create package.json
npm init -y

# Install required dependencies
npm install express mongoose cors node-fetch@2

# Start the server in the background
node AITrainerServer.js &

# Wait for a moment to ensure the server has started
sleep 5

# Open localhost:3000 in the default browser
open http://localhost:3000
