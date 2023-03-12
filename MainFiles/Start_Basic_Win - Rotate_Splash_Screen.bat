@echo off
title EAC Screenshot Replace Splashscreen
where python3
echo.
echo.
echo This script will run the a check for Python and Node.js and install them if they are not installed and then run the 
echo script THIS IS NOT AUTOMATIC and is only a single run if you wish to automate it whenever you run the launcher 
echo please look at the github readme again and look into the optional choices
echo RSI_Launcher_Win.bat and RSIShaderWipeLaunch_Win.bat
echo.
echo.
:PROMPT
SET /P AREYOUSURE=Are you sure you wish to run the script (Y/N)?
IF /I "%AREYOUSURE%" NEQ "Y" GOTO END

where python3
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

python rotate_screenshot_splash.py

pause
exit
