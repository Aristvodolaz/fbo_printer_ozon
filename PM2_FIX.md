# Исправление ошибки EADDRINUSE (порт занят)

## Проблема
```
code: 'EADDRINUSE',
errno: -98,
syscall: 'listen',
address: '0.0.0.0',
port: 3019
```

Это означает, что порт 3019 уже занят другим процессом.

## Решение

### Вариант 1: Остановить процесс на порту 3019

```bash
# Найти процесс на порту 3019
sudo lsof -i :3019
# или
sudo netstat -tulpn | grep 3019

# Остановить процесс (замените PID на реальный номер процесса)
kill <PID>

# Или принудительно
kill -9 <PID>
```

### Вариант 2: Остановить старый PM2 процесс

```bash
# Посмотреть все процессы PM2
pm2 list

# Остановить конкретный процесс
pm2 stop fbo-printer-ozon

# Или удалить и перезапустить
pm2 delete fbo-printer-ozon
pm2 start server.js --name fbo-printer-ozon
```

### Вариант 3: Использовать другой порт

Если порт 3019 нужен другому приложению, измените порт в `server.js`:

```javascript
const PORT = process.env.PORT || 3020; // Измените на другой порт
```

Или через переменную окружения:
```bash
PORT=3020 pm2 start server.js --name fbo-printer-ozon
```

### Вариант 4: Автоматическое исправление

Запустите скрипт:
```bash
chmod +x fix-port.sh
./fix-port.sh
```

## Рекомендуемая последовательность действий

1. **Остановите старый процесс:**
   ```bash
   pm2 stop fbo-printer-ozon
   pm2 delete fbo-printer-ozon
   ```

2. **Проверьте, что порт свободен:**
   ```bash
   sudo lsof -i :3019
   ```
   Если что-то найдено, остановите это.

3. **Запустите заново:**
   ```bash
   cd /path/to/project
   pm2 start server.js --name fbo-printer-ozon
   pm2 save
   ```

4. **Проверьте статус:**
   ```bash
   pm2 status
   pm2 logs fbo-printer-ozon --lines 50
   ```

## Проверка работы

После перезапуска проверьте:
```bash
# Статус процесса
pm2 status

# Логи (должны быть без ошибок)
pm2 logs fbo-printer-ozon --lines 20

# Проверка API
curl http://localhost:3019/api/health
```

## Настройка автозапуска

После успешного запуска сохраните конфигурацию:
```bash
pm2 save
pm2 startup
# Выполните команду, которую покажет pm2 startup
```
