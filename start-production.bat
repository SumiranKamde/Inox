@echo off
setlocal enabledelayedexpansion
title INOX Factory Shift Management Hub (Production)

echo ===================================================================
echo   INOX AIR PRODUCTS - BHANDARA PLANT
echo   Monthly Shift Scheduling System (Production Server)
echo ===================================================================
echo.

:: 1. Find local IP address on LAN
set "LOCAL_IP=127.0.0.1"
for /f "tokens=4" %%a in ('route print 0.0.0.0 ^| findstr 0.0.0.0 ^| findstr /v "Default"') do (
    if not "%%a"=="" set "LOCAL_IP=%%a"
)

:: 2. Check and start MongoDB Daemon
echo [1/3] Starting Local MongoDB Database...
start "Inox MongoDB Daemon" "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath "%~dp0data\db" --bind_ip 0.0.0.0 --port 27017

timeout /t 2 /nobreak >nul

:: 3. Build frontend if dist doesn't exist
if not exist "%~dp0frontend\dist" (
    echo [2/3] Building Frontend UI for production...
    cd /d "%~dp0frontend" && call npm run build
    cd /d "%~dp0"
) else (
    echo [2/3] Frontend production bundle verified.
)

:: 4. Start Production Server (Single Port 5000 serving both API & UI)
echo [3/3] Launching Production Server on Port 5000...
start "Inox Production Server" cmd /k "cd /d "%~dp0backend" && set NODE_ENV=production && node src/server.js"

timeout /t 2 /nobreak >nul

echo.
echo ===================================================================
echo   APPLICATION IS RUNNING!
echo.
echo   Local Access (This PC):
echo     http://localhost:5000
echo.
echo   Network Access (Other PCs/Tablets on Factory Wi-Fi/LAN):
echo     http://%LOCAL_IP%:5000
echo.
echo   Default Supervisor Login:
echo     Email:    admin@inox.com
echo     Password: admin123
echo ===================================================================
echo.
echo Press any key to open the application in your browser...
pause >nul
start http://localhost:5000
