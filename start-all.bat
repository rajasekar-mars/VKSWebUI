@echo off
echo Starting VKS WebUI Application...
echo.

REM Set the working directory
cd /d "C:\Users\rajas\OneDrive\Documents\GitHub\VKSWebUI"

echo [1/3] Starting Flask Backend...
start "Flask Backend" cmd /k ".\venv\Scripts\activate && python backend\app.py"

echo [2/3] Starting WhatsApp Bot...
start "WhatsApp Bot" cmd /k "node whatsapp-bot\bot.js"

echo [3/3] Starting React Frontend...
start "React Frontend" cmd /k "cd frontend && npm start"

echo.
echo ✅ All services are starting...
echo.
echo Services running:
echo - Flask Backend: http://localhost:5000
echo - React Frontend: http://localhost:3000  
echo - WhatsApp Bot API: http://localhost:3001
echo.
echo Press any key to exit this launcher...
pause > nul
