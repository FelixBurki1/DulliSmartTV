@echo off
rem Startet die Browser-Vorschau auf http://localhost:8080
cd /d "%~dp0"
start "" http://localhost:8080/
python -m http.server 8080 --directory app
