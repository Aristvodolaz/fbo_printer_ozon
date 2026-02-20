# Инструкция по развертыванию на сервере

## Вариант 1: Запуск на сервере (рекомендуется)

### Шаг 1: Установка Node.js на сервере

Если Node.js не установлен:
- Windows: Скачайте с https://nodejs.org/
- Linux: `sudo apt-get install nodejs npm` (Ubuntu/Debian) или `sudo yum install nodejs npm` (CentOS/RHEL)

### Шаг 2: Копирование файлов на сервер

Скопируйте все файлы проекта на сервер:
- `package.json`
- `server.js`
- `db.js`
- `index.html`
- `create-table.sql` (опционально)

### Шаг 3: Установка зависимостей

```bash
cd /path/to/project
npm install
```

### Шаг 4: Настройка БД

Убедитесь, что:
- SQL Server доступен с сервера
- Учетные данные в `db.js` правильные
- Таблица создастся автоматически при первом запуске

### Шаг 5: Запуск сервера

#### Вариант A: Прямой запуск
```bash
npm start
```

#### Вариант B: Запуск через PM2 (рекомендуется для продакшена)
```bash
# Установка PM2
npm install -g pm2

# Запуск приложения
pm2 start server.js --name "ozon-label-printer"

# Сохранение конфигурации
pm2 save

# Настройка автозапуска
pm2 startup
```

#### Вариант C: Запуск как Windows Service (Windows Server)
Используйте `node-windows` или `nssm`:
```bash
npm install -g node-windows
node-windows install
```

### Шаг 6: Настройка файрвола

Откройте порт 3000 (или другой указанный в PORT):
- Windows: `netsh advfirewall firewall add rule name="Node.js" dir=in action=allow protocol=TCP localport=3000`
- Linux: `sudo ufw allow 3000/tcp`

### Шаг 7: Доступ к приложению

Откройте в браузере:
```
http://<IP_СЕРВЕРА>:3000
```

Например:
- `http://192.168.1.100:3000` (локальная сеть)
- `http://server.company.local:3000` (доменная сеть)
- `http://your-domain.com:3000` (если настроен DNS)

## Вариант 2: Использование обратного прокси (Nginx/IIS)

### Nginx (Linux)

Создайте файл `/etc/nginx/sites-available/ozon-printer`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активируйте:
```bash
sudo ln -s /etc/nginx/sites-available/ozon-printer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### IIS (Windows Server)

1. Установите URL Rewrite и Application Request Routing модули
2. Создайте сайт в IIS
3. Настройте reverse proxy на `http://localhost:3000`

## Переменные окружения

Можно настроить через переменные окружения:

```bash
# Windows
set PORT=3000
set NODE_ENV=production

# Linux
export PORT=3000
export NODE_ENV=production
```

Или создайте файл `.env` (нужен пакет `dotenv`):
```
PORT=3000
NODE_ENV=production
```

## Проверка работы

1. Откройте `http://<IP_СЕРВЕРА>:3000/api/health` - должно вернуть `{"success":true}`
2. Откройте `http://<IP_СЕРВЕРА>:3000` - должна открыться главная страница
3. Загрузите Excel и PDF файлы
4. Проверьте сохранение прогресса в БД

## Устранение проблем

### Сервер не запускается
- Проверьте, что порт не занят: `netstat -an | findstr :3000` (Windows) или `lsof -i :3000` (Linux)
- Проверьте логи ошибок

### Не подключается к БД
- Проверьте доступность SQL Server с сервера
- Проверьте учетные данные в `db.js`
- Проверьте файрвол SQL Server

### Не открывается в браузере
- Проверьте файрвол сервера
- Проверьте, что сервер слушает на `0.0.0.0`, а не только `localhost`
- Проверьте правильность IP адреса

## Безопасность

Для продакшена рекомендуется:
1. Использовать HTTPS (через обратный прокси)
2. Настроить аутентификацию (если нужно)
3. Ограничить доступ по IP (в файрволе или Nginx)
4. Использовать переменные окружения для паролей БД
