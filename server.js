// Express сервер для API работы с БД прогресса печати
const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const fs = require('fs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3022;

// Middleware
app.use(cors());
app.use(express.json());

// Проверка существования файлов
const indexPath = path.resolve(__dirname, 'index.html');
const originalHtmlPath = path.resolve(__dirname, 'сканер_озон —2.html');

// Главная страница - раздаем index.html или оригинальный файл
app.get('/', (req, res) => {
    let fileToSend = null;
    
    // Проверяем какой файл существует
    if (fs.existsSync(indexPath)) {
        fileToSend = indexPath;
    } else if (fs.existsSync(originalHtmlPath)) {
        fileToSend = originalHtmlPath;
    } else {
        return res.status(404).send(`
            <h1>Файл не найден</h1>
            <p>Ищем файлы:</p>
            <ul>
                <li>${indexPath}</li>
                <li>${originalHtmlPath}</li>
            </ul>
            <p>Текущая директория: ${__dirname}</p>
        `);
    }
    
    try {
        console.log('Отправка файла:', fileToSend);
        res.sendFile(fileToSend);
    } catch (error) {
        console.error('Ошибка отправки файла:', error);
        res.status(500).send(`Ошибка загрузки страницы: ${error.message}`);
    }
});

// Раздача статических файлов (CSS, JS, изображения и т.д.)
app.use(express.static(__dirname, {
    index: false // Отключаем автоматический index.html, так как обрабатываем вручную
}));

// Инициализация БД при запуске
db.initPool().then(() => {
    // Создаем таблицу если её нет
    db.createTable().catch(err => {
        console.error('⚠️ Предупреждение при создании таблицы:', err.message);
    });
}).catch(err => {
    console.error('❌ Критическая ошибка подключения к БД:', err);
});

// API: Сохранение прогресса печати одной этикетки
app.post('/api/progress/save', async (req, res) => {
    try {
        const { taskName, vpsNumber, normalizedVps, marking } = req.body;
        
        if (!taskName || !vpsNumber || !normalizedVps) {
            return res.status(400).json({ 
                success: false, 
                error: 'Отсутствуют обязательные поля: taskName, vpsNumber, normalizedVps' 
            });
        }
        
        await db.savePrintProgress(taskName, vpsNumber, normalizedVps, marking);
        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка сохранения прогресса:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API: Загрузка прогресса печати для задания
app.get('/api/progress/load/:taskName', async (req, res) => {
    try {
        const taskName = decodeURIComponent(req.params.taskName);
        const result = await db.loadPrintProgress(taskName);
        res.json(result);
    } catch (error) {
        console.error('Ошибка загрузки прогресса:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API: Получение статистики по заданию
app.get('/api/progress/stats/:taskName', async (req, res) => {
    try {
        const taskName = decodeURIComponent(req.params.taskName);
        const result = await db.getTaskStats(taskName);
        res.json(result);
    } catch (error) {
        console.error('Ошибка получения статистики:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API: Удаление прогресса задания (опционально)
app.delete('/api/progress/delete/:taskName', async (req, res) => {
    try {
        const taskName = decodeURIComponent(req.params.taskName);
        const result = await db.deleteTaskProgress(taskName);
        res.json(result);
    } catch (error) {
        console.error('Ошибка удаления прогресса:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API: Проверка статуса сервера
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

// Функция для определения локального IP адреса
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return 'localhost';
}

// Запуск сервера с обработкой ошибок
const server = app.listen(PORT, '0.0.0.0', () => {
    const serverIP = getLocalIP();
    
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`🌐 Приложение доступно:`);
    console.log(`   - Локально: http://localhost:${PORT}`);
    console.log(`   - В сети: http://${serverIP}:${PORT}`);
    console.log(`📊 API доступен по адресу http://${serverIP}:${PORT}/api`);
    console.log(`\n💡 Проверка работы: http://${serverIP}:${PORT}/api/health`);
});

// Обработка ошибок при запуске сервера
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ ОШИБКА: Порт ${PORT} уже занят!`);
        if (PORT === 22) {
            console.error(`\n⚠️  ВНИМАНИЕ: Порт 22 обычно используется для SSH!`);
            console.error(`   Рекомендуется использовать другой порт: PORT=3022 npm start\n`);
        }
        console.error(`\n🔧 Решение:`);
        console.error(`   1. Найдите процесс: sudo lsof -i :${PORT}`);
        console.error(`   2. Остановите его: kill <PID>`);
        console.error(`   3. Или остановите PM2: pm2 stop fbo-printer-ozon`);
        console.error(`   4. Или используйте другой порт: PORT=3022 npm start\n`);
        process.exit(1);
    } else {
        console.error('❌ Ошибка запуска сервера:', error);
        process.exit(1);
    }
});
