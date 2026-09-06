@echo off
setlocal
cd /d "%~dp0"

echo.
echo KDKAMATO WEB TH/EN PATCH v1.3 - ONE CLICK
echo Repo: %CD%
echo.

if not exist "package.json" (
  echo ERROR: package.json was not found beside this BAT.
  echo Put this BAT directly inside the website repository root, then run it again.
  echo.
  pause
  exit /b 1
)

if not exist "upload_kdkamato_github.bat" (
  echo ERROR: upload_kdkamato_github.bat was not found beside this BAT.
  echo This one-click file requires your existing uploader in the same repository root.
  echo.
  pause
  exit /b 2
)

set "MISSING=0"

for %%F in (
  "app\layout.jsx"
  "app\page.jsx"
  "app\i18n.css"
  "app\lab-ui.css"
  "app\manga\page.jsx"
  "app\manga\[slug]\page.jsx"
  "app\knowledge\page.jsx"
  "app\knowledge\[slug]\page.jsx"
  "app\lab\page.jsx"
  "app\lab\[tool]\page.jsx"
  "app\training\page.jsx"
  "components\LanguageSwitcher.jsx"
  "components\SiteHeader.jsx"
  "components\HomePage.jsx"
  "components\Descent.jsx"
  "components\KnowledgeSwitcher.jsx"
  "components\LabPreview.jsx"
  "components\lab\LabTools.jsx"
  "components\lab\LabUI.jsx"
  "lib\language.js"
  "lib\localize.js"
  "lib\content.js"
  "lib\lab.js"
) do (
  if not exist "%%~F" (
    echo MISSING: %%~F
    set "MISSING=1"
  )
)

if "%MISSING%"=="1" (
  echo.
  echo PATCH FILE CHECK: FAILED
  echo Some TH/EN patch files are missing.
  echo Do NOT deploy.
  pause
  exit /b 3
)

echo PATCH FILE CHECK: PASS
echo All required TH/EN source files are present.
echo.

if exist "node_modules\" (
  echo node_modules detected.
  echo Running npm run build...
  echo.
  call npm run build
  if errorlevel 1 (
    echo.
    echo LOCAL PRODUCTION BUILD: FAILED
    echo Deployment cancelled.
    pause
    exit /b 4
  )
  echo.
  echo LOCAL PRODUCTION BUILD: PASS
  echo.
) else (
  echo LOCAL PRODUCTION BUILD: NOT RUN
  echo node_modules was not found. Continuing with the existing GitHub uploader.
  echo.
)

echo ==================================================
echo PATCH VALIDATION PASSED
echo STARTING EXISTING GITHUB UPLOADER
echo ==================================================
echo.

call "%~dp0upload_kdkamato_github.bat"
set "UPLOAD_EXIT=%ERRORLEVEL%"

echo.
if not "%UPLOAD_EXIT%"=="0" (
  echo GITHUB UPLOAD/DEPLOY STEP FAILED.
  echo Exit code: %UPLOAD_EXIT%
  pause
  exit /b %UPLOAD_EXIT%
)

echo ==================================================
echo COMPLETED
echo Patch validated and upload_kdkamato_github.bat completed.
echo ==================================================
echo.
pause
exit /b 0
