@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo ===================================================================
echo   SMART HOME ENERGY MANAGER PLUS — INSTALADOR E TESTADOR ANDROID
echo ===================================================================
echo.

if not defined ANDROID_HOME (
    if exist "%LOCALAPPDATA%\Android\Sdk" (
        set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
    )
)
set "PATH=%PATH%;%ANDROID_HOME%\platform-tools"

if not exist "dist-apk\smart-home-energy-manager-plus-compacto.apk" (
    echo [AVISO] APK compacto ainda nao gerado em dist-apk\
    echo Executando o gerador gerar_e_testar_apk.bat...
    call gerar_e_testar_apk.bat
    exit /b %errorlevel%
)

echo Verificando dispositivos Android conectados via adb...
adb devices
echo.

echo Instalando dist-apk\smart-home-energy-manager-plus-compacto.apk no smartphone...
adb install -r "dist-apk\smart-home-energy-manager-plus-compacto.apk"
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao instalar via ADB.
    echo Certifique-se de que seu celular Android esta conectado via USB e com 'Depuração USB' ativada.
    pause
    exit /b %errorlevel%
)

echo.
echo Iniciando aplicativo no smartphone...
adb shell am start -n com.smarthome.energymanagerplus/.MainActivity

echo.
echo Aplicativo iniciado com sucesso no seu Android!
pause
