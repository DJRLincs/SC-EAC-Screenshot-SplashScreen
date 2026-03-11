<p align="center">
  <img alt="ImageExample" src="https://cdn.discordapp.com/attachments/1077537871382196314/1077537871508021278/5n69n2xv5p681.png?ex=66278dd8&is=661518d8&hm=3c891eeb3ca1b61f0aa878686892b3ce81a0c6957f884a3ff7d0807849092d4c&" width="750px">
</p>
<h1 align="center">DJRLincs Tweaks for RSI Launcher</h1>

<h5 align="center">"Enhance your RSI Launcher with SCR Racing integration and customization options"</h5>

<p align="center">
  <a href="https://github.com/DavidRoseLincs/SC-EAC-Screenshot-SplashScreen//releases">
    <img src="https://img.shields.io/github/v/release/DJRLincs/SC-EAC-Screenshot-SplashScreen?label=Release&logo=GitHub&sort=semver&style=for-the-badge">
  </a>
  
  <a href="https://github.com/DJRLincs/SC-EAC-Screenshot-SplashScreen/commits/master">
    <img src="https://img.shields.io/github/last-commit/DJRLincs/SC-EAC-Screenshot-SplashScreen?logo=GitHub&style=for-the-badge">
  </a>
</p>

<br>

# What is this?

DJRLincs Tweaks is a launcher modification that adds:

- **SCR (Star Citizen Racing) Tab** - View latest racing runs, track images, and upcoming events directly in your launcher
- **DJRLincs Tweaks Panel** - Customize your launcher background with presets or custom images
- **Country Flags** - See racer nationalities with flag icons
- **Track Images** - Beautiful track header images on run cards
- **Optional DevTools** - For developers who want to inspect the launcher

## Features

### SCR Racing Integration
- Latest runs from Star Citizen Racing leaderboards
- Track images as card backgrounds
- Upcoming events with countdown timers
- Direct links to SCR website

### Customization
- Multiple background presets
- Custom image URL support
- Settings persist across sessions

## Requirements

- **Windows** (PowerShell 5.1+)
- **Node.js** - [Download here](https://nodejs.org/en/download/)
- **RSI Launcher 2.0+**

## Installation

### Quick Install (Recommended)

1. Download or clone this repository
2. Open the `MainFiles` folder
3. **Double-click `Install.bat`**

That's it! The script will request admin privileges and handle everything.

### Alternative: PowerShell

```powershell
powershell -ExecutionPolicy Bypass -File ".\Install-DJRLincsTweaks.ps1"
```

### Custom Launcher Location

```powershell
powershell -ExecutionPolicy Bypass -File ".\Install-DJRLincsTweaks.ps1" -LauncherPath "D:\Games\RSI Launcher"
```

### Enable DevTools (For Development)

After installing, run `EnableDevTools.bat` to add Chrome DevTools support.

## Uninstallation

**Double-click `Uninstall.bat`** to restore the original launcher.

Or via PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File ".\Uninstall-DJRLincsTweaks.ps1"
```

Or manually:
```powershell
Copy-Item "C:\Program Files\Roberts Space Industries\RSI Launcher\resources\app.asar.backup" "C:\Program Files\Roberts Space Industries\RSI Launcher\resources\app.asar" -Force
```

## Files

| File | Description |
|------|-------------|
| `Install.bat` | Double-click to install |
| `Uninstall.bat` | Double-click to restore original |
| `EnableDevTools.bat` | Optional: Add DevTools support |
| `Install-DJRLincsTweaks.ps1` | PowerShell installer |
| `Uninstall-DJRLincsTweaks.ps1` | PowerShell uninstaller |
| `Enable-DevTools.ps1` | PowerShell DevTools enabler |
| `scr_tab_inline.js` | Main injection script (~100KB) |
| `archive/` | Old Python scripts (deprecated) |

## How It Works

The installer:
1. Extracts `app.asar` from the RSI Launcher
2. Injects `scr_tab_inline.js` into the launcher's HTML
3. Repacks and installs the modified launcher

Backups are automatically created:
- `app.asar.backup` - Original launcher archive
- `app.asar.unpacked.backup` - Original native modules folder

The optional DevTools enabler (`EnableDevTools.bat`) applies additional patches to `lib/main.js`.

## Troubleshooting

**Launcher won't start after installation:**
- Run `Uninstall.bat` to restore original
- Make sure Node.js is installed (`node --version`)

**Launcher crashes after uninstall:**
- This can happen if the backup is missing the `.unpacked` folder
- Reinstall the RSI Launcher from https://robertsspaceindustries.com/download
- Then run Install.bat again to create a fresh backup

**SCR data not loading:**
- Check your internet connection
- The SCR API may be temporarily unavailable

**"Access denied" errors:**
- Make sure to run PowerShell as Administrator

# History

This project evolved from a simple EAC splash screen replacer (2022) into a full launcher customization system:

- **2022** - Original EAC splash screen script by thorax (@Mattie) on [Reddit](https://www.reddit.com/r/starcitizen/comments/rkmz93/fyi_we_can_have_custom_splash_screens_now_until/)
- **2023** - @DJRLincs added carousel/music customization with Python scripts
- **2026** - Complete rewrite with direct launcher injection, SCR integration, and DJRLincs Tweaks panel

# Help

Join [ARMCO](https://discord.gg/armco) and ask for help in the [Thread](https://discord.com/channels/222052888531173386/1077537871382196314).

# Contributors

Big thanks to all of the people who worked on this project!

<a href="https://github.com/DJRLincs/SC-EAC-Screenshot-SplashScreen/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=DJRLincs/SC-EAC-Screenshot-SplashScreen" />
</a>

# Roadmap

- [x] SCR Racing tab integration
- [x] Custom background support
- [x] Track images on run cards
- [x] Country flags for racers
- [x] One-click PowerShell installer
- [ ] Server status integration
- [ ] Custom music support
- [ ] More background presets

# Statistics

![Alt](https://repobeats.axiom.co/api/embed/2d3835c88c0331b8e22a2fa12597c52b32adb6b7.svg "Repobeats analytics image")

![Alt](https://repobeats.axiom.co/api/embed/2d3835c88c0331b8e22a2fa12597c52b32adb6b7.svg "Repobeats analytics image")

