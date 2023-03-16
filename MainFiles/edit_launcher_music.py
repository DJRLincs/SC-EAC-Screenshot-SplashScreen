import os
import subprocess
import sys
from pathlib import Path
import re
import shutil
import json

# You need to have npm installed for this to work https://phoenixnap.com/kb/install-node-js-npm-on-windows
# This file needs to be ran as administrator as the rsi launcher is installed in a protected folder

# will add to the config.json file if the user has not put in the location of the Launcher folder and the Images folder into command prompt and the config.json file

# # this is used to save the location for the next time you run the script 

# the user when running the script for the first time can put in the location of the Launcher folder and the Images folder into command prompt and it will be saved into the config.json file and be pulled everytime the script runs

# the user can also change the location of tthe Launcher folder and the Images folder in the config.json file



if os.path.exists("config.json") and (os.path.getsize("config.json") != 0):
    try:
        with open("config.json", "r") as f:
            config = json.load(f)
    except json.decoder.JSONDecodeError:
        print("The config.json file is improperly formatted.")
        sys.exit()
else:
    with open("config.json", "w") as f:
        config = {
            "Rotate_Screenshot_Splash": True,
            "screenshots_folder": "",
            "splash_folder": "",
            "Note": "This is just a space in the config file \n",
            "edit_launcher_carousel": True,
            "Launcher_Folder": "",
            "Image_Folder": "",
            "Delay_Time": "",
            "Music_Folder": ""
        }
        json.dump(config, f, indent=4)


# get the location of the Launcher folder from the config.json file
LAUNCHER_FOLDER = config["Launcher_Folder"]

# get the location of the Music folder from the config.json file
MUSIC_FOLDER = config["Music_Folder"]

# if the user has not put in the location of the Launcher folder and the Music folder into command prompt and the config.json file
if LAUNCHER_FOLDER == "" or MUSIC_FOLDER == "":
    # if the user has not put in the location of the Launcher folder and the Music folder into command prompt and the config.json file
    if LAUNCHER_FOLDER == "":
        # get the location of the Launcher folder from the user
        LAUNCHER_FOLDER = input("Please enter the location of the Launcher resources folder: \n")
        # save the location of the Launcher folder into the config.json file
        config["Launcher_Folder"] = LAUNCHER_FOLDER
        with open("config.json", "w") as f:
            json.dump(config, f, indent=4)
    if MUSIC_FOLDER == "":
        # get the location of the Music folder from the user
        MUSIC_FOLDER = input("Please enter the location of the Music folder you wish to use: \n")
        # save the location of the Music folder into the config.json file
        config["Music_Folder"] = MUSIC_FOLDER
        with open("config.json", "w") as f:
            json.dump(config, f, indent=4)
    # if DELAY_TIME == "":
    #     # get the delay time from the user
    #     DELAY_TIME = input("Please enter the delay time in seconds: \n")
    #     # save the delay time into the config.json file
    #     config["Delay_Time"] = DELAY_TIME
    #     with open("config.json", "w") as f:
    #         json.dump(config, f, indent=4)

if not os.path.exists(LAUNCHER_FOLDER) or not os.path.exists(MUSIC_FOLDER):
    LAUNCHER_FOLDER = input("Please enter the location of the Launcher resources folder: \n")
    MUSIC_FOLDER = input("Please enter the location of the Music folder you wish to use: \n")

    with open("config.json", "w") as f:
        config["Launcher_Folder"] = LAUNCHER_FOLDER
        config["Music_Folder"] = MUSIC_FOLDER
        json.dump(config, f, indent=4)

# the location of the Launcher folder
launcher_path = Path(LAUNCHER_FOLDER)
# the location of the Music folder
music_folder = Path(MUSIC_FOLDER)

# the delay time in seconds
# delay_time = Path(DELAY_TIME)

# your launcher path may look something like this C:\Program Files\Roberts Space Industries\RSI Launcher\resources
#launcher_path = Path(r"E:\StarCitizen\RSI Launcher\resources")
#image_folder = Path(r"E:\StarCitizen\Roberts Space Industries\StarCitizen\LIVE\screenshots")
#delay_Time = Path(r"25")


#firstly we make a copy of the launcher file just to be safe and incase we want to revert back
shutil.copyfile(launcher_path / "app.asar", launcher_path / "original_app.asar")


#The command to unpack the launcher file
npx_command_extract = ["npx", "asar", "extract", "app.asar", "unpacked"]
# npx_command_extract = ["echo", "Hello World!"]  # for testing subprocess


# Check if the path exists
if not launcher_path.exists():
    raise FileNotFoundError(f"Could not find file: {launcher_path}")

# check if the unpacked folder exists and skip to the next step if it does
if not (launcher_path / "unpacked").exists():
    # Run the command
    process = subprocess.Popen(npx_command_extract, cwd=launcher_path, shell=True)

    # Check the return code of the command
    if process.wait() == 0:
        print('npm command succeeded.')
    else:
        print('npm command failed.')

    # Print the output of the command for debugging
    print(process)


#path to the javascript file
path_to_js = launcher_path / "unpacked" / "app" / "cig-launcher.js"
launcher_music = launcher_path / "unpacked" / "app" /"assets"/ "sounds"

#open the file and read it
with open(path_to_js, "r") as f:
    data = f.read()

#rename the original javascript file, so we have it just incase
if not (launcher_path / "unpacked" / "app" / "original_cig-launcher.js").exists():
    os.rename(path_to_js, launcher_path / "unpacked" / "app" / "original_cig-launcher.js")

# we are looking for this line "souns:{bg"
pattern = re.compile(r'sounds:{bg:\[([^]]*)\]')
# the list of images currently listed in the javascript file, we are going to replace these with our own
current_music_list = pattern.search(data).group(1)


#this is the list of images we are going to use
new_music_list = []
for item in music_folder.iterdir():
    new_music_list.append(f'"/sounds/{item.name}"')

#join the list of images into a string
replacement_string = ",".join(new_music_list)
# replace the old list with the new one
new_data = data.replace(current_music_list, replacement_string)


# save the original images
if not (launcher_path / "unpacked" / "app" / "assets" / "original_images").exists():
    shutil.copytree(launcher_music, launcher_path / "unpacked" / "app" / "assets" / "original_images")
#remove the original images
shutil.rmtree(launcher_music)
#finally lets copy the new images to the correct folder
shutil.copytree(music_folder, launcher_music)

with open(path_to_js, "w") as f:
    f.write(new_data)


#The command to unpack the launcher file
npx_command_pack = ["npx", "asar", "pack","unpacked", "app.asar"]
# npx_command_extract = ["echo", "Hello World!"]  # for testing subprocess

process = subprocess.Popen(npx_command_pack, cwd=launcher_path, shell=True)

# Check the return code of the command
if process.wait() == 0:
    print('npm command succeeded.')
else:
    print('npm command failed. New images have not been applied to the launcher.')

    # Print the output of the command for debugging
    print(process)

# if you want to delete the unpacked folder after you are done remove the "#" from the line below
# shutil.rmtree(path / "unpacked")