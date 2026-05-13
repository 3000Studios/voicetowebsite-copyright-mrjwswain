@echo off
REM Run this after: nvm use 20  (or fnm use 20)
REM Commit, push, and deploy all changes. Requires Node 20 for verify.

setlocal
cd /d "%~dp0\.."
call nvm use 20 2>nul || call fnm use 20 2>nul || echo Ensure Node 20 is active: node -v

git add -A
git commit -m "fix: preview routes, Custom GPT/deploy routes, deploy hook for dashboard deploys"
if errorlevel 1 exit /b 1
git push
if errorlevel 1 exit /b 1
npm run deploy:live
exit /b 0
