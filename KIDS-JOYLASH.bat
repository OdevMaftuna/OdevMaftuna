@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Kids grammatika 11-25 mavzular bazaga joylanmoqda...
node --env-file=.env.local scripts\load-kids-grammar.mjs --only=11-25
echo.
pause
