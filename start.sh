#!/bin/bash

echo "=========================================="
echo "  Starting Distributed Voting System"
echo "=========================================="
echo ""

cd "$(dirname "$0")"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js not found"
    exit 1
fi

echo "Node.js version: $(node --version)"
echo ""

# Install backend dependencies if needed
if [ ! -d "src/voting_backend_server/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd src/voting_backend_server
    npm install
    cd ../..
fi

# Install frontend dependencies if needed
if [ ! -d "src/voting_frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd src/voting_frontend
    npm install
    cd ../..
fi

echo ""
echo "=========================================="
echo "  Starting Backend Server"
echo "=========================================="

# Start backend server
cd src/voting_backend_server
node server.js &
BACKEND_PID=$!
cd ../..

echo "Backend server started (PID: $BACKEND_PID)"
echo "  http://localhost:4943"
echo ""

# Wait for backend to start
sleep 2

# Check if backend is running
if curl -s http://localhost:4943/api/health > /dev/null; then
    echo "Backend server is running"
else
    echo "Backend server failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "=========================================="
echo "  Starting Frontend Server"
echo "=========================================="
echo ""
echo "Application will be available at http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Start frontend
cd src/voting_frontend
npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null; exit" INT TERM

