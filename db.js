// Модуль для работы с базой данных SQL Server
const sql = require('mssql');

// Конфигурация подключения к БД
const config = {
    user: 'sa',
    password: 'icY2eGuyfU',
    server: 'PRM-SRV-MSSQL-01.komus.net',
    port: 59587,
    database: 'SPOe_rc',
    pool: {
        max: 500,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: true,
        enableArithAbort: true,
        trustServerCertificate: true
    }
};

let pool = null;

// Инициализация пула подключений
async function initPool() {
    if (!pool) {
        try {
            pool = await sql.connect(config);
            console.log('✅ Подключение к БД установлено');
            return pool;
        } catch (error) {
            console.error('❌ Ошибка подключения к БД:', error);
            throw error;
        }
    }
    return pool;
}

// Создание таблицы для хранения прогресса печати
async function createTable() {
    try {
        await initPool();
        
        const createTableQuery = `
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='LabelPrintProgress' AND xtype='U')
            BEGIN
                CREATE TABLE LabelPrintProgress (
                    Id INT IDENTITY(1,1) PRIMARY KEY,
                    TaskName NVARCHAR(500) NOT NULL,
                    VpsNumber NVARCHAR(100) NOT NULL,
                    NormalizedVps NVARCHAR(100) NOT NULL,
                    Marking NVARCHAR(500),
                    PrintedAt DATETIME DEFAULT GETDATE(),
                    CreatedAt DATETIME DEFAULT GETDATE(),
                    UNIQUE(TaskName, NormalizedVps)
                );
                
                CREATE INDEX IX_TaskName ON LabelPrintProgress(TaskName);
                CREATE INDEX IX_NormalizedVps ON LabelPrintProgress(NormalizedVps);
            END
            ELSE
            BEGIN
                -- Создаем индексы если их нет
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_TaskName' AND object_id = OBJECT_ID('LabelPrintProgress'))
                    CREATE INDEX IX_TaskName ON LabelPrintProgress(TaskName);
                
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_NormalizedVps' AND object_id = OBJECT_ID('LabelPrintProgress'))
                    CREATE INDEX IX_NormalizedVps ON LabelPrintProgress(NormalizedVps);
            END
        `;
        
        await pool.request().query(createTableQuery);
        console.log('✅ Таблица LabelPrintProgress создана или уже существует');
        return true;
    } catch (error) {
        console.error('❌ Ошибка создания таблицы:', error);
        throw error;
    }
}

// Сохранение прогресса печати одной этикетки
async function savePrintProgress(taskName, vpsNumber, normalizedVps, marking) {
    try {
        await initPool();
        
        const request = pool.request();
        request.input('taskName', sql.NVarChar(500), taskName);
        request.input('vpsNumber', sql.NVarChar(100), vpsNumber);
        request.input('normalizedVps', sql.NVarChar(100), normalizedVps);
        request.input('marking', sql.NVarChar(500), marking || null);
        
        // Используем MERGE для обновления или вставки
        const query = `
            MERGE LabelPrintProgress AS target
            USING (SELECT @taskName AS TaskName, @normalizedVps AS NormalizedVps) AS source
            ON target.TaskName = source.TaskName AND target.NormalizedVps = source.NormalizedVps
            WHEN MATCHED THEN
                UPDATE SET 
                    VpsNumber = @vpsNumber,
                    Marking = @marking,
                    PrintedAt = GETDATE()
            WHEN NOT MATCHED THEN
                INSERT (TaskName, VpsNumber, NormalizedVps, Marking, PrintedAt, CreatedAt)
                VALUES (@taskName, @vpsNumber, @normalizedVps, @marking, GETDATE(), GETDATE());
        `;
        
        await request.query(query);
        return { success: true };
    } catch (error) {
        console.error('❌ Ошибка сохранения прогресса:', error);
        throw error;
    }
}

// Загрузка прогресса печати для задания
async function loadPrintProgress(taskName) {
    try {
        await initPool();
        
        const request = pool.request();
        request.input('taskName', sql.NVarChar(500), taskName);
        
        const query = `
            SELECT VpsNumber, NormalizedVps, Marking, PrintedAt
            FROM LabelPrintProgress
            WHERE TaskName = @taskName
            ORDER BY PrintedAt DESC
        `;
        
        const result = await request.query(query);
        return {
            success: true,
            printedVps: result.recordset.map(row => row.NormalizedVps),
            printedCount: result.recordset.length,
            details: result.recordset
        };
    } catch (error) {
        console.error('❌ Ошибка загрузки прогресса:', error);
        throw error;
    }
}

// Получение статистики по заданию
async function getTaskStats(taskName) {
    try {
        await initPool();
        
        const request = pool.request();
        request.input('taskName', sql.NVarChar(500), taskName);
        
        const query = `
            SELECT 
                COUNT(*) AS PrintedCount,
                MIN(CreatedAt) AS FirstPrint,
                MAX(PrintedAt) AS LastPrint
            FROM LabelPrintProgress
            WHERE TaskName = @taskName
        `;
        
        const result = await request.query(query);
        return {
            success: true,
            printedCount: result.recordset[0]?.PrintedCount || 0,
            firstPrint: result.recordset[0]?.FirstPrint,
            lastPrint: result.recordset[0]?.LastPrint
        };
    } catch (error) {
        console.error('❌ Ошибка получения статистики:', error);
        throw error;
    }
}

// Удаление прогресса задания (опционально)
async function deleteTaskProgress(taskName) {
    try {
        await initPool();
        
        const request = pool.request();
        request.input('taskName', sql.NVarChar(500), taskName);
        
        const query = `DELETE FROM LabelPrintProgress WHERE TaskName = @taskName`;
        
        await request.query(query);
        return { success: true };
    } catch (error) {
        console.error('❌ Ошибка удаления прогресса:', error);
        throw error;
    }
}

module.exports = {
    initPool,
    createTable,
    savePrintProgress,
    loadPrintProgress,
    getTaskStats,
    deleteTaskProgress
};
