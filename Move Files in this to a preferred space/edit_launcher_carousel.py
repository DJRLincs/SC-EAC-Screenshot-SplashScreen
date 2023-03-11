import os
import subprocess
from pathlib import Path
import re
import shutil

# You need to have npm installed for this to work https://phoenixnap.com/kb/install-node-js-npm-on-windows
# This file needs to be ran as administrator as the rsi launcher is installed in a protected folder


# your launcher path may look something like this C:\Program Files\Roberts Space Industries\RSI Launcher\resources
launcher_path = Path(r"Path to launcher resources folder")
image_folder = Path(r"Path to a folder of images (PNG JPG OR GIF)")


#firstly we make a copy of the launcher file just to be safe and incase we want to revert back
shutil.copyfile(launcher_path / "app.asar", launcher_path / "original_app.asar")


#The command to unpack the launcher file
npx_command_extract = ["npx", "asar", "extract", "app.asar", "unpacked"]
# npx_command_extract = ["echo", "Hello World!"]  # for testing subprocess

# Replace this with the path to your RSI Launcher
path = Path(r"C:\Program Files\Roberts Space Industries\RSI Launcher\resources")

# Check if the path exists
if not path.exists():
    raise FileNotFoundError(f"Could not find file: {path}")

# check if the unpacked folder exists and skip to the next step if it does
if not (path / "unpacked").exists():
    # Run the command
    process = subprocess.Popen(npx_command_extract, cwd=path, shell=True)

    # Check the return code of the command
    if process.wait() == 0:
        print('npm command succeeded.')
    else:
        print('npm command failed.')

    # Print the output of the command for debugging
    print(process)


#path to the javascript file
new_path = path / "unpacked" / "app" / "cig-launcher.js"
launcher_images = path / "unpacked" / "app" /"assets"/ "images"

#open the file and read it
with open(new_path, "r") as f:
    data = f.read()

#rename the original javascript file, so we have it just incase
if not (path / "unpacked" / "app"/"original_cig-launcher.js").exists():
    os.rename(new_path, path / "unpacked" / "app"/"original_cig-launcher.js")

# we are looking for this line carousel:{delay:25e3,images:[ this is where the list of image names starts
pattern = re.compile(r'carousel:{delay:25e3,images:\[([^]]*)\]')
# the list of images currently listed in the javascript file, we are going to replace these with our own
current_img_list = pattern.search(data).group(1)


#this is the list of images we are going to use
new_img_list = []
for item in image_folder.iterdir():
    new_img_list.append(f'"/images/{item.name}"')

#join the list of images into a string
replacement_string = ",".join(new_img_list)
# replace the old list with the new one
new_data = data.replace(current_img_list, replacement_string)


# save the original images
if not (path / "unpacked" / "app"/"assets"/"original_images").exists():
    shutil.copytree(launcher_images, path / "unpacked" / "app"/"assets"/"original_images")
#remove the original images
shutil.rmtree(launcher_images)
#finally lets copy the new images to the correct folder
shutil.copytree(image_folder, launcher_images)

with open(new_path, "w") as f:
    f.write(new_data)

#if you want to delete the unpacked folder after you are done remove the "#" from the line below
# shutil.rmtree(path / "unpacked")

#The command to unpack the launcher file
npx_command_pack = ["npx", "asar", "pack","unpacked", "app.asar"]
# npx_command_extract = ["echo", "Hello World!"]  # for testing subprocess

# Replace this with the path to your RSI Launcher

process = subprocess.Popen(npx_command_pack, cwd=path, shell=True)

# Check the return code of the command
if process.wait() == 0:
    print('npm command succeeded.')
else:
    print('npm command failed. New images have not been applied to the launcher.')

    # Print the output of the command for debugging
    print(process)