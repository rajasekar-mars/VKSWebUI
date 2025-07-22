# VKS WebUI Startup Script
Write-Host "Starting VKS WebUI Application..." -ForegroundColor Green
Write-Host ""

# Set the working directory
Set-Location "C:\Users\rajas\OneDrive\Documents\GitHub\VKSWebUI"

Write-Host "[1/3] Starting Flask Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& { .\venv\Scripts\Activate.ps1; python backend\app.py }" -WindowStyle Normal

Write-Host "[2/3] Starting WhatsApp Bot..." -ForegroundColor Yellow  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& { node whatsapp-bot\bot.js }" -WindowStyle Normal

Write-Host "[3/3] Starting React Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& { cd frontend; npm start }" -WindowStyle Normal

Write-Host ""
Write-Host "✅ All services are starting..." -ForegroundColor Green
Write-Host ""
Write-Host "Services running:" -ForegroundColor Cyan
Write-Host "- Flask Backend: http://localhost:5000" -ForegroundColor White
Write-Host "- React Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "- WhatsApp Bot API: http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit this launcher..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
