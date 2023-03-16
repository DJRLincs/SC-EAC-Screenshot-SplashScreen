<p align="center">
  <img alt="ImageExample" src="https://cdn.discordapp.com/attachments/737301647440740453/1077544580737662976/banner.png" width="750px">
</p>

<h1 align="center">RSI Launcher Editor</h1>

<h5 align="center">"A simple and easy way to edit and change anything in the RSI Launcher for a normal user"</h5>

<p align="center">
  <a href="https://github.com/DavidRoseLincs/SC-EAC-Screenshot-SplashScreen//releases">
    <img src="https://img.shields.io/github/v/release/DJRLincs/SC-EAC-Screenshot-SplashScreen?label=Release&logo=GitHub&sort=semver&style=for-the-badge">
  </a>
  
  <a href="https://github.com/DJRLincs/SC-EAC-Screenshot-SplashScreen/commits/master">
    <img src="https://img.shields.io/github/last-commit/DJRLincs/SC-EAC-Screenshot-SplashScreen?logo=GitHub&style=for-the-badge">
  </a>
  
  
  
</p>

<br>

# What the hell does this do?
Orginally This bat's function is to replace the images that appear on your [EAC](https://www.easy.ac/) loading screen with images from your [Star Citizen](https://robertsspaceindustries.com/enlist?referral=STAR-56VG-HCMC) screenshots folder or another location, replacing a different image each time the bat is used. We have started to make big changes to the launcher itself after a lot of work and effort from many individuals, including the wallpaper and eventually music. We may even add a status page to the launcher, depending on the ingenuity and labour of the people developing and maintaining this project. things change and we are starting to move to the future just like [Star Citizen](https://robertsspaceindustries.com/enlist?referral=STAR-56VG-HCMC) itself.

# History
This was originally created in 2022 by thorax (@Mattie) on [Reddit](https://www.reddit.com/r/starcitizen/comments/rkmz93/fyi_we_can_have_custom_splash_screens_now_until/). @DJSLincs was kingflashroseG when this post was originally made. @DJSLincs later added comments and a lot more QOL for people who weren't as tech-savvy as @Mattie was. @DJSLincs then created the .bat files and have been using them on his own system for the past year(2022).

# Requirements 🧾 (ALL OF THIS DOWNLOADS AUTOMATICALLY WITH THE BAT AS OF 14/03/23)
- Python 3.8 or above (https://www.python.org/downloads)
  - Recommended version [3.10.2](https://www.python.org/downloads/release/python-3102/)
- Node.js Any Version (https://nodejs.org/en/download/)
  - this is what does the compiling for the launcher wallpaper's [Node.js](https://nodejs.org/en/download/)
- [Pillow](https://pillow.readthedocs.io/en/stable/installation.html)
  - Installs when the script is ran that requires it
- Patience
  - Take youre time if you need help just ask trust me


# How to use ✨
1. Download the [Project](https://github.com/DJRLincs/SC-EAC-Screenshot-SplashScreen/releases/tag/0.0.3) into a zip folder.

2. Download and install [Python](https://www.python.org/downloads/release/python-3102/) if you haven't already. (It can be installed for you with the bat automatically)

   ![](https://i.alexflipnote.dev/2Ucs5Hf.png)

3. Download and install [Node.js](https://nodejs.org/en/download/) if you haven't already. (It can be installed for you with the bat automatically)

4. Download and install [Pillow](https://pypi.org/project/Pillow/) if you haven't already. (It can be installed for you with the bat automatically)

5. Extract the zip folder into a location of your choice. (I recommend your desktop)

6. Open the folder and run the "Start_Basic_Win - Rotate_Splash_Screen.bat" file. please try to keep the .bat files in the same place as the .py files as they are hardcoded to open them in the same location currently.

7. Follow the prompts and enter the required information. (You will need to enter your [Star Citizen](https://robertsspaceindustries.com/enlist?referral=STAR-56VG-HCMC) screenshots folder location, and your [Star Citizen](https://robertsspaceindustries.com/enlist?referral=STAR-56VG-HCMC) EasyAntiCheat Folder and or your [Star Citizen](https://robertsspaceindustries.com/enlist?referral=STAR-56VG-HCMC) Launcher folder resources folder location)

8. Once you had run that bat run Start_Basic_Win - Rotate_Launcher_Carousel.bat" file. please try to keep the .bat files in the same place as the .py files as they are hardcoded to open them in the same location currently.



# Make the Bat's Automatic [OPTIONAL]:

- now their is two Bat files still left over depending on youre prefrence

  - "RSI Launcher.bat" Boots the launcher normally with the bat ran (You will need to edit the bat to double check its openning stuff in the right locations)

  - "RSIShaderWipeLaunch.bat" Boots the launcher with a shader wipe and a bat ran (you will need to edit the bat file to double check its openning stuff in the right locations) 

- BOTH OF THESE FILES SHOULD BE RUN AFTER "Start_Basic_Win - Rotate_Splash_Screen.bat" and "Start_Basic_Win - Rotate_Launcher_Carousel.bat" HAS BEEN RUN ONCE

- After you have edited them, right click on either one or both and create shortcuts for them. You can then move them to your desktop, remove your original RSI Launcher shortcut, and then go into the properties of the shortcuts and give them icons and edit their names to look identical to a normal boot.


# Help needed?
Join [ARMCO](https://discord.gg/armco) and ask for kingflashroseG#5130 OR look in the [Thread](https://discord.com/channels/222052888531173386/1077537871382196314).

Hope you enjoy it :I

# Contributors
Big thanks to all of the people who worked on this project!

<a href="https://github.com/DJRLincs/SC-EAC-Screenshot-SplashScreen/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=DJRLincs/SC-EAC-Screenshot-SplashScreen" />
</a>

# Want to help with the project?
We are always seeking intelligent people who are familiar with Batch [Python](https://www.python.org/downloads/release/python-3102/) and [Node.js](https://nodejs.org/en/download/). The only other two requirements are [Visual Studio Code](https://code.visualstudio.com/download) and [Gitlens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens). Fortunately, when you run the script, two of the requirements are automatically installed for you. Immediately afterward, you may utilise it to study the repository by cloning this current one inside Visual Studio Code. Feel free to explore, pick up new skills, and come up with new ideas. Then, submit a pull request to the repository. I'll review it, and every contribution you make will add you to the list of contributors above.


# To the future
- I'd like to replace the Carousel (Wallpaper's) in RSI launcher with screenshots as well, but I'm not sure how to achieve it just yet. (ACHIEVED AS OF 14/03/23)

- allowing you to select your directory only once rather than having the locations hardcoded into each system [ACHIEVED AS OF 10/03/23]

- Add the option to choose a folder for your own music in the Launcher or remove a music folder completely from the Launcher.

- Add an option to configure the fade for how quickly it transitions from one image to another in the launcher.

- There is a potential that this project, which may have originally been created for [Star Citizen](https://robertsspaceindustries.com/enlist?referral=STAR-56VG-HCMC)'s [EAC](https://www.easy.ac/), will be renamed and modified to work for as many [EAC](https://www.easy.ac/) games as possible.

