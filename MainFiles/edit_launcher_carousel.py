import os
import subprocess
import sys
from pathlib import Path
import re
import shutil
import json
from get_launcher_version import getFileProperties
mode= "NEW"

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
#remove \resources from the end of the path
# get the current version of the launcher from the executables file properties
EXECUTABLE_PATH = LAUNCHER_FOLDER.replace("\\resources", "")
current_version = getFileProperties(EXECUTABLE_PATH + "\\RSI Launcher.exe")["StringFileInfo"]["FileVersion"]
current_version = current_version.split(".")[0]



# get the location of the Images folder from the config.json file
IMAGE_FOLDER = config["Image_Folder"]

# get the delay time from the config.json file
DELAY_TIME = config["Delay_Time"] 

# if the user has not put in the location of the Launcher folder and the Images folder into command prompt and the config.json file
if LAUNCHER_FOLDER == "" or IMAGE_FOLDER == "" or DELAY_TIME == "":
    # if the user has not put in the location of the Launcher folder and the Images folder into command prompt and the config.json file
    if LAUNCHER_FOLDER == "":
        # get the location of the Launcher folder from the user
        LAUNCHER_FOLDER = input("Please enter the location of the Launcher resources folder: \n")
        # save the location of the Launcher folder into the config.json file
        config["Launcher_Folder"] = LAUNCHER_FOLDER
        with open("config.json", "w") as f:
            json.dump(config, f, indent=4)
    if IMAGE_FOLDER == "" and current_version == "1":
        # get the location of the Images folder from the user
        IMAGE_FOLDER = input("Please enter the location of the Images folder: \n")
        # save the location of the Images folder into the config.json file
        config["Image_Folder"] = IMAGE_FOLDER
        with open("config.json", "w") as f:
            json.dump(config, f, indent=4)
        if os.path.exists(IMAGE_FOLDER):
            pass
        else:
            print("The folder does not exist")
            sys.exit()
    if DELAY_TIME == "" and current_version == "1":
        # get the delay time from the user
        DELAY_TIME = input("Please enter the delay time in seconds: \n")
        # save the delay time into the config.json file
        config["Delay_Time"] = DELAY_TIME
        with open("config.json", "w") as f:
            json.dump(config, f, indent=4)

if not os.path.exists(LAUNCHER_FOLDER):
    # raise FileNotFoundError(f"Could not find file: {LAUNCHER_FOLDER}")
    LAUNCHER_FOLDER = input("Please Enter a Valid Path to the Launcher Resources Folder: \n")

    with open("config.json", "w") as f:
        config["Launcher_Folder"] = LAUNCHER_FOLDER
        json.dump(config, f, indent=4)

# the location of the Launcher folder
launcher_path = Path(LAUNCHER_FOLDER)
# the location of the Images folder
if current_version == "1":
    image_folder = Path(IMAGE_FOLDER)
    # the delay time in seconds
    delay_time = Path(DELAY_TIME)

# your launcher path may look something like this C:\Program Files\Roberts Space Industries\RSI Launcher\resources
#launcher_path = Path(r"E:\StarCitizen\RSI Launcher\resources")
#image_folder = Path(r"E:\StarCitizen\Roberts Space Industries\StarCitizen\LIVE\screenshots")
#delay_Time = Path(r"25")


#firstly we make a copy of the launcher file just to be safe and incase we want to revert back
shutil.copyfile(launcher_path / "app.asar", launcher_path / "original_app.asar")


#The command to unpack the launcher file
npx_command_extract = ["npx", "asar", "extract", "app.asar", "unpacked"]
# npx_command_extract = ["echo", "Hello World!"]  # for testing subprocess


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
if current_version == "1":
    path_to_js = launcher_path / "unpacked" / "app" / "cig-launcher.js"
    launcher_images = launcher_path / "unpacked" / "app" /"assets"/ "images"
    mode = "OLD"
else:
    path_to_js = launcher_path / "unpacked" / "app" / "static" / "js"
    js_files = os.listdir(path_to_js)
    #get the file that starts with main
    for file in js_files:
        if file.startswith("main"):
            if file.endswith(".js"):
                path_to_js = path_to_js / file
                break
    print(path_to_js)

    launcher_images = launcher_path / "unpacked" / "app" /"assets"/ "images"
    launcher_sounds = launcher_path / "unpacked" / "app" /"assets"/ "sounds"
    launcher_videos = launcher_path / "unpacked" / "app" /"assets"/ "videos"
    launcher_logos = launcher_path / "unpacked" / "app" /"assets"/ "logos"

#open the file and read it
with open(path_to_js, "r") as f:
    data = f.read()

#rename the original javascript file, so we have it just incase
if not (launcher_path / "unpacked" / "app" / "original_cig-launcher.js").exists():
    os.rename(path_to_js, launcher_path / "unpacked" / "app" / "original_cig-launcher.js")

if mode == "OLD":
    # we are looking for this line carousel:{delay:25e3,images:[ this is where the list of image names starts
    pattern = re.compile(r',images:\[([^]]*)\]')

    delay_pattern = re.compile(r'delay:\d+e\d*,')


    # the list of images currently listed in the javascript file, we are going to replace these with our own
    current_img_list = pattern.search(data).group(1)
    # the delay that is currently set in the javascript file, we are going to replace this with our own
    current_delay = delay_pattern.search(data).group(0)


    #this is the list of images we are going to use
    new_img_list = []
    for item in image_folder.iterdir():
        new_img_list.append(f'"/images/{item.name}"')

    #join the list of images into a string
    replacement_string = ",".join(new_img_list)
    # replace the old list with the new one
    new_data = data.replace(current_img_list, replacement_string).replace(current_delay, f"delay:{delay_time}e3,")


    # save the original images
    if not (launcher_path / "unpacked" / "app" / "assets" / "original_images").exists():
        shutil.copytree(launcher_images, launcher_path / "unpacked" / "app" / "assets" / "original_images")
    #remove the original images
    shutil.rmtree(launcher_images)
    #finally lets copy the new images to the correct folder
    shutil.copytree(image_folder, launcher_images)

    with open(path_to_js, "w") as f:
        f.write(new_data)



if mode == "NEW":
    pass

###---------------------------------------------------------------------------------------------------------------------
# sounds: {
#             open: "/sounds/phazein.wav",
#             error: "/sounds/website_ui_rejection.wav",
#             save: "/sounds/website_ui_savesettings.wav",
#           },
#           musics: {
#             bg1: "/musics/SC_DL_Raven_Music_23LUFS.ogg",
#             bg2: "/musics/SC_PMC_600i_v31_24bit_23LUFS.ogg",
#             bg3: "/musics/SC_PMC_First Light_23LUFS.ogg",
#             bg4: "/musics/SC_PMC_Main_Theme_23LUFS.ogg",
#             bg5: "/musics/SC_PMC_Majesty of Space_23LUFS.ogg",
#             bg6: "/musics/SC_PMC_Mind Games_23LUFS.ogg",
#           },
#           gameAssets: [
#             {
#               id: "SC",
#               logo: "/logos/sc-game-logo-small.svg",
#               logoWide: "/logos/sc-game-logo-wide.svg",
#               logoAnimation: "/logos/sc-logo-animation.json",
#               bgImage: "/images/sc_bg_fallback.jpg",
#               bgVideo: "/videos/sc_bg_video.webm",
#             }
### --------------------------------------------------------------------------------------------------------------------

# The command to unpack the launcher file
npx_command_pack = ["npx", "asar", "pack", "unpacked", "app.asar"]
# npx_command_extract = ["echo", "Hello World!"]  # for testing subprocess

process = subprocess.Popen(npx_command_pack, cwd=launcher_path, shell=True)

# Check the return code of the command
if process.wait() == 0:
    print('npm command succeeded.')
else:
    print('npm command failed. Launcher changes have not been made.')

    # Print the output of the command for debugging
    print(process)
    ## TODO: Revert the original files back to the way they were so that the launcher can still run

# if you want to delete the unpacked folder after you are done remove the "#" from the line below
# shutil.rmtree(path / "unpacked")