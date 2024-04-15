import os
import json
import sys
from get_launcher_version import version_number

#This file will hopefully be converted to a GUI in the future to make it easier for the user to input the required information

if os.path.exists("config.json"):
    with open("config.json", "r") as f:
        config = json.load(f)
else:
    with open("Default_config.json", "r") as f:
        config = json.load(f)

if all(value != "" for value in config.values()):
    # All config fields are filled, we do not check them for validity here as the existence of the "latest_version" key is enough to indicate that this file has been successfully run previously
    sys.exit()

if config["Launcher_Folder"] == "":
    # This will loop until the user provides a valid path to the launcher
    no_path = True
    while no_path:
        launcher_path = input("Please fill in the value for Launcher_Folder in the config.json file: \n")
        if os.path.exists(launcher_path + "\\RSI Launcher.exe"):
            config["Launcher_Folder"] = launcher_path
            no_path = False
        else:
            print("The launcher cannot be found in the path provided. Please try again.")
            print("Example: C:\\Program Files\\Roberts Space Industries\\RSI Launcher")
            print("The folder should contain the RSI Launcher.exe file.")
            print("-" * 20)


if config["Launcher_version"] != "1" and config["Launcher_version"] != "2":
    short_version = version_number(config["Launcher_Folder"] + "\\RSI Launcher.exe")[0]
    long_version = version_number(config["Launcher_Folder"] + "\\RSI Launcher.exe")[1]
    config["Launcher_version"] = short_version

def check_yn_input(input_string):
    while True:
        user_input = input(input_string)
        if user_input.lower() == "y":
            return True
        elif user_input.lower() == "n":
            return False
        else:
            print("Please enter either 'y' or 'n'.")

edit_splash = check_yn_input("Would You Like to Edit the Easy Anti Cheat Splash Screen? (y/n): ")
rotate_splash = check_yn_input("Would You Like to Rotate the Easy Anti Cheat Splash Screen Images? (y/n): ")

if edit_splash:
    config["edit_splash"] = True
    splash_folder = input("Please enter the location of EasyAntiCheat folder in you're LIVE/PTU Folder: \n")
    print("-" * 20)
    screenshots_folder = input("Please enter the location of image folder you wish to use EG: Screenshot's Folder: \n")
    print("-" * 20)
    config["splash_folder"] = splash_folder
    config["screenshots_folder"] = screenshots_folder
else:
    config["edit_splash"] = False

config["Rotate_Screenshot_Splash"] = rotate_splash

edit_music = check_yn_input("Would You Like to Edit the Launcher Music? (y/n): ")
if edit_music:
    music_folder = input("Please enter the location of the Music folder you wish to use: \n")
    print("-" * 20)
    config["Music_Folder"] = music_folder
else:
    config["Music_Folder"] = "None"

if short_version == "1":
    edit_carousel = check_yn_input("Would You Like to Edit the Launcher Images? (y/n): ")
    if edit_carousel:
        image_folder = input("Please enter the location of the Images folder: \n")
        print("-" * 20)
        delay_time = input("Please enter the delay time in seconds, Enter 0 to Keep the Default: \n")
        print("-" * 20)
        config["Image_Folder"] = image_folder
        config["Delay_Time"] = delay_time
    else:
        config["Image_Folder"] = "None"
        config["Delay_Time"] = "None"
    config["edit_launcher_carousel"] = edit_carousel
else:
    config["Image_Folder"] = "None"
    config["Delay_Time"] = "None"
    config["edit_launcher_carousel"] = False
    edit_video = check_yn_input("Would You Like to Edit the Launcher Video? (y/n): ")
    if edit_video:
        no_video= True
        while no_video:
            video_path = input("Please enter the location of the Video file you wish to use: \n")
            if os.path.exists(video_path):
                if not video_path.endswith((".mp4", ".webm", ".ogg")):
                    print("The file provided is not a valid video file. Please provide a video file with the extensions .mp4, .webm, or .ogg.")
                else:
                    no_video = False
            else:
                print("The file provided does not exist. Please provide a valid file path.")
        print("-" * 20)
        config["bg_video"] = video_path
    else:
        config["bg_video"] = "None"

launcher_sounds = check_yn_input("Would You Like to Edit the Launcher Sounds? (y/n): ")
if launcher_sounds:
    open_sound = input("Please enter the location of the Open Sound file you wish to use, Enter 'n' to skip this sound: \n")
    print("-" * 20)
    error_sound = input("Please enter the location of the Error Sound file you wish to use, Enter 'n' to skip this sound: \n")
    print("-" * 20)
    save_sound = input("Please enter the location of the Save Sound file you wish to use, Enter 'n' to skip this sound: \n")
    print("-" * 20)
    config["open_sound"] = open_sound if open_sound.lower() != "n" else "None"
    config["error_sound"] = error_sound if error_sound.lower() != "n" else "None"
    config["save_sound"] = save_sound if save_sound.lower() != "n" else "None"

config["latest_version"] = long_version
with open("config.json", "w") as f:
    json.dump(config, f, indent=4)