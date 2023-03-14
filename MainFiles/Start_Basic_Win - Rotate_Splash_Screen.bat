@echo off
title RSI Launcher Editor - Rotate EAC Splash Screen
echo.
Echo Checking for Python:
py -3 --version

echo.
echo.
echo This script will run a check for Python, install it if its isnt installed, and then run the script.
echo THIS IS NOT AUTOMATIC and is only a single run. If you wish to automate it whenever you run the launcher, please look 
echo at the github readme again and look into the optional choices RSI_Launcher_Win.bat and RSIShaderWipeLaunch_Win.bat.
echo.
echo.
:PROMPT
SET /P AREYOUSURE=Are you sure you wish to run the script (Y/N)?
IF /I "%AREYOUSURE%" NEQ "Y" GOTO END

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
  echo might need to restart the machine for the commands to be recognized
  echo.
  echo Python is being downloaded from here please use this version or higher
  echo https://www.python.org/downloads/release/python-3102/
  echo.
  echo please make sure to check the box that says "Add Python to PATH" and PIP
  pause
)

pip install --upgrade pip
pip install Pillow

py rotate_screenshot_splash.py

pause
exit
