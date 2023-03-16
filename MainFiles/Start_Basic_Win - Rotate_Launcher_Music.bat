@echo off
title RSI Launcher Editor - Rotate Launcher Music
et "params=%*"
cd /d "%~dp0" && ( if exist "%temp%\getadmin.vbs" del "%temp%\getadmin.vbs" ) && fsutil dirty query %systemdrive% 1>nul 2>nul || (  echo Set UAC = CreateObject^("Shell.Application"^) : UAC.ShellExecute "cmd.exe", "/k cd ""%~sdp0"" && %~s0 %params%", "", "runas", 1 >> "%temp%\getadmin.vbs" && "%temp%\getadmin.vbs" && exit /B )
:: this bit is very much a test for admin perms when you replace the Carousel it will need to be able to write in the folder

echo.
echo Requesting admin Permission for the bat file is very much a test and hope function. I hope to not need to keep it, 
echo but it might be a required thing for the project. annoyingly, it also breaks No as an option for choosing to use the script, 
echo so if you wish to not run the script, please just close the program.
echo.

@echo off
title RSI Launcher Editor - Rotate Launcher Music
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

echo Sorry the script is not done yet, please check the GITHUB for updates on the script 
:: py edit_launcher_music.py

pause
exit
