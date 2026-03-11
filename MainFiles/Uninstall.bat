@echo off
echo Starting DJRLincs Tweaks Uninstaller...
echo.

:: Copy to temp and run from there
copy /Y "%~dp0Uninstall-DJRLincsTweaks.ps1" "%TEMP%\Uninstall-DJRLincsTweaks.ps1" >nul

powershell -NoProfile -ExecutionPolicy Bypass -File "%TEMP%\Uninstall-DJRLincsTweaks.ps1"
