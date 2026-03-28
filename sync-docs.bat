@echo off
setlocal
set ROOT=%~dp0
if exist "%ROOT%docs" rmdir /s /q "%ROOT%docs"
mkdir "%ROOT%docs"
xcopy "%ROOT%public\*" "%ROOT%docs\" /e /i /y >nul
type nul > "%ROOT%docs\.nojekyll"
echo docs directory synced successfully.
