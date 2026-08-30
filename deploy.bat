@echo off
rem ===== Deploy to GitHub Pages =====
rem Run this script after editing any file in this folder.
rem Website: https://hub-ship.github.io/-/

cd /d "%~dp0"

git add .
if %errorlevel% neq 0 goto fail

git commit -m "update site %date% %time%"
rem no changes = commit fails, that is fine

git push origin main
if %errorlevel% neq 0 goto fail

echo.
echo ==========================================
echo  SUCCESS! Deployed to GitHub Pages.
echo  Visit: https://hub-ship.github.io/-/
echo ==========================================
pause
exit /b 0

:fail
echo.
echo ==========================================
echo  FAILED. Check the message above.
echo ==========================================
pause
exit /b 1
