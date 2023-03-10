# Requires Python aswell as Pillow
# Replace the StarCitizen\LIVE\EasyAntiCheat\SplashScreen.png file with a random picture from the folder StarCitizen\LIVE\ScreenShots

import sys
import json
import os
import random
import shutil
import datetime
from PIL import Image

# Make sure that the user is running Python 3.8 or higher
if sys.version_info < (3, 8):
    exit("Python 3.8 or higher is required to run this script")

# Now make sure that the PIL library is installed or/and is up to date
try:
    from PIL import Image
except ImportError:
    exit(
        "Either Pillow is not installed or you are running an older and unsupported version of it."
        "Please make sure to check that you have the latest version of Pillow! (try reinstalling the requirements?)"
    )


# create a config.json file if it doesn't exist and make it so that the file locations are saved into this config.json file

# # this is used to save the location for the next time you run the script 

# the user when running the script for the first time can put in the location of the screenshots folder and the splash folder into command prompt and it will be saved into the config.json file and be pulled everytime the script runs

# the user can also change the location of the screenshots folder and the splash folder in the config.json file

try:
    with open("config.json", "r") as f:
        config = json.load(f)
except FileNotFoundError:
    with open("config.json", "w") as f:
        config = {
            "screenshots_folder": "",
            "splash_folder": ""
        }
        json.dump(config, f, indent=4)

# get the location of the screenshots folder from the config.json file
SCREENSHOTS_FOLDER = config["screenshots_folder"]

# get the location of the splash folder from the config.json file
SPLASH_FOLDER = config["splash_folder"]

# if the user has not put in the location of the screenshots folder and the splash folder into command prompt and the config.json file
if SCREENSHOTS_FOLDER == "" or SPLASH_FOLDER == "":
    # ask the user to put in the location of the screenshots folder
    SCREENSHOTS_FOLDER = input("Please enter the location of the screenshots folder: ")
    # ask the user to put in the location of the splash folder
    SPLASH_FOLDER = input("Please enter the location of the splash folder: ")
    # save the location of the screenshots folder and the splash folder into the config.json file
    with open("config.json", "w") as f:
        config = {
            "screenshots_folder": SCREENSHOTS_FOLDER,
            "splash_folder": SPLASH_FOLDER
        }
        json.dump(config, f, indent=4)


############################################################################################################
##EDIT THIS SECTION TO THE RIGHT LOCATION OF YOUR FILES

# constants
# the folder where the screenshots are (your path will be different than mine, edit it)
#SCREENSHOTS_FOLDER = "E:\StarCitizen\Roberts Space Industries\StarCitizen\LIVE\screenshots"
# the folder where the new splash screen will be (your path will be different than mine, edit it)
#SPLASH_FOLDER = "E:\StarCitizen\Roberts Space Industries\StarCitizen\LIVE\EasyAntiCheat"

##EDIT THIS SECTION TO THE RIGHT LOCATION OF YOUR FILES
############################################################################################################









# the file where the new splash screen will be
SPLASH_FILE = "SplashScreen.png"
# the size of the new splash screen
SPLASH_SIZE = (800, 450)

# this function will resize and crop the image to fit the splash screen
def resize_and_crop(image, size, crop_type='middle'):
    """
    Resize and crop an image to fit the specified size.
    args:
        image: Image - The image being resized and cropped.
        size: tuple(int) - The output size of the image, in (width, height).
        crop_type: str - The way to crop the image. See the PIL.Image.crop() method
    returns:
        Image - The resized and cropped image.
    """
    # calculate the ratio of the new image to the old image
    ratio = min(size[0] / image.size[0], size[1] / image.size[1])
    # print the ratio
    print(f"Ratio: {str(ratio)}")
    # the dimensions of the new image
    new_dimensions = (int(image.size[0] * ratio), int(image.size[1] * ratio))
    # print the new dimensions
    print(f"New dimensions: {str(new_dimensions)}")
   
    # create a new image that is the size of the splash screen
    new_image = Image.new("RGB", size)
    # resize the image
    image = image.resize(new_dimensions, Image.LANCZOS)

    # find the middle of the image
    if crop_type == 'top':
        # crop the image from the top
        box = (0, 0, image.size[0], size[1])
    elif crop_type == 'middle':
        # crop the image from the middle
        box = (0, 0, size[0], size[1])
    elif crop_type == 'bottom':
        # crop the image from the bottom
        box = (0, image.size[1] - size[1], image.size[0], image.size[1])
    else:
        raise ValueError('ERROR: crop_type must be top, middle or bottom')
    # crop the image
    image = image.crop(box)
    # paste the image onto the new image
    new_image.paste(image, ((size[0] - image.size[0]) // 2, (size[1] - image.size[1]) // 2))
    # save the image to the current directory for debugging
    #new_image.save(os.path.join(os.getcwd(), 'debug_splash.png'))

    # return the new image
    return new_image    

# method to get the list of screenshots
def get_screenshots():
    # get the list of screenshots
    screenshots = os.listdir(SCREENSHOTS_FOLDER)
    # return the list of screenshots
    return screenshots

# method to get a random screenshot
def get_random_screenshot():
    # get the list of screenshots
    screenshots = get_screenshots()
    # get a random screenshot
    random_screenshot = random.choice(screenshots)
    # return the random screenshot
    return random_screenshot

# method to backup the original splash screen
def backup_splash_screen():
    # get the path to the splash screen
    splash_path = os.path.join(SPLASH_FOLDER, SPLASH_FILE)
    # get the path to the backup splash screen, with today's date and time as a suffix
    backup_splash_path = os.path.join(SPLASH_FOLDER, "SplashScreen_{}.png".format(str(datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S"))))
    # copy the splash screen to the backup splash screen
    shutil.copyfile(splash_path, backup_splash_path)
    # print the backup splash screen path
    print(backup_splash_path)

# main method
def main():
    # get the random screenshot
    random_screenshot = get_random_screenshot()
    # print the random screenshot and say what we're doing
    print(f"Random screenshot: {random_screenshot}")
    print("Replacing splash screen with random screenshot...")
    
    # get the path to the random screenshot
    random_screenshot_path = os.path.join(SCREENSHOTS_FOLDER, random_screenshot)
    # get the path to the splash screen
    splash_path = os.path.join(SPLASH_FOLDER, SPLASH_FILE)

    #backup the splash screen
    backup_splash_screen()

    # resize and crop the random screenshot
    random_screenshot_image = resize_and_crop(Image.open(random_screenshot_path), SPLASH_SIZE)
    # save the random screenshot
    random_screenshot_image.save(splash_path)

    # print the splash screen path
    print(splash_path)
    # we're done
    print("Done!")


# run the main method
if __name__ == "__main__":
    main()

# end of file

