@echo off
title RSI Launcher Editor - Automatic Edition - Shader Wipe Boot

echo.
echo Checking for Python:
py -3 --version
echo.
echo Checking for Node.js:
where node

echo.
echo.
echo This script will run a check for Python and Node.js, install them if they are not installed, and then run the script.
echo THIS IS NOT AUTOMATIC and is only a single run. If you wish to automate it whenever you run the launcher, please look 
echo at the github readme again and look into the optional choices RSI_Launcher_Win.bat and RSIShaderWipeLaunch_Win.bat.
echo.
echo.

py -3 --version
IF %ERRORLEVEL% NEQ 0 (
  cls
  echo Python is not installed or not in PATH! Winget can install it for you and is about to run if you put Y if N it 
  echo will cancel and continue to run the script and fail
  echo.
  CHOICE /C YNC /M "Press Y for Yes, N for No ."
 

  :: Pause and Exit is used to make sure that you are able to read the message before the window closes
  :: prompts the user to confirm that they want winget to install python 3.12.0a1
  

  winget install -e --id=Python.Python.3.10 -v "3.10.2" --scope=machine
  echo might need to restart the machine for the commands to be recongnized
  echo.
  echo Python is being downloaded from here pleaes use this version or higher
  echo https://www.python.org/downloads/release/python-3102/
  echo.
  echo please make sure to check the box that says "Add Python to PATH" and PIP
  pause
)

where node
IF %ERRORLEVEL% NEQ 0 (
  cls
  echo Node.js is not installed! Winget can install it for you and is about to run if you put Y if N it will cancel 
  echo and continue to run the script and fail
  echo.
  CHOICE /C YNC /M "Press Y for Yes, N for No."

  :: Pause and Exit is used to make sure that you are able to
  :: read the message before the window closes

  winget install --id=OpenJS.NodeJS -e 
  echo Node.js is being downloaded from here 
  echo https://nodejs.org/en/download/
  echo.
  pause
)

"C:\Python311\python.exe" "E:\StarCitizen\rotate_screenshot_splash.py"
:: DOUBLE CHECK THE LOCATIONS OF THE FILES

"C:\Python311\python.exe" "E:\StarCitizen\edit_launcher_carousel.py"
:: DOUBLE CHECK THE LOCATIONS OF THE FILES

RD /S /Q "E:\StarCitizen\Roberts Space Industries\StarCitizen\LIVE\USER\Client\0\shaders"
:: DOUBLE CHECK THE LOCATIONS OF THE FILES

Start ""  "E:\StarCitizen\RSI Launcher\RSI Launcher.exe"
exit
