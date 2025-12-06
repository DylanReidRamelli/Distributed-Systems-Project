# How to Run the Application

## Local Server Setup

### Start the Application

Run the startup script:

```bash
./start.sh
```

Or manually:

```bash
# Terminal 1: Start backend server
cd src/voting_backend_server
node server.js

# Terminal 2: Start frontend server
cd src/voting_frontend
npm run dev
```

### Access the Application

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:4943

### Stop the Application

Press `Ctrl+C` in the terminal where the servers are running.

To stop all processes:

```bash
pkill -f "node server.js"
pkill -f "vite"
```

