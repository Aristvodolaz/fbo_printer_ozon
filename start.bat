@echo off
echo ========================================
echo   Запуск сервера печати маркировок OZON
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

REM Проверка наличия node_modules
if not exist "node_modules" (
    echo [ИНФО] Установка зависимостей...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ОШИБКА] Не удалось установить зависимости!
        pause
        exit /b 1
    )
)

echo [ИНФО] Запуск сервера...
echo [ИНФО] Приложение будет доступно по адресу: http://localhost:3000
echo [ИНФО] Для остановки нажмите Ctrl+C
echo.

node server.js

pause
