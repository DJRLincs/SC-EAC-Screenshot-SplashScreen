import os
import re
import shutil


def change_background_video(video_path, js_data, root_path):
    #Check if the required folder exists
    if not os.path.exists(os.path.join(root_path, "assets", "videos")):
        assert False, "The assets/videos folder does not exist. The root path is likely incorrect."
    #Copy the video into the assets/videos folder
    video_name = os.path.basename(video_path)
    video_dest = os.path.join(root_path, "assets", "videos", video_name)
    shutil.copy(video_path, video_dest)
    #Rename the original video
    original_video = "sc_bg_video.webm"
    original_video_path = os.path.join(root_path, "assets", "videos", original_video)
    if os.path.exists(original_video_path):
        os.rename(original_video_path, os.path.join(root_path, "assets", "videos", f"{original_video}.bak"))

    #updating the js_data to point to the new video

    # Define the regular expression pattern to match the music data
    pattern = r'bgVideo:\s*".*?"'
    match = re.findall(pattern, js_data)[0]

    # Replace the video path
    js_data = js_data.replace(match, f'bgVideo: "/videos/{video_name}"')

    return js_data

def change_launcher_sounds(sounds_path, js_data):
    # Define the regular expression pattern to match the music data
    pattern = r'\b(sounds:\s*{[^}]+})'
    match =  re.findall(pattern, js_data)[0]

def change_launcher_music(music_path, js_data):
    # Define the regular expression pattern to match the music data
    pattern = r'\b(musics:\s*{[^}]+})'
    match =  re.findall(pattern, js_data)[0]

if __name__ == "__main__":
    print("This is a test.")
    # test_video = r""
    # root_path = r""
    # path_to_js = r""
    #intentially commented out to prevent accidental execution
    with open(path_to_js, "r") as f:
        data = f.read()

    new_data = change_background_video(test_video, data, root_path)
    with open("test_file.js", "w") as f:
        f.write(new_data)
    # print(change_launcher_sounds("test", data))
    # print(change_launcher_music("test", data))


#Potential future work:
# strip sound from background video and use it as launcher music


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