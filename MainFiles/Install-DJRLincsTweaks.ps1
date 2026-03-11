<#
.SYNOPSIS
    Installs DJRLincs Tweaks into the RSI Launcher
.DESCRIPTION
    This script injects scr_tab_inline.js into the RSI Launcher, adding:
    - SCR (Star Citizen Racing) tab with latest runs and events
    - DJRLincs Tweaks settings panel (custom backgrounds, etc.)
.PARAMETER LauncherPath
    Custom path to RSI Launcher (default: Program Files)
.EXAMPLE
    .\Install-DJRLincsTweaks.ps1
#>

param(
    [string]$LauncherPath = "C:\Program Files\Roberts Space Industries\RSI Launcher"
)

# Self-elevate if not running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Requesting Administrator privileges..." -ForegroundColor Yellow
    $scriptPath = $MyInvocation.MyCommand.Path
    $scriptDir = Split-Path $scriptPath -Parent
    $tempScript = Join-Path $env:TEMP "Install-DJRLincsTweaks.ps1"
    $tempInject = Join-Path $env:TEMP "scr_tab_inline.js"
    
    # Only copy if not already in temp
    if ($scriptPath -ne $tempScript) {
        Copy-Item $scriptPath $tempScript -Force
        $srcInject = Join-Path $scriptDir "scr_tab_inline.js"
        if (Test-Path $srcInject) {
            Copy-Item $srcInject $tempInject -Force
        }
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
$appAsarUnpackedPath = Join-Path $resourcesPath "app.asar.unpacked"
$backupPath = Join-Path $resourcesPath "app.asar.backup"
# Check if running from temp (elevated) or original location
$scriptDir = $PSScriptRoot
if ([string]::IsNullOrEmpty($scriptDir)) { $scriptDir = $env:TEMP }
$injectScript = Join-Path $scriptDir "scr_tab_inline.js"
if (-not (Test-Path $injectScript)) {
    $injectScript = Join-Path $env:TEMP "scr_tab_inline.js"
}
$tempDir = Join-Path $env:TEMP "rsi-djrlincs-patch"

Write-Host "=== DJRLincs Tweaks Installer ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Launcher Path:  $LauncherPath"
Write-Host "  Resources Path: $resourcesPath"
Write-Host "  Script Dir:     $scriptDir"
Write-Host "  Inject Script:  $injectScript"
Write-Host "  Temp Dir:       $tempDir"
Write-Host "  DevTools:       $EnableDevTools"
Write-Host ""
Read-Host "Press Enter to verify paths"

# Check if launcher exists
if (-not (Test-Path $appAsarPath)) {
    Write-Host "ERROR: RSI Launcher not found at $LauncherPath" -ForegroundColor Red
    Write-Host "Use -LauncherPath to specify custom location" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] Found app.asar" -ForegroundColor Green

# Check if inject script exists
if (-not (Test-Path $injectScript)) {
    Write-Host "ERROR: scr_tab_inline.js not found in $scriptDir" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] Found scr_tab_inline.js" -ForegroundColor Green

# Check for asar tool
$asarCmd = Get-Command npx -ErrorAction SilentlyContinue
if (-not $asarCmd) {
    Write-Host "ERROR: Node.js/npx not found. Please install Node.js first." -ForegroundColor Red
    Write-Host "https://nodejs.org/en/download/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] Found npx" -ForegroundColor Green
Write-Host ""
Write-Host "All checks passed!" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to START installation (or Ctrl+C to cancel)"

# Stop launcher if running
$launcher = Get-Process "RSI Launcher" -ErrorAction SilentlyContinue
if ($launcher) {
    Write-Host "Stopping RSI Launcher..." -ForegroundColor Yellow
    $launcher | Stop-Process -Force
    Start-Sleep -Seconds 2
}

# Switch to local temp directory (npx/CMD doesn't support UNC paths)
$originalLocation = Get-Location
Set-Location $env:TEMP

# Create backup if not exists
$backupUnpackedPath = Join-Path $resourcesPath "app.asar.unpacked.backup"
if (-not (Test-Path $backupPath)) {
    Write-Host "Creating backup of original app.asar..." -ForegroundColor Yellow
    Copy-Item $appAsarPath $backupPath -Force
    # Also backup the unpacked folder if it exists
    if (Test-Path $appAsarUnpackedPath) {
        Write-Host "Creating backup of original app.asar.unpacked..." -ForegroundColor Yellow
        Copy-Item $appAsarUnpackedPath $backupUnpackedPath -Recurse -Force
    }
    Write-Host "[OK] Backup created" -ForegroundColor Green
} else {
    # Check if backup looks valid (should be smaller than ~200MB for unpatched)
    $backupSize = (Get-Item $backupPath).Length
    $currentSize = (Get-Item $appAsarPath).Length
    if ($backupSize -eq $currentSize) {
        Write-Host "[WARNING] Backup exists but is same size as current app.asar" -ForegroundColor Yellow
        Write-Host "          Backup may be from a previous patched version" -ForegroundColor Yellow
        Write-Host "          To get a clean backup: reinstall RSI Launcher first" -ForegroundColor Yellow
    } else {
        Write-Host "[OK] Backup already exists ($([int]($backupSize/1MB))MB)" -ForegroundColor Green
    }
}

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

if (-not (Test-Path (Join-Path $tempDir "app\index.html"))) {
    Write-Host "ERROR: Extraction failed - app\index.html not found" -ForegroundColor Red
    Write-Host "Temp dir: $tempDir" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] Extraction complete" -ForegroundColor Green
Read-Host "Press Enter to continue to injection"

# Inject script into index.html
Write-Host "Injecting SCR tab and DJRLincs Tweaks..." -ForegroundColor Yellow
$indexPath = Join-Path $tempDir "app\index.html"
try {
    $indexContent = Get-Content $indexPath -Raw
    $scriptContent = Get-Content $injectScript -Raw -Encoding UTF8
    Write-Host "  Script size: $($scriptContent.Length) chars" -ForegroundColor Gray
    
    $injection = "`n<script>`n$scriptContent`n</script>`n</body>"
    $newContent = $indexContent -replace "</body>", $injection
    Set-Content -Path $indexPath -Value $newContent -Encoding UTF8
    Write-Host "[OK] Script injected" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Injection failed - $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

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
    Write-Host "ERROR: Packing failed - patched_app.asar not created" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] Packing complete" -ForegroundColor Green
Read-Host "Press Enter to install to launcher"

# Install
Write-Host "Installing to launcher..." -ForegroundColor Yellow
try {
    Copy-Item $patchedAsar $appAsarPath -Force
    Write-Host "  Copied app.asar" -ForegroundColor Gray
    
    # Copy unpacked folder if exists
    $patchedUnpacked = "$patchedAsar.unpacked"
    if (Test-Path $patchedUnpacked) {
        if (Test-Path $appAsarUnpackedPath) {
            Remove-Item $appAsarUnpackedPath -Recurse -Force
        }
        Copy-Item $patchedUnpacked $appAsarUnpackedPath -Recurse -Force
        Write-Host "  Copied app.asar.unpacked" -ForegroundColor Gray
    }
    Write-Host "[OK] Installation complete" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Installation failed - $_" -ForegroundColor Red
    Write-Host "Make sure you're running as Administrator" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Cleanup
Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $patchedAsar -Force -ErrorAction SilentlyContinue
Remove-Item $patchedUnpacked -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== Installation Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Features installed:" -ForegroundColor Cyan
Write-Host "  - SCR (Star Citizen Racing) tab"
Write-Host "  - Latest runs with track images"
Write-Host "  - Upcoming events"
Write-Host "  - DJRLincs Tweaks settings panel"
Write-Host "  - Custom background support"
Write-Host ""
Write-Host "To restore original launcher, run:" -ForegroundColor Yellow
Write-Host "  Copy-Item '$backupPath' '$appAsarPath' -Force"
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
