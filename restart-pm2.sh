#!/bin/bash
# Скрипт для перезапуска PM2 процесса

echo "🛑 Остановка старого процесса..."
pm2 stop fbo-printer-ozon 2>/dev/null
pm2 delete fbo-printer-ozon 2>/dev/null

echo "🔍 Проверка порта 22..."
PID=$(lsof -ti:22 2>/dev/null)
if [ -n "$PID" ]; then
    echo "⚠️  Порт 22 занят процессом PID: $PID"
    echo "⚠️  ВНИМАНИЕ: Порт 22 обычно используется для SSH!"
    read -p "Остановить процесс? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill $PID 2>/dev/null
        sleep 2
    else
        echo "Используйте другой порт: PORT=3022 pm2 start server.js --name fbo-printer-ozon"
        exit 1
    fi
fi

echo "🚀 Запуск нового процесса..."
cd "$(dirname "$0")"
pm2 start server.js --name fbo-printer-ozon

echo ""
echo "✅ Готово! Статус:"
pm2 status

echo ""
echo "📋 Логи (последние 20 строк):"
pm2 logs fbo-printer-ozon --lines 20 --nostream
