@echo off
title Antigravity Quota & Token Tracker
echo ========================================================
echo   Menjalankan Backend Database & Membuka Aplikasi...
echo ========================================================

:: Jalankan server backend Node.js di background untuk menyimpan database.json
start /b "" node "%~dp0server.js"

:: Tunggu 1 detik agar server siap
timeout /t 1 /nobreak >nul

:: Buka di browser melalui server lokal
start "" "http://localhost:3333"

exit
