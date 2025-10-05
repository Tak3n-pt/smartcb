@echo off
echo ====================================
echo  GitHub Setup for SmartCB Project
echo ====================================
echo.

cd "C:\Users\3440\Desktop\electricity app\smartcb"

echo Step 1: Authenticate with GitHub
echo ---------------------------------
"C:\Program Files\GitHub CLI\gh.exe" auth login

echo.
echo Step 2: Create repository and push code
echo ----------------------------------------
"C:\Program Files\GitHub CLI\gh.exe" repo create smartcb-app --public --source=. --remote=origin --push --description="Smart Circuit Breaker Mobile App - React Native + Expo"

echo.
echo ====================================
echo  Setup Complete!
echo ====================================
echo.
echo Your repository is now available at:
"C:\Program Files\GitHub CLI\gh.exe" repo view --web

pause