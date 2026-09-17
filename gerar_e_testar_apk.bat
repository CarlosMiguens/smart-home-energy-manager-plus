@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo ===================================================================
echo   SMART HOME ENERGY MANAGER PLUS — VIDEIRA SC
echo   Gerador e Testador de APK Android (Tauri v2 + Rust + SQLite)
echo ===================================================================
echo.

:: 1. Configurar Variaveis de Ambiente do Android SDK e Java
if not defined ANDROID_HOME (
    if exist "%LOCALAPPDATA%\Android\Sdk" (
        set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
    )
)

if not defined JAVA_HOME (
    if exist "C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot" (
        set "JAVA_HOME=C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot"
    ) else if exist "C:\Program Files\Java\jdk-21" (
        set "JAVA_HOME=C:\Program Files\Java\jdk-21"
    )
)

if not defined NDK_HOME (
    if exist "%ANDROID_HOME%\ndk\27.3.13750724" (
        set "NDK_HOME=%ANDROID_HOME%\ndk\27.3.13750724"
    )
)

set "PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\cmdline-tools\latest\bin;%JAVA_HOME%\bin"

echo [Ambiente Detectado]
echo - ANDROID_HOME: %ANDROID_HOME%
echo - NDK_HOME:     %NDK_HOME%
echo - JAVA_HOME:    %JAVA_HOME%
echo.

if not exist "%ANDROID_HOME%" (
    echo [ERRO] ANDROID_HOME nao encontrado em %ANDROID_HOME%
    pause
    exit /b 1
)

:: 2. Criar diretorio de saida facil
if not exist "dist-apk" mkdir "dist-apk"

echo [1/3] Compilando APK Compacto para Android (Target: aarch64 / ARM64)...
echo (Otimizado para smartphones modernos, menor tamanho e carregamento rapido)
echo.

call npx tauri android build --target aarch64 --apk
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha na compilacao do APK Android.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Localizando o arquivo .apk gerado...

set "FOUND_APK="
for /r "src-tauri\gen\android\app\build\outputs\apk" %%F in (*.apk) do (
    set "FOUND_APK=%%F"
)

if defined FOUND_APK (
    copy /y "!FOUND_APK!" "dist-apk\smart-home-energy-manager-plus-compacto.apk" > nul
    echo [SUCESSO] APK copiado para:
    echo  dist-apk\smart-home-energy-manager-plus-compacto.apk
    echo.
    dir "dist-apk\smart-home-energy-manager-plus-compacto.apk" | findstr /C:"smart-home"
) else (
    echo [AVISO] O arquivo .apk foi gerado dentro de src-tauri\gen\android\app\build\outputs\apk\
)

echo.
echo [3/3] Verificando dispositivos ou emuladores Android conectados via USB/ADB...
adb devices > temp_adb.txt
type temp_adb.txt
findstr /R /C:"[a-zA-Z0-9].*device$" temp_adb.txt > nul
if %errorlevel% equ 0 (
    echo.
    echo Dispositivo Android detectado!
    set /p INSTALAR="Deseja instalar e abrir o app no celular agora? (S/N): "
    if /i "!INSTALAR!"=="S" (
        echo Instalando APK no dispositivo...
        adb install -r "dist-apk\smart-home-energy-manager-plus-compacto.apk"
        echo Iniciando aplicativo no smartphone...
        adb shell am start -n com.smarthome.energymanagerplus/.MainActivity
        echo Aplicativo iniciado no seu Android!
    )
) else (
    echo.
    echo [DICA] Nenhum celular conectado com 'Depuração USB' no momento.
    echo Voce pode transferir o arquivo:
    echo   dist-apk\smart-home-energy-manager-plus-compacto.apk
    echo diretamente para o seu smartphone por WhatsApp, Google Drive, cabo USB ou Telegram e instalar!
)
del temp_adb.txt 2>nul

echo.
echo ===================================================================
echo   Processo concluido com sucesso!
echo ===================================================================
pause
