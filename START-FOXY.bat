@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Foxy Client - uruchamianie
echo =====================================
echo        FOXY CLIENT - START
echo =====================================
where node >nul 2>nul
if errorlevel 1 (
  echo Nie znaleziono Node.js.
  echo Zainstaluj Node.js LTS z https://nodejs.org/
  pause
  exit /b 1
)
if not exist "node_modules\express" (
  echo Instalowanie wymaganych bibliotek...
  call npm install
  if errorlevel 1 (
    echo Nie udalo sie zainstalowac bibliotek.
    pause
    exit /b 1
  )
)
echo Uruchamiam serwer...
start "Foxy Client Server" cmd /k "cd /d ""%~dp0"" && npm start"
timeout /t 3 /nobreak >nul
start "" "http://localhost:3000"
echo Strona powinna otworzyc sie w przegladarce.
echo Nie zamykaj okna serwera podczas korzystania ze strony.
pause
