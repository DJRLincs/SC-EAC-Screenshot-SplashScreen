@echo off
echo Starting DJRLincs Tweaks Installer...
echo.

:: Copy files to temp and run from there
copy /Y "%~dp0Install-DJRLincsTweaks.ps1" "%TEMP%\Install-DJRLincsTweaks.ps1" >nul
copy /Y "%~dp0scr_tab_inline.js" "%TEMP%\scr_tab_inline.js" >nul

powershell -NoProfile -ExecutionPolicy Bypass -File "%TEMP%\Install-DJRLincsTweaks.ps1"
