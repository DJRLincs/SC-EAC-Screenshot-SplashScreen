# Reddit Post Draft for r/starcitizen

---

## Title Options (pick one):

1. **I made a launcher mod that adds SCR Racing integration + custom backgrounds & splash screens**
2. **DJRLincs Tweaks - Customize your RSI Launcher with racing data, custom backgrounds, and more**
3. **Added a new tab to the RSI Launcher for Star Citizen Racing + customization features**

---

## Post Body:

Hey Citizens o7! 👋

I've been working on a launcher modification called **DJRLincs Tweaks** that adds some features I always wanted:

### 🏎️ SCR Racing Tab
- View the **latest racing runs** directly in your launcher
- Track images as card backgrounds
- Country flags next to racer names
- **Upcoming events** with countdown timers
- Direct links to the SCR website

### 🎨 Launcher Customization
- **Custom backgrounds** - use your own images or videos
- **Background presets** - several options built-in
- **🎠 Carousel mode** - rotate through multiple backgrounds automatically
- **🎵 Music replacement** - use your own background music
- **Opacity slider** - adjust background visibility

### 🖼️ EAC Splash Screen Generator
- Replace the boring EasyAntiCheat loading screen
- Automatically resizes images to the correct 800x450 dimensions
- Auto-detects your Star Citizen install location
- One-click download + path copy

---

## Installation (One-Click)

> ⚠️ **Note:** The GitHub repo isn't fully updated yet - it will be Soon™ once I'm more happy with the state of the project. Stay tuned!

1. Download from [GitHub](https://github.com/DJRLincs/SC-EAC-Screenshot-SplashScreen)
2. Open the `MainFiles` folder
3. **Double-click `Install.bat`**

That's it! The script backs up your original launcher files and handles everything.

**To uninstall:** Double-click `Uninstall.bat` and you're back to stock.

---

## Screenshots

[TODO: Add screenshots showing:]
- SCR tab with race runs
- DJRLincs Tweaks settings panel
- Custom background example
- Splash screen generator

---

## Technical Details

- Works with RSI Launcher 2.0+
- Pure JavaScript injection (no external dependencies at runtime)
- Settings persist in localStorage
- Full backup/restore via PowerShell scripts
- Optional DevTools support for developers

---

## FAQ

**Q: Is this safe?**
A: The installer creates backups of your original launcher files. Uninstalling restores them completely. No game files are modified.

**Q: Will this break with launcher updates?**
A: Possibly. When CIG updates the launcher, you may need to re-run the installer. The worst case is just running Uninstall.bat to restore the original.

**Q: Does this affect game performance?**
A: No. This only modifies the launcher UI, not the game itself.

**Q: Can I get banned?**
A: This modifies only the launcher (Electron app), not the game client. However, use at your own discretion.

---

## Coming Soon

- More background presets
- Additional SCR data integration
- Org support features

---

Feedback and suggestions welcome! Check out the [GitHub repo](https://github.com/DJRLincs/SC-EAC-Screenshot-SplashScreen) for the source code.

o7

---

## Suggested Flair: `CREATIVE`

Available flairs for r/starcitizen:
- **CREATIVE** ← Best fit (fan-made tools/mods)
- TECHNICAL (also appropriate - launcher modification)
- DISCUSSION, GAMEPLAY, OTHER, SOCIAL, etc.

## Cross-post to:
- Star Citizen Discord communities
- Spectrum forums (Technical Support or Community)

---

## Notes for posting:

1. Upload screenshots to Imgur or include as Reddit image post
2. Consider posting on a weekend for better visibility
3. Reply to comments promptly to boost engagement
4. If using Reddit's new editor, use the fancy editor for proper formatting
