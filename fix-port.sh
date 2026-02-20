#!/bin/bash
# Скрипт для исправления проблемы с занятым портом

echo "🔍 Поиск процесса, занимающего порт 3019..."

# Находим процесс на порту 3019
PID=$(lsof -ti:3019 2>/dev/null || netstat -tulpn 2>/dev/null | grep :3019 | awk '{print $7}' | cut -d'/' -f1)

if [ -z "$PID" ]; then
    echo "❌ Процесс на порту 3019 не найден через lsof/netstat"
    echo "Попробуем через ss:"
    PID=$(ss -tulpn | grep :3019 | awk '{print $NF}' | cut -d',' -f2 | cut -d'=' -f2)
fi

if [ -n "$PID" ]; then
    echo "✅ Найден процесс с PID: $PID"
    echo "Информация о процессе:"
    ps -p $PID -o pid,ppid,cmd 2>/dev/null || ps aux | grep $PID | grep -v grep
    
    echo ""
    read -p "Остановить этот процесс? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill $PID
        echo "✅ Процесс остановлен"
        sleep 2
    fi
else
    echo "⚠️ Не удалось найти процесс автоматически"
    echo "Попробуйте вручную:"
    echo "  sudo lsof -i :3019"
    echo "  или"
    echo "  sudo netstat -tulpn | grep 3019"
fi

echo ""
echo "🔄 Перезапуск PM2 процесса..."
pm2 restart fbo-printer-ozon || pm2 start server.js --name fbo-printer-ozon

echo ""
echo "✅ Готово! Проверьте статус:"
pm2 status
