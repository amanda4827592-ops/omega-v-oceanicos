@echo off
setlocal enabledelayedexpansion
title ΔVRØ HOUSE × Ω∞v OCEANICOS — Sovereign Desktop Application

echo ===================================================================
echo     ΔVRØ HOUSE × Ω∞v OCEANICOS — SOVEREIGN DESKTOP APPLICATION
echo     One Root · One Current · Infinite Forms · Ports 3000, 5000
echo ===================================================================
echo.

cd /d "%~dp0"

echo [1/3] Verifying Fastify API service (:5000)...
netstat -ano | findstr ":5000 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Starting Fastify API on port 5000...
    start "OceanicOS API :5000" /b cmd /c "set PORT=5000 && set OMEGA_AUTH_MODE=local && node apps/api/dist/index.js"
    timeout /t 2 /nobreak >nul
) else (
    echo Fastify API on port 5000 is already active.
)

echo [2/3] Verifying Web Frontend service (:3000)...
netstat -ano | findstr ":3000 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Starting Vite Web Preview on port 3000...
    start "OceanicOS Web :3000" /b cmd /c "cd apps/web && npx vite --port 3000 --host"
    timeout /t 2 /nobreak >nul
) else (
    echo Web service on port 3000 is already active.
)

echo [3/3] Launching OceanicOS as a Native Desktop App Window...

set "CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist "!CHROME_PATH!" (
    set "CHROME_PATH=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
)
if not exist "!CHROME_PATH!" (
    set "CHROME_PATH=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
)

set "EDGE_PATH=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not exist "!EDGE_PATH!" (
    set "EDGE_PATH=C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)

if exist "!CHROME_PATH!" (
    echo Launching with Google Chrome App Mode...
    start "" "!CHROME_PATH!" --app=http://localhost:3000 --window-size=1440,940
) else if exist "!EDGE_PATH!" (
    echo Launching with Microsoft Edge App Mode...
    start "" "!EDGE_PATH!" --app=http://localhost:3000 --window-size=1440,940
) else (
    echo Opening in default browser...
    start http://localhost:3000
)

echo.
echo ===================================================================
echo     OCEANICOS Ω∞v IS RUNNING AS A DESKTOP APPLICATION!
echo     URL: http://localhost:3000  ^| API: http://localhost:5000
echo ===================================================================
echo.
exit /b 0
