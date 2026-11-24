@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo CEFR B2 kunlik plan (22-noyabr - 15-dekabr) bazaga joylanmoqda...
node --env-file=.env.local scripts\load-cefr-plan.mjs
echo.
pause
