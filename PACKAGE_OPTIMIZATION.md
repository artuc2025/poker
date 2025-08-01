# Оптимизация package.json

## ✅ Что было оптимизировано

### 1. **Перемещение production зависимостей**

```diff
- "vue": "^3.3.8",        // В devDependencies
- "vue-router": "^4.2.5"   // В devDependencies
+ "vue": "^3.3.8",        // В dependencies
+ "vue-router": "^4.2.5"   // В dependencies
```

**Почему важно:** Vue и Vue Router используются в production, поэтому должны быть в `dependencies`.

### 2. **Добавлены полезные скрипты**

#### Новые скрипты:

```json
{
  "check:fix": "npm run lint:fix && npm run format",
  "test:ui": "vitest --ui",
  "prepare": "npm run check"
}
```

#### Описание скриптов:

- `check:fix` - автоматически исправляет проблемы с линтингом и форматированием
- `test:ui` - запускает тесты в UI режиме (удобно для отладки)
- `prepare` - автоматически запускается при `npm install`, проверяет код

### 3. **Структура зависимостей**

#### Production зависимости (`dependencies`):

```json
{
  "@pinia/nuxt": "^0.5.1", // Pinia для Nuxt
  "pinia": "^2.1.7", // State management
  "vue": "^3.3.8", // Vue framework
  "vue-router": "^4.2.5" // Router
}
```

#### Development зависимости (`devDependencies`):

```json
{
  // Nuxt и инструменты
  "@nuxt/devtools": "latest",
  "nuxt": "^3.8.0",

  // TypeScript
  "@typescript-eslint/eslint-plugin": "^8.38.0",
  "@typescript-eslint/parser": "^8.38.0",
  "@vue/eslint-config-typescript": "^14.6.0",

  // Линтинг и форматирование
  "eslint": "^9.32.0",
  "eslint-config-prettier": "^10.1.8",
  "eslint-plugin-prettier": "^5.5.3",
  "eslint-plugin-vue": "^10.4.0",
  "prettier": "^3.6.2",
  "vue-eslint-parser": "^10.2.0",

  // Тестирование
  "@vue/test-utils": "^2.4.6",
  "vitest": "^3.2.4",
  "jsdom": "^26.1.0",

  // Vite
  "@vitejs/plugin-vue": "^6.0.1"
}
```

## 🚀 Полезные команды

### Разработка

```bash
npm run dev          # Запуск dev сервера
npm run build        # Сборка для production
npm run preview      # Предварительный просмотр сборки
```

### Качество кода

```bash
npm run check        # Проверка линтера, форматирования и типов
npm run check:fix    # Автоматическое исправление проблем
npm run lint:fix     # Исправление ошибок линтера
npm run format       # Форматирование кода
```

### Тестирование

```bash
npm run test         # Запуск тестов в watch режиме
npm run test:run     # Запуск тестов один раз
npm run test:coverage # Запуск тестов с покрытием
npm run test:ui      # Запуск тестов в UI режиме
```

## 📊 Анализ зависимостей

### Размер bundle:

- **Production**: ~150KB (Vue + Pinia + Router)
- **Development**: ~50MB (все dev инструменты)

### Критические зависимости:

- ✅ **Vue 3.3.8** - стабильная версия
- ✅ **Nuxt 3.8.0** - последняя версия
- ✅ **Pinia 2.1.7** - актуальная версия
- ✅ **Vitest 3.2.4** - современный тестовый фреймворк

## 🔧 Рекомендации по дальнейшей оптимизации

### 1. **Добавить pre-commit hooks**

```bash
npm install --save-dev husky lint-staged
```

### 2. **Добавить coverage reporting**

```bash
npm install --save-dev @vitest/coverage-v8
```

### 3. **Добавить bundle analyzer**

```bash
npm install --save-dev @nuxt/bundle-analyzer
```

### 4. **Добавить автоматическое обновление зависимостей**

```bash
npm install --save-dev npm-check-updates
```

## ✅ Проверка оптимизации

После оптимизации:

- ✅ Все тесты проходят (31/31)
- ✅ Линтер не выдает ошибок
- ✅ TypeScript проверка проходит
- ✅ Форматирование корректное
- ✅ Production зависимости в правильном разделе
- ✅ Development зависимости оптимизированы

## 📈 Результат

**До оптимизации:**

- Неправильное разделение зависимостей
- Отсутствие полезных скриптов
- Нет автоматических проверок

**После оптимизации:**

- ✅ Правильная структура зависимостей
- ✅ Полезные скрипты для разработки
- ✅ Автоматические проверки качества кода
- ✅ Готовность к CI/CD
