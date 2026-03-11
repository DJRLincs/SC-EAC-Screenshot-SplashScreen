<#
.SYNOPSIS
    Uninstalls DJRLincs Tweaks from the RSI Launcher
.DESCRIPTION
    Restores the original RSI Launcher from backup
.PARAMETER LauncherPath
    Custom path to RSI Launcher (default: Program Files)
#>

param(
    [string]$LauncherPath = "C:\Program Files\Roberts Space Industries\RSI Launcher"
)

# Self-elevate if not running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Requesting Administrator privileges..." -ForegroundColor Yellow
    $scriptPath = $MyInvocation.MyCommand.Path
    $tempScript = Join-Path $env:TEMP "Uninstall-DJRLincsTweaks.ps1"
    
    # Only copy if not already in temp
    if ($scriptPath -ne $tempScript) {
        Copy-Item $scriptPath $tempScript -Force
    }
    
    $argList = "-NoProfile -ExecutionPolicy Bypass -File `"$tempScript`""
    if ($LauncherPath -ne "C:\Program Files\Roberts Space Industries\RSI Launcher") { 
        $argList += " -LauncherPath `"$LauncherPath`"" 
    }
    Start-Process PowerShell -Verb RunAs -ArgumentList $argList
    exit
}

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DJRLincs Tweaks Uninstaller" -ForegroundColor Cyan
Write-Host "  Running as Administrator" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to begin"

$resourcesPath = Join-Path $LauncherPath "resources"
$appAsarPath = Join-Path $resourcesPath "app.asar"
$appAsarUnpackedPath = Join-Path $resourcesPath "app.asar.unpacked"
$backupPath = Join-Path $resourcesPath "app.asar.backup"
$backupUnpackedPath = Join-Path $resourcesPath "app.asar.unpacked.backup"

Write-Host "=== Configuration ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Launcher Path:  $LauncherPath"
Write-Host "  Resources Path: $resourcesPath"
Write-Host "  Backup Path:    $backupPath"
Write-Host "  Unpacked Backup: $backupUnpackedPath"
Write-Host ""
Read-Host "Press Enter to verify paths"

# Check backup exists
if (-not (Test-Path $backupPath)) {
    Write-Host "ERROR: No backup found at $backupPath" -ForegroundColor Red
    Write-Host "Cannot restore original launcher." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] Found backup file" -ForegroundColor Green

# Check current app.asar exists
if (-not (Test-Path $appAsarPath)) {
    Write-Host "ERROR: No app.asar found at $appAsarPath" -ForegroundColor Red
    Write-Host "RSI Launcher may not be installed correctly." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] Found current app.asar" -ForegroundColor Green

Write-Host ""
Write-Host "All checks passed!" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to START uninstall (or Ctrl+C to cancel)"

# Stop launcher if running
$launcher = Get-Process "RSI Launcher" -ErrorAction SilentlyContinue
if ($launcher) {
    Write-Host "Stopping RSI Launcher..." -ForegroundColor Yellow
    $launcher | Stop-Process -Force
    Start-Sleep -Seconds 2
    Write-Host "[OK] Launcher stopped" -ForegroundColor Green
}

# Restore backup
Write-Host "Restoring original launcher..." -ForegroundColor Yellow
try {
    Copy-Item $backupPath $appAsarPath -Force
    Write-Host "  Restored app.asar from backup" -ForegroundColor Gray
    
    # Restore unpacked folder if backup exists
    if (Test-Path $backupUnpackedPath) {
        if (Test-Path $appAsarUnpackedPath) {
            Remove-Item $appAsarUnpackedPath -Recurse -Force
        }
        Copy-Item $backupUnpackedPath $appAsarUnpackedPath -Recurse -Force
        Write-Host "  Restored app.asar.unpacked from backup" -ForegroundColor Gray
    } else {
        Write-Host "  [WARNING] No unpacked backup found - launcher may not work" -ForegroundColor Yellow
        Write-Host "  You may need to reinstall the RSI Launcher" -ForegroundColor Yellow
    }
    
    Write-Host "[OK] Restore complete" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Restore failed - $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "=== Uninstall Complete ===" -ForegroundColor Green
Write-Host "Original RSI Launcher has been restored." -ForegroundColor Cyan
Write-Host ""

# Ask to launch
$launch = Read-Host "Launch RSI Launcher now? (Y/N)"
if ($launch -eq "Y" -or $launch -eq "y") {
    Start-Process (Join-Path $LauncherPath "RSI Launcher.exe") -WindowStyle Hidden
}

Write-Host ""
Write-Host "Closing in 3 seconds..." -ForegroundColor Gray
Start-Sleep -Seconds 3
exit
