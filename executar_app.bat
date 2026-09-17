@echo off
chcp 65001 > nul
echo ========================================================
echo   SMART HOME ENERGY MANAGER PLUS — VIDEIRA SC
echo   Executar Aplicativo em Modo Desenvolvimento / Teste
echo ========================================================
echo.

if exist "src-tauri\target\release\smart-home-energy-manager-plus.exe" (
    echo [INFO] Executavel de Release encontrado!
    echo Deseja:
    echo  [1] Executar o .exe compilado diretamente
    echo  [2] Iniciar em modo live dev (npm run tauri:dev)
    echo.
    set /p opcao="Escolha uma opcao [1 ou 2]: "
    if "%opcao%"=="1" (
        start "" "src-tauri\target\release\smart-home-energy-manager-plus.exe"
        exit /b 0
    )
)

echo [INFO] Iniciando o aplicativo com Tauri Live Dev...
call npm run tauri:dev
