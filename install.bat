@echo off
echo ========================================
echo   Установка зависимостей проекта
echo ========================================
echo.

REM Проверка наличия Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ОШИБКА] Node.js не установлен!
    echo Установите Node.js с https://nodejs.org/
    pause
    exit /b 1
)

echo [ИНФО] Установка зависимостей...
call npm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [УСПЕХ] Зависимости установлены!
    echo [ИНФО] Теперь можно запустить сервер командой: start.bat
) else (
    echo.
    echo [ОШИБКА] Не удалось установить зависимости!
)

echo.
pause
