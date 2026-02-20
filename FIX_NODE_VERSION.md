# Исправление проблемы с версией Node.js

## Проблема

При установке зависимостей появляются предупреждения о несовместимости версий:
```
npm warn EBADENGINE Unsupported engine
package: '@azure/...'
required: { node: '>=20.0.0' }
current: { node: 'v18.20.5' }
```

## Решение

### Вариант 1: Использовать совместимую версию mssql (уже применено)

Я обновил `package.json` для использования `mssql@9.1.1`, которая совместима с Node.js 18.

**Что нужно сделать:**

1. Удалите старые зависимости:
```bash
# Windows
rmdir /s /q node_modules
del package-lock.json

# Linux/Mac
rm -rf node_modules package-lock.json
```

2. Переустановите зависимости:
```bash
npm install
```

Теперь предупреждения должны исчезнуть.

### Вариант 2: Обновить Node.js до версии 20+

Если хотите использовать последние версии пакетов:

1. **Скачайте Node.js 20 LTS:**
   - Windows: https://nodejs.org/
   - Linux: `sudo apt-get install nodejs=20.x` (или через nvm)
   - Mac: `brew install node@20` или через nvm

2. **Проверьте версию:**
```bash
node --version
# Должно быть v20.x.x или выше
```

3. **Обновите package.json обратно на mssql@10.x** (если нужно)

4. **Переустановите зависимости:**
```bash
rm -rf node_modules package-lock.json
npm install
```

## Текущая конфигурация

- **Node.js:** 18.20.5 (ваша текущая версия)
- **mssql:** 9.1.1 (совместима с Node.js 18)
- **express:** 4.18.2
- **cors:** 2.8.5

## Проверка

После переустановки запустите:
```bash
npm start
```

Если сервер запускается без ошибок - все работает правильно!
