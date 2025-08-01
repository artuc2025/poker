# Тестирование poker-vue

## Обзор

Этот проект использует **Vitest** для unit-тестирования с поддержкой TypeScript и Vue 3.

## Структура тестов

```
tests/
├── unit/
│   └── utils/
│       └── pokerHands.test.ts    # Тесты для логики покера
└── README.md
```

## Запуск тестов

```bash
# Запуск в watch режиме
npm run test

# Запуск один раз
npm run test:run

# Запуск с покрытием
npm run test:coverage
```

## Покрытие тестами

### pokerHands.test.ts

**31 тест** покрывает все функции из `utils/pokerHands.ts`:

#### Вспомогательные функции (7 тестов)

- `getPlayerAllCards` - объединение карт игрока и общих карт
- `getCardCounts` - подсчет количества карт каждого достоинства
- `isFlush` - проверка на флеш
- `isStraight` - проверка на стрит (включая A,2,3,4,5)
- `getBestFiveCards` - получение лучших 5 карт
- `getStraightCards` - получение карт для стрита

#### Определение комбинаций (12 тестов)

- **Роял-флеш** - A♠ K♠ Q♠ J♠ 10♠
- **Стрит-флеш** - 9♠ 8♠ 7♠ 6♠ 5♠
- **Каре** - A♠ A♥ A♦ A♣ K♠
- **Фулл-хаус** - A♠ A♥ A♦ K♣ K♠
- **Флеш** - A♠ K♠ Q♠ J♠ 9♠
- **Стрит** - A♠ K♥ Q♦ J♣ 10♠
- **Тройка** - A♠ A♥ A♦ K♣ Q♠
- **Две пары** - A♠ A♥ K♦ K♣ Q♠
- **Пара** - A♠ A♥ K♦ Q♣ J♠
- **Старшая карта** - A♠ K♥ Q♦ J♣ 9♠
- **Edge cases** - неполные руки и пустые массивы

#### Определение победителей (5 тестов)

- `determineWinner` - сортировка игроков по силе комбинации
- `getWinners` - получение только победителей (с учетом ничьих)

## Ключевые особенности тестирования

### 1. Правильная логика покера

Тесты учитывают, что в покере игрок выбирает **лучшую комбинацию** из всех доступных карт:

- Если есть стрит в общих картах, он сильнее пары в личных картах
- Функция `evaluateHand` корректно определяет сильнейшую комбинацию

### 2. Edge cases

- Пустые массивы карт
- Неполные руки (менее 5 карт)
- Дублирующиеся значения в стрите
- Ничьи между игроками

### 3. Типизация

Все тесты используют строгую типизацию TypeScript:

```typescript
const createCard = (rank: string, suit: string, value: number): Card => ({
  rank,
  suit,
  value,
})
```

## Конфигурация

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './'),
      '@': resolve(__dirname, './'),
    },
  },
})
```

### package.json scripts

```json
{
  "test": "vitest",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage"
}
```

## Следующие шаги

1. **Component-тесты** - тестирование Vue компонентов
2. **Store-тесты** - тестирование Pinia store
3. **Integration-тесты** - тестирование полного flow игры
4. **E2E-тесты** - тестирование пользовательских сценариев

## Зависимости

- `vitest` - тестовый фреймворк
- `@vue/test-utils` - утилиты для тестирования Vue
- `@vitejs/plugin-vue` - поддержка Vue в Vite
- `jsdom` - DOM окружение для тестов
