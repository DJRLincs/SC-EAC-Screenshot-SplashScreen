@echo off
echo Enabling DevTools in RSI Launcher...
echo.

:: Copy to temp and run from there
copy /Y "%~dp0Enable-DevTools.ps1" "%TEMP%\Enable-DevTools.ps1" >nul

powershell -NoProfile -ExecutionPolicy Bypass -File "%TEMP%\Enable-DevTools.ps1"
