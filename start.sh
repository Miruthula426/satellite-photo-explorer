#!/usr/bin/env bash
# SatQuery AI — Multi-Service Startup Script (Linux/macOS)
# ISRO Problem Statement 26167 Prototype

echo "==============================================================================="
echo "               SATQUERY AI - MULTIMODAL REMOTE SENSING INTELLIGENCE"
echo "                      ISRO Problem Statement 26167 Prototype"
echo "==============================================================================="
echo ""

# Start Backend
echo "[1/3] Starting FastAPI Backend on http://127.0.0.1:8000..."
(cd backend && python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000) &
BACKEND_PID=$!

# Start Frontend
echo "[2/3] Starting Vite Frontend on http://127.0.0.1:3000..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "[3/3] Services launched!"
echo "      Frontend: http://127.0.0.1:3000"
echo "      Backend API: http://127.0.0.1:8000/docs"
echo "      System Health: http://127.0.0.1:8000/health"
echo ""
echo "Press Ctrl+C to stop all services."

cleanup() {
    echo "Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM
wait
