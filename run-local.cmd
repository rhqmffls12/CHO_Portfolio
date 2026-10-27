@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>&1
if not errorlevel 1 (
  py -3 --version >nul 2>&1
  if not errorlevel 1 (
    py -3 -m http.server 4174 --bind 127.0.0.1
    exit /b
  )
)
where python >nul 2>&1
if errorlevel 1 (
  echo Python 3 was not found. Install Python 3, then run this file again.
  pause
  exit /b 1
)
python -m http.server 4174 --bind 127.0.0.1
