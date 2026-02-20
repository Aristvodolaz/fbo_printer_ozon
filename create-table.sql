-- SQL скрипт для создания таблицы прогресса печати этикеток
-- База данных: SPOe_rc

-- Создание таблицы для хранения прогресса печати
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='LabelPrintProgress' AND xtype='U')
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

-- Создание индексов для ускорения поиска
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_TaskName' AND object_id = OBJECT_ID('LabelPrintProgress'))
CREATE INDEX IX_TaskName ON LabelPrintProgress(TaskName);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_NormalizedVps' AND object_id = OBJECT_ID('LabelPrintProgress'))
CREATE INDEX IX_NormalizedVps ON LabelPrintProgress(NormalizedVps);

-- Комментарии к таблице и колонкам
EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Таблица для хранения прогресса печати этикеток OZON FBO', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'LabelPrintProgress';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Название задания (обычно имя Excel файла)', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'LabelPrintProgress',
    @level2type = N'COLUMN', @level2name = N'TaskName';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Номер ВПС (оригинальный)', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'LabelPrintProgress',
    @level2type = N'COLUMN', @level2name = N'VpsNumber';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Нормализованный номер ВПС (для поиска)', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'LabelPrintProgress',
    @level2type = N'COLUMN', @level2name = N'NormalizedVps';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Маркировка товара', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'LabelPrintProgress',
    @level2type = N'COLUMN', @level2name = N'Marking';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Время последней печати', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'LabelPrintProgress',
    @level2type = N'COLUMN', @level2name = N'PrintedAt';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Время создания записи', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'LabelPrintProgress',
    @level2type = N'COLUMN', @level2name = N'CreatedAt';
