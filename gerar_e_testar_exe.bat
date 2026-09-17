@echo off
chcp 65001 > nul
echo ========================================================
echo   SMART HOME ENERGY MANAGER PLUS — VIDEIRA SC
echo   Compilando e Iniciando o Executavel Windows (.exe)
echo ========================================================
echo.

echo [1/2] Compilando aplicativo com assets embutidos via Tauri v2...
call npx tauri build --no-bundle
if %errorlevel% neq 0 (
    echo [ERRO] Falha no build do Tauri.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/2] Iniciando o aplicativo Smart Home Energy Manager Plus...
echo Localizacao: src-tauri\target\release\smart-home-energy-manager-plus.exe
start "" "src-tauri\target\release\smart-home-energy-manager-plus.exe"

echo.
echo Aplicativo iniciado com sucesso!
echo Pressione qualquer tecla para fechar esta janela.
pause > nul
