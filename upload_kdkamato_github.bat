@echo off
setlocal
cd /d "%~dp0"

set "REPOURL=https://github.com/nutyfreshz/kdkamato.git"

echo ================================
echo KDKAMATO GitHub Uploader
echo ================================
echo.

where git >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git is not installed or not in PATH.
    pause
    exit /b 1
)

if not exist ".git" (
    echo First-time setup detected.
    git init
    if errorlevel 1 goto :error

    git branch -M main

    git remote add origin "%REPOURL%"
    if errorlevel 1 goto :error
) else (
    git remote get-url origin >nul 2>&1
    if errorlevel 1 (
        git remote add origin "%REPOURL%"
        if errorlevel 1 goto :error
    )
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
