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

def change_launcher_sounds(js_data, new_open = None, new_error = None, new_save = None):
    # Define the regular expression pattern to match the music data
    pattern_main = r'\b(sounds:\s*{[^}]+})'
    pattern_open = r'open:\s*".*?"'
    pattern_error = r'error:\s*".*?"'
    pattern_save = r'save:\s*".*?"'

    match =  re.findall(pattern_main, js_data)[0]
    open_sound = re.findall(pattern_open, match)[0]
    error_sound = re.findall(pattern_error, match)[0]
    save_sound = re.findall(pattern_save, match)[0]

    #this might need to change depending on how the sounds are passed to the function, pending config rework

    if new_open:
        js_data = js_data.replace(open_sound, f'open: "/sounds/{new_open}"')
    if new_error:
        js_data = js_data.replace(error_sound, f'error: "/sounds/{new_error}"')
    if new_save:
        js_data = js_data.replace(save_sound, f'save: "/sounds/{new_save}"')


    return js_data


def change_launcher_music(js_data, root_path, music_path=None):
    # Define the regular expression pattern to match the music data
    pattern = r'\b(musics:\s*{[^}]+})'
    match =  re.findall(pattern, js_data)[0]

    # get the names of tracks in the music_path
    tracks = os.listdir(music_path)
    # check that they are all audio files
    for track in tracks:
        if not track.endswith((".wav", ".ogg", ".mp3")):
            assert False, f"File {track} is not an audio file. Please provide only audio files."

    #copy all the tracks to the /assets/musics folder
    for track in tracks:
        shutil.copy(os.path.join(music_path, track), os.path.join(root_path, "assets", "musics", track))

    new_data = ""
    for index, name in enumerate(tracks):
        # Replace the music path
        temp = f'bg{index+1}:"/musics/{name}",'
        new_data += temp
    replacement = "musics:{" + new_data + "}"
    js_data = js_data.replace(match, replacement)

    return js_data

if __name__ == "__main__":
    print("This is a test.")
    # test_video = r""
    # root_path = r""
    path_to_js = r"C:\Users\20210777\Documents\SC-EAC-Screenshot-SplashScreen\unpacked_2.0\app\static\js\main.ab62df5e.js"
    #intentially commented out to prevent accidental execution
    with open(path_to_js, "r") as f:
        data = f.read()


    print(change_launcher_sounds(data))
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