@echo off
title Daftarkan Antigravity Chrome Launcher
echo ========================================================
echo   Mendaftarkan Antigravity Chrome Protocol di Windows
echo ========================================================
echo.

set "TARGET_DIR=%LOCALAPPDATA%\agychrome"
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

set "VBS_FILE=%TARGET_DIR%\launch.vbs"

(
echo Set args = WScript.Arguments
echo If args.Count ^> 0 Then
echo   raw = args^(0^)
echo   raw = Replace^(raw, "agychrome://", ""^)
echo   raw = Replace^(raw, "agychrome:", ""^)
echo   raw = Replace^(raw, "/", ""^)
echo   raw = Replace^(raw, "%%20", " "^)
echo   Set shell = CreateObject^("WScript.Shell"^)
echo   shell.Run """C:\Program Files\Google\Chrome\Application\chrome.exe"" --profile-directory=""" ^& raw ^& """", 1, False
echo End If
) > "%VBS_FILE%"

reg add "HKCU\Software\Classes\agychrome" /ve /t REG_SZ /d "URL:Antigravity Chrome Launcher" /f >nul
reg add "HKCU\Software\Classes\agychrome" /v "URL Protocol" /t REG_SZ /d "" /f >nul
reg add "HKCU\Software\Classes\agychrome\shell\open\command" /ve /t REG_SZ /d "wscript.exe "%VBS_FILE%" "%%1"" /f >nul

echo [SUKSES] Protokol agychrome:// berhasil didaftarkan!
echo Anda sekarang bisa membuka profil Chrome langsung dari website GitHub Pages online tanpa server lokal.
echo.
pause
