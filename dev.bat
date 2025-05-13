@echo off
echo Starting backend...
start cmd /k "cd backend && venv\Scripts\activate && uvicorn app.main:app --reload"

echo Starting frontend...
start cmd /k "cd frontend && npm run dev"

echo Both backend and frontend are starting in separate terminals.
pause