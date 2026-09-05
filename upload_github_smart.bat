@echo off
setlocal
cd /d "%~dp0"

echo ================================
echo GitHub Folder Uploader
echo ================================
echo.

where git >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git is not installed or not in PATH.
    echo Install Git for Windows first.
    pause
    exit /b 1
)

if not exist ".git" (
    echo First-time setup detected.
    echo Initializing Git repository...
    git init
    if errorlevel 1 goto :error

    git branch -M main

    echo.
    set /p REPOURL=Paste GitHub repository URL: 
    if "%REPOURL%"=="" (
        echo ERROR: Repository URL cannot be empty.
        pause
        exit /b 1
    )

    git remote add origin "%REPOURL%"
    if errorlevel 1 goto :error
) else (
    echo Existing Git repository detected.
)

echo.
echo Adding files...
git add .
if errorlevel 1 goto :error

echo.
echo Creating commit...
git commit -m "Auto update %date% %time%"

echo.
echo Pushing to GitHub...
git push -u origin main
if errorlevel 1 goto :error

echo.
echo ================================
echo DONE
echo ================================
pause
exit /b 0

:error
echo.
echo ================================
echo FAILED - see error above
echo ================================
pause
exit /b 1
