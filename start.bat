@echo off
echo ========================================================
echo  Starting Inox Factory Employee & Shift Scheduling Hub
echo ========================================================

echo 1. Checking MongoDB...
start "Inox MongoDB Daemon" "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath "%~dp0data\db" --bind_ip 127.0.0.1 --port 27017

timeout /t 2 /nobreak >nul

echo 2. Starting Backend API Server (Port 5000)...
start "Inox Backend Server" cmd /k "cd /d "%~dp0backend" && node src/server.js"

timeout /t 2 /nobreak >nul

echo 3. Starting Frontend React + Vite UI (Port 5173)...
start "Inox Frontend UI" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo ========================================================
echo  System Initialized!
echo  Open browser at: http://localhost:5173
echo  Default Login: admin@inox.com / admin123
echo ========================================================
pause
