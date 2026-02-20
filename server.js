// Express сервер для API работы с БД прогресса печати
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3019;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Для раздачи статических файлов (HTML)

// Главная страница - раздаем index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

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

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Сервер запущен на http://0.0.0.0:${PORT}`);
    console.log(`🌐 Приложение доступно по адресу http://localhost:${PORT}`);
    console.log(`📊 API доступен по адресу http://localhost:${PORT}/api`);
    console.log(`\n💡 Для доступа с других компьютеров используйте: http://<IP_СЕРВЕРА>:${PORT}`);
});
