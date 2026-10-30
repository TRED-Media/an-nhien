@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Can cai Node.js 22 hoac moi hon.
 pause
 exit /b 1
)
echo Mo http://127.0.0.1:5173
node start.cjs
pause
