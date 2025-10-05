@echo off
echo ====================================
echo    SmartCB App Launcher
echo ====================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Download the LTS version and install it.
    echo.
    pause
    exit /b 1
)

echo [1/3] Checking Node.js... OK
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [2/3] Installing dependencies (first time only)...
    echo This will take 2-3 minutes. Please wait...
    echo.
    call npm install
    echo.
) else (
    echo [2/3] Dependencies already installed... OK
    echo.
)

echo [3/3] Starting SmartCB App...
echo.
echo ============================================
echo  INSTRUCTIONS:
echo ============================================
echo  1. Install "Expo Go" app on your phone
echo  2. Scan the QR code below with your phone
echo  3. The app will open automatically!
echo.
echo  Or press 'w' to open in web browser
echo ============================================
echo.

npx expo start

pause