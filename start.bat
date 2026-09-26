@echo off
echo ===============================================================================
echo                SATQUERY AI - MULTIMODAL REMOTE SENSING INTELLIGENCE
echo                       ISRO Problem Statement 26167 Prototype
echo ===============================================================================
echo.

echo [1/3] Starting SatQuery AI FastAPI Backend on http://127.0.0.1:8000 ...
start "SatQuery Backend" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

echo [2/3] Starting SatQuery AI Vite Frontend on http://127.0.0.1:3000 ...
start "SatQuery Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo [3/3] Services launched!
echo       Frontend: http://127.0.0.1:3000
echo       Backend API Docs: http://127.0.0.1:8000/docs
echo       System Health: http://127.0.0.1:8000/health
echo.
echo Press any key to exit this launcher window...
pause >nul
