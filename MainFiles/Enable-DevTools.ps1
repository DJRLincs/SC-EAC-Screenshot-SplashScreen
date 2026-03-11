<#
.SYNOPSIS
    Enables DevTools in the RSI Launcher
.DESCRIPTION
    Patches the RSI Launcher to enable Chrome DevTools for debugging.
    DevTools will auto-open when the launcher starts.
    Run AFTER Install-DJRLincsTweaks.ps1
.PARAMETER LauncherPath
    Custom path to RSI Launcher (default: Program Files)
.EXAMPLE
    .\Enable-DevTools.ps1
#>

param(
    [string]$LauncherPath = "C:\Program Files\Roberts Space Industries\RSI Launcher"
)

# Self-elevate if not running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Requesting Administrator privileges..." -ForegroundColor Yellow
    $scriptPath = $MyInvocation.MyCommand.Path
    $tempScript = Join-Path $env:TEMP "Enable-DevTools.ps1"
    
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

# Paths
$resourcesPath = Join-Path $LauncherPath "resources"
$appAsarPath = Join-Path $resourcesPath "app.asar"
$tempDir = Join-Path $env:TEMP "rsi-devtools-patch"

Write-Host "=== RSI Launcher DevTools Enabler ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Launcher Path:  $LauncherPath"
Write-Host "  Resources Path: $resourcesPath"
Write-Host ""
Read-Host "Press Enter to verify paths"

# Check if launcher exists
if (-not (Test-Path $appAsarPath)) {
    Write-Host "ERROR: RSI Launcher not found at $LauncherPath" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] Found app.asar" -ForegroundColor Green

# Check for asar tool
$asarCmd = Get-Command npx -ErrorAction SilentlyContinue
if (-not $asarCmd) {
    Write-Host "ERROR: Node.js/npx not found. Please install Node.js first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] Found npx" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to enable DevTools (or Ctrl+C to cancel)"

# Stop launcher if running
$launcher = Get-Process "RSI Launcher" -ErrorAction SilentlyContinue
if ($launcher) {
    Write-Host "Stopping RSI Launcher..." -ForegroundColor Yellow
    $launcher | Stop-Process -Force
    Start-Sleep -Seconds 2
    Write-Host "[OK] Launcher stopped" -ForegroundColor Green
}

# Switch to local temp directory (npx/CMD doesn't support UNC paths)
Set-Location $env:TEMP

# Clean temp dir
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}

# Extract
Write-Host "Extracting app.asar..." -ForegroundColor Yellow
try {
    $extractOutput = npx asar extract $appAsarPath $tempDir 2>&1
    Write-Host $extractOutput -ForegroundColor Gray
} catch {
    Write-Host "Extract error: $_" -ForegroundColor Red
}

if (-not (Test-Path (Join-Path $tempDir "lib\main.js"))) {
    Write-Host "ERROR: Extraction failed - lib\main.js not found" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] Extraction complete" -ForegroundColor Green

# Apply DevTools patches
Write-Host "Enabling DevTools..." -ForegroundColor Yellow
$mainJsPath = Join-Path $tempDir "lib\main.js"
$mainJs = [System.IO.File]::ReadAllText($mainJsPath)

# Apply all DevTools patches
$mainJs = $mainJs.Replace('devTools:pe||he', 'devTools:true')
$mainJs = $mainJs.Replace('new at(this.window,pe||he,this.storeService)', 'new at(this.window,true,this.storeService)')
$mainJs = $mainJs.Replace('this.debugMode&&(U.default.info("CommandOrControl+Alt+Shift+I', '(true)&&(U.default.info("CommandOrControl+Alt+Shift+I')
$mainJs = $mainJs.Replace('this._window.show()', 'this._window.show();this._window.webContents.openDevTools({mode:"right"})')

[System.IO.File]::WriteAllText($mainJsPath, $mainJs)
Write-Host "[OK] DevTools patches applied" -ForegroundColor Green

# Pack
Write-Host "Packing modified launcher..." -ForegroundColor Yellow
$patchedAsar = Join-Path $env:TEMP "patched_app.asar"
try {
    $packOutput = npx asar pack $tempDir $patchedAsar --unpack-dir "node_modules/@cig/**" 2>&1
    Write-Host $packOutput -ForegroundColor Gray
} catch {
    Write-Host "Pack error: $_" -ForegroundColor Red
}

if (-not (Test-Path $patchedAsar)) {
    Write-Host "ERROR: Packing failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] Packing complete" -ForegroundColor Green

# Install
Write-Host "Installing to launcher..." -ForegroundColor Yellow
try {
    Copy-Item $patchedAsar $appAsarPath -Force
    
    # Copy unpacked folder if exists
    $patchedUnpacked = "$patchedAsar.unpacked"
    $appAsarUnpackedPath = Join-Path $resourcesPath "app.asar.unpacked"
    if (Test-Path $patchedUnpacked) {
        if (Test-Path $appAsarUnpackedPath) {
            Remove-Item $appAsarUnpackedPath -Recurse -Force
        }
        Copy-Item $patchedUnpacked $appAsarUnpackedPath -Recurse -Force
    }
    Write-Host "[OK] Installation complete" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Installation failed - $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Cleanup
Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $patchedAsar -Force -ErrorAction SilentlyContinue
Remove-Item $patchedUnpacked -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== DevTools Enabled ===" -ForegroundColor Green
Write-Host "DevTools will auto-open when launcher starts." -ForegroundColor Cyan
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
