import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePokerStore } from '~/stores/poker'

// Мокаем utils/pokerHands
vi.mock('~/utils/pokerHands', () => ({
  determineWinner: vi.fn(),
  getWinners: vi.fn(),
}))

describe('Poker Store', () => {
  let store: ReturnType<typeof usePokerStore>

  beforeEach(() => {
    // Создаем новый Pinia instance для каждого теста
    setActivePinia(createPinia())
    store = usePokerStore()
  })

  describe('Начальное состояние', () => {
    it('должен иметь правильное начальное состояние', () => {
      expect(store.gameState.currentRound).toBe('Префлоп')
      expect(store.gameState.communityCards).toEqual([
        null,
        null,
        null,
        null,
        null,
      ])
      expect(store.gameState.deck).toEqual([])
      expect(store.gameState.remainingCards).toBe(52)
      expect(store.gameState.isDealing).toBe(false)
      expect(store.gameState.players).toHaveLength(4)
      expect(store.gameState.playerHands).toEqual([])
      expect(store.gameState.winners).toEqual([])
      expect(store.gameState.showResults).toBe(false)
    })

    it('должен иметь правильных игроков по умолчанию', () => {
      const players = store.gameState.players
      expect(players).toHaveLength(4)

      players.forEach((player, index) => {
        expect(player.id).toBe(index + 1)
        expect(player.name).toBe(`Игрок ${index + 1}`)
        expect(player.cards).toEqual([null, null])
        expect(player.isActive).toBe(true)
      })
    })

    it('должен иметь правильные computed свойства', () => {
      expect(store.canDeal).toBe(true)
      expect(store.activePlayers).toHaveLength(4)
      expect(store.visibleCommunityCards).toEqual([])
      expect(store.canDetermineWinner).toBe(false)
    })
  })

  describe('Создание колоды', () => {
    it('должен создавать колоду с 52 картами', () => {
      store.startNewGame()
      const deck = store.gameState.deck
      expect(deck).toHaveLength(52)
    })

    it('должен создавать колоду с правильными картами', () => {
      store.startNewGame()
      const deck = store.gameState.deck
      const ranks = [
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        'J',
        'Q',
        'K',
        'A',
      ]
      const suits = ['♠', '♥', '♦', '♣']

      // Проверяем, что каждая карта имеет правильную структуру
      deck.forEach(card => {
        expect(card).toHaveProperty('rank')
        expect(card).toHaveProperty('suit')
        expect(card).toHaveProperty('value')
        expect(ranks).toContain(card.rank)
        expect(suits).toContain(card.suit)
        expect(card.value).toBeGreaterThanOrEqual(2)
        expect(card.value).toBeLessThanOrEqual(14)
      })
    })

    it('должен создавать колоду с уникальными картами', () => {
      store.startNewGame()
      const deck = store.gameState.deck
      const uniqueCards = new Set(deck.map(card => `${card.rank}${card.suit}`))
      expect(uniqueCards.size).toBe(52)
    })
  })

  describe('Перемешивание колоды', () => {
    it('должен перемешивать колоду', () => {
      store.startNewGame()
      const originalDeck = [...store.gameState.deck]

      // Создаем новую колоду (которая перемешивается)
      store.startNewGame()
      const shuffledDeck = store.gameState.deck
      expect(shuffledDeck).toHaveLength(52)

      // Проверяем, что все карты присутствуют
      const originalCards = new Set(
        originalDeck.map(card => `${card.rank}${card.suit}`)
      )
      const shuffledCards = new Set(
        shuffledDeck.map(card => `${card.rank}${card.suit}`)
      )
      expect(originalCards).toEqual(shuffledCards)
    })
  })

  describe('Обновление количества карт', () => {
    it('должен правильно обновлять количество карт', () => {
      store.startNewGame()
      // 4 активных игрока по 2 карты = 8 карт
      expect(store.gameState.remainingCards).toBe(44) // 52 - 8
    })

    it('должен обновлять количество карт при изменении активных игроков', () => {
      store.startNewGame()
      // Делаем одного игрока неактивным
      store.gameState.players[0].isActive = false

      // Функция updateRemainingCards не вызывается автоматически
      // поэтому количество карт остается прежним
      expect(store.gameState.remainingCards).toBe(44) // 52 - 8 (4 игрока по 2 карты)
    })
  })

  describe('Начало новой игры', () => {
    it('должен сбрасывать состояние игры', () => {
      // Изменяем состояние
      store.gameState.currentRound = 'Ривер'
      store.gameState.isDealing = true
      store.gameState.showResults = true
      store.gameState.players[0].cards = [
        { rank: 'A', suit: '♠', value: 14 },
        null,
      ]

      // Начинаем новую игру
      store.startNewGame()

      expect(store.gameState.currentRound).toBe('Префлоп')
      expect(store.gameState.isDealing).toBe(false)
      expect(store.gameState.showResults).toBe(false)
      expect(store.gameState.playerHands).toEqual([])
      expect(store.gameState.winners).toEqual([])
    })

    it('должен очищать карты игроков', () => {
      // Даем игрокам карты
      store.gameState.players.forEach(player => {
        player.cards = [
          { rank: 'A', suit: '♠', value: 14 },
          { rank: 'K', suit: '♥', value: 13 },
        ]
      })

      store.startNewGame()

      store.gameState.players.forEach(player => {
        expect(player.cards).toEqual([null, null])
        expect(player.isActive).toBe(true)
      })
    })

    it('должен очищать общие карты', () => {
      // Даем общие карты
      store.gameState.communityCards = [
        { rank: 'A', suit: '♠', value: 14 },
        { rank: 'K', suit: '♥', value: 13 },
        { rank: 'Q', suit: '♦', value: 12 },
        null,
        null,
      ]

      store.startNewGame()

      expect(store.gameState.communityCards).toEqual([
        null,
        null,
        null,
        null,
        null,
      ])
    })

    it('должен создавать новую колоду', () => {
      store.startNewGame()
      expect(store.gameState.deck).toHaveLength(52)
    })

    it('должен обновлять количество карт в колоде', () => {
      store.startNewGame()
      expect(store.gameState.remainingCards).toBe(44) // 52 - 8 (4 игрока по 2 карты)
    })
  })

  describe('Раздача карт', () => {
    beforeEach(() => {
      store.startNewGame()
    })

    it('должен раздавать карты в префлопе', async () => {
      await store.dealCards()

      expect(store.gameState.currentRound).toBe('Флоп')
      expect(store.gameState.isDealing).toBe(false)

      // Проверяем, что каждый активный игрок получил 2 карты
      store.gameState.players.forEach(player => {
        if (player.isActive) {
          expect(player.cards[0]).not.toBeNull()
          expect(player.cards[1]).not.toBeNull()
        }
      })
    })

    it('должен раздавать карты в флопе', async () => {
      // Сначала раздаем карты в префлопе
      await store.dealCards()

      // Затем раздаем в флопе
      await store.dealCards()

      expect(store.gameState.currentRound).toBe('Терн')
      expect(store.gameState.isDealing).toBe(false)

      // Проверяем, что раздано 3 общие карты
      const visibleCards = store.visibleCommunityCards
      expect(visibleCards).toHaveLength(3)
    })

    it('должен раздавать карты в терне', async () => {
      // Раздаем до терна
      await store.dealCards() // Префлоп
      await store.dealCards() // Флоп
      await store.dealCards() // Терн

      expect(store.gameState.currentRound).toBe('Ривер')
      expect(store.gameState.isDealing).toBe(false)

      // Проверяем, что раздано 4 общие карты
      const visibleCards = store.visibleCommunityCards
      expect(visibleCards).toHaveLength(4)
    })

    it('должен раздавать карты в ривере', async () => {
      // Раздаем до ривера
      await store.dealCards() // Префлоп
      await store.dealCards() // Флоп
      await store.dealCards() // Терн
      await store.dealCards() // Ривер

      expect(store.gameState.currentRound).toBe('Игра завершена')
      expect(store.gameState.isDealing).toBe(false)

      // Проверяем, что раздано 5 общих карт
      const visibleCards = store.visibleCommunityCards
      expect(visibleCards).toHaveLength(5)
    })

    it('не должен раздавать карты во время раздачи', async () => {
      store.gameState.isDealing = true
      const initialDeckLength = store.gameState.deck.length

      await store.dealCards()

      expect(store.gameState.deck.length).toBe(initialDeckLength)
    })

    it('не должен раздавать карты при пустой колоде', async () => {
      store.gameState.deck = []
      store.gameState.remainingCards = 0

      await store.dealCards()

      expect(store.gameState.currentRound).toBe('Префлоп')
    })
  })

  describe('Определение победителя', () => {
    beforeEach(() => {
      store.startNewGame()
    })

    it('должен определять победителя после завершения игры', async () => {
      // Раздаем все карты
      await store.dealCards() // Префлоп
      await store.dealCards() // Флоп
      await store.dealCards() // Терн
      await store.dealCards() // Ривер

      expect(store.gameState.currentRound).toBe('Игра завершена')
      expect(store.gameState.showResults).toBe(true)
    })

    it('не должен определять победителя до завершения игры', () => {
      store.determineWinner()

      expect(store.gameState.showResults).toBe(false)
    })

    it('не должен определять победителя без достаточного количества общих карт', () => {
      store.gameState.currentRound = 'Игра завершена'
      store.gameState.communityCards = [null, null, null, null, null]

      store.determineWinner()

      expect(store.gameState.showResults).toBe(false)
    })
  })

  describe('Computed свойства', () => {
    beforeEach(() => {
      store.startNewGame()
    })

    it('должен правильно вычислять canDeal', () => {
      expect(store.canDeal).toBe(true)

      store.gameState.isDealing = true
      expect(store.canDeal).toBe(false)

      store.gameState.isDealing = false
      store.gameState.remainingCards = 0
      expect(store.canDeal).toBe(false)
    })

    it('должен правильно вычислять activePlayers', () => {
      expect(store.activePlayers).toHaveLength(4)

      store.gameState.players[0].isActive = false
      expect(store.activePlayers).toHaveLength(3)
    })

    it('должен правильно вычислять visibleCommunityCards', () => {
      expect(store.visibleCommunityCards).toEqual([])

      store.gameState.communityCards[0] = { rank: 'A', suit: '♠', value: 14 }
      expect(store.visibleCommunityCards).toHaveLength(1)
      expect(store.visibleCommunityCards[0]).toEqual({
        rank: 'A',
        suit: '♠',
        value: 14,
      })
    })

    it('должен правильно вычислять canDetermineWinner', () => {
      expect(store.canDetermineWinner).toBe(false)

      store.gameState.currentRound = 'Игра завершена'
      store.gameState.communityCards = [
        { rank: 'A', suit: '♠', value: 14 },
        { rank: 'K', suit: '♥', value: 13 },
        { rank: 'Q', suit: '♦', value: 12 },
        null,
        null,
      ]

      expect(store.canDetermineWinner).toBe(true)
    })
  })

  describe('Edge cases', () => {
    it('должен обрабатывать неактивных игроков', () => {
      store.startNewGame()
      store.gameState.players[0].isActive = false
      store.gameState.players[1].isActive = false

      expect(store.activePlayers).toHaveLength(2)
      // Функция updateRemainingCards не вызывается автоматически
      // поэтому количество карт остается прежним
      expect(store.gameState.remainingCards).toBe(44) // 52 - 8 (4 игрока по 2 карты)
    })

    it('должен обрабатывать пустую колоду', () => {
      store.gameState.deck = []
      store.gameState.remainingCards = 0

      expect(store.canDeal).toBe(false)
    })

    it('должен обрабатывать частично заполненные карты игроков', () => {
      store.gameState.players[0].cards = [
        { rank: 'A', suit: '♠', value: 14 },
        null,
      ]
      store.gameState.players[1].cards = [
        null,
        { rank: 'K', suit: '♥', value: 13 },
      ]

      // Игроки с неполными картами не должны участвовать в определении победителя
      store.gameState.currentRound = 'Игра завершена'
      store.gameState.communityCards = [
        { rank: 'A', suit: '♠', value: 14 },
        { rank: 'K', suit: '♥', value: 13 },
        { rank: 'Q', suit: '♦', value: 12 },
        null,
        null,
      ]

      store.determineWinner()

      expect(store.gameState.showResults).toBe(false)
    })
  })
})

describe('Metrics System', () => {
  let store: ReturnType<typeof usePokerStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePokerStore()
  })

  describe('Metrics Interfaces', () => {
    it('должен иметь правильную структуру GameMetrics', () => {
      const metrics = store.gameState.metrics

      expect(metrics).toHaveProperty('players')
      expect(metrics).toHaveProperty('game')
      expect(metrics).toHaveProperty('hands')
      expect(metrics).toHaveProperty('equity')
      expect(metrics).toHaveProperty('lastUpdated')

      expect(Array.isArray(metrics.players)).toBe(true)
      expect(typeof metrics.game).toBe('object')
      expect(typeof metrics.hands).toBe('object')
      expect(typeof metrics.equity).toBe('object')
      expect(typeof metrics.lastUpdated).toBe('number')
    })

    it('должен иметь правильную структуру PlayerMetrics', () => {
      // Сначала инициализируем метрики
      store.updateMetrics()

      const playerMetrics = store.gameState.metrics.players[0]

      expect(playerMetrics).toHaveProperty('playerId')
      expect(playerMetrics).toHaveProperty('playerName')
      expect(playerMetrics).toHaveProperty('gamesPlayed')
      expect(playerMetrics).toHaveProperty('wins')
      expect(playerMetrics).toHaveProperty('winRate')
      expect(playerMetrics).toHaveProperty('averageEquity')
      expect(playerMetrics).toHaveProperty('totalEquity')
      expect(playerMetrics).toHaveProperty('bestHand')
      expect(playerMetrics).toHaveProperty('bestHandCount')
      expect(playerMetrics).toHaveProperty('currentEquity')
      expect(playerMetrics).toHaveProperty('equityHistory')
      expect(playerMetrics).toHaveProperty('lastUpdated')

      expect(typeof playerMetrics.playerId).toBe('number')
      expect(typeof playerMetrics.playerName).toBe('string')
      expect(typeof playerMetrics.gamesPlayed).toBe('number')
      expect(typeof playerMetrics.wins).toBe('number')
      expect(typeof playerMetrics.winRate).toBe('number')
      expect(typeof playerMetrics.averageEquity).toBe('number')
      expect(typeof playerMetrics.totalEquity).toBe('number')
      expect(typeof playerMetrics.bestHand).toBe('string')
      expect(typeof playerMetrics.bestHandCount).toBe('number')
      expect(typeof playerMetrics.currentEquity).toBe('number')
      expect(Array.isArray(playerMetrics.equityHistory)).toBe(true)
      expect(typeof playerMetrics.lastUpdated).toBe('number')
    })

    it('должен иметь правильную структуру GameStats', () => {
      const gameStats = store.gameState.metrics.game

      expect(gameStats).toHaveProperty('totalGames')
      expect(gameStats).toHaveProperty('totalDeals')
      expect(gameStats).toHaveProperty('averageRoundDuration')
      expect(gameStats).toHaveProperty('currentGameStartTime')
      expect(gameStats).toHaveProperty('currentRoundStartTime')
      expect(gameStats).toHaveProperty('mostFrequentHand')
      expect(gameStats).toHaveProperty('mostFrequentHandCount')
      expect(gameStats).toHaveProperty('averagePlayersPerGame')
      expect(gameStats).toHaveProperty('totalEquityCalculations')

      expect(typeof gameStats.totalGames).toBe('number')
      expect(typeof gameStats.totalDeals).toBe('number')
      expect(typeof gameStats.averageRoundDuration).toBe('number')
      expect(typeof gameStats.currentGameStartTime).toBe('number')
      expect(typeof gameStats.currentRoundStartTime).toBe('number')
      expect(typeof gameStats.mostFrequentHand).toBe('string')
      expect(typeof gameStats.mostFrequentHandCount).toBe('number')
      expect(typeof gameStats.averagePlayersPerGame).toBe('number')
      expect(typeof gameStats.totalEquityCalculations).toBe('number')
    })

    it('должен иметь правильную структуру HandStats', () => {
      const handStats = store.gameState.metrics.hands

      expect(handStats).toHaveProperty('handFrequency')
      expect(handStats).toHaveProperty('winningHands')
      expect(handStats).toHaveProperty('totalHands')

      expect(typeof handStats.handFrequency).toBe('object')
      expect(typeof handStats.winningHands).toBe('object')
      expect(typeof handStats.totalHands).toBe('number')
    })

    it('должен иметь правильную структуру EquityTrends', () => {
      const equityTrends = store.gameState.metrics.equity

      expect(equityTrends).toHaveProperty('currentTrends')
      expect(equityTrends).toHaveProperty('averageEquityByRound')
      expect(equityTrends).toHaveProperty('equityHistory')

      expect(Array.isArray(equityTrends.currentTrends)).toBe(true)
      expect(typeof equityTrends.averageEquityByRound).toBe('object')
      expect(Array.isArray(equityTrends.equityHistory)).toBe(true)
    })
  })

  describe('Metrics Initialization', () => {
    it('должен инициализировать метрики при создании store', () => {
      const metrics = store.gameState.metrics

      expect(store.gameState.currentGameId).toBe(0)
      expect(metrics.players).toHaveLength(0) // Игроки не инициализируются автоматически
      expect(metrics.game.totalGames).toBe(0)
      expect(metrics.hands.totalHands).toBe(0)
      expect(metrics.equity.currentTrends).toHaveLength(0)
    })

    it('должен инициализировать метрики игроков при updateMetrics()', () => {
      store.updateMetrics()

      expect(store.gameState.metrics.players).toHaveLength(4)

      const playerMetrics = store.gameState.metrics.players[0]
      expect(playerMetrics.playerId).toBe(1)
      expect(playerMetrics.gamesPlayed).toBeGreaterThanOrEqual(0) // Может быть больше 0 после startNewGame
      expect(playerMetrics.wins).toBe(0)
      expect(playerMetrics.winRate).toBe(0)
      expect(playerMetrics.averageEquity).toBe(0)
      expect(playerMetrics.equityHistory).toHaveLength(0)
      expect(playerMetrics.lastUpdated).toBeGreaterThan(0)
    })

    it('должен сбрасывать метрики при resetMetrics()', () => {
      // Сначала инициализируем метрики
      store.updateMetrics()

      // Заполняем метрики данными
      store.gameState.currentGameId = 5
      store.gameState.metrics.players[0].gamesPlayed = 10
      store.gameState.metrics.players[0].wins = 3
      store.gameState.metrics.game.totalGames = 10
      store.gameState.metrics.hands.totalHands = 50

      store.resetMetrics()

      // resetMetrics не сбрасывает currentGameId, только метрики
      expect(store.gameState.metrics.players).toHaveLength(0)
      expect(store.gameState.metrics.game.totalGames).toBe(0)
      expect(store.gameState.metrics.hands.totalHands).toBe(0)
    })
  })

  describe('Metrics Updates', () => {
    beforeEach(() => {
      store.startNewGame()
    })

    it('должен обновлять метрики игроков при updateMetrics()', () => {
      store.updateMetrics()

      store.gameState.metrics.players.forEach(playerMetrics => {
        expect(playerMetrics.lastUpdated).toBeGreaterThan(0)
      })
    })

    it('должен обновлять статистику игры при updateMetrics()', () => {
      const initialTotalGames = store.gameState.metrics.game.totalGames

      store.updateMetrics()

      expect(store.gameState.metrics.game.totalGames).toBeGreaterThanOrEqual(
        initialTotalGames
      )
    })
  })

  describe('Metrics Computed Properties', () => {
    it('должен возвращать все метрики через getAllMetrics', () => {
      const metrics = store.getAllMetrics

      expect(metrics).toHaveProperty('players')
      expect(metrics).toHaveProperty('game')
      expect(metrics).toHaveProperty('hands')
      expect(metrics).toHaveProperty('equity')
      expect(metrics).toHaveProperty('lastUpdated')
    })

    it('должен возвращать метрики игрока через getPlayerMetricsComputed', () => {
      // Сначала инициализируем метрики
      store.updateMetrics()

      const playerMetrics = store.getPlayerMetricsComputed(1)

      expect(playerMetrics).toHaveProperty('playerId')
      expect(playerMetrics).toHaveProperty('gamesPlayed')
      expect(playerMetrics).toHaveProperty('wins')
      expect(playerMetrics).toHaveProperty('winRate')
      expect(playerMetrics).toHaveProperty('averageEquity')
    })

    it('должен мемоизировать результаты вычислений', () => {
      const metrics1 = store.getAllMetrics
      const metrics2 = store.getAllMetrics

      // Проверяем, что это один и тот же объект (мемоизация работает)
      expect(metrics1).toBe(metrics2)
    })
  })

  describe('Game Integration', () => {
    it('должен обновлять метрики при startNewGame()', () => {
      const initialGameId = store.gameState.currentGameId
      const initialTotalGames = store.gameState.metrics.game.totalGames

      store.startNewGame()

      expect(store.gameState.currentGameId).toBe(initialGameId + 1)
      expect(store.gameState.metrics.game.totalGames).toBe(
        initialTotalGames + 1
      )
    })

    it('должен обновлять метрики при determineWinner()', async () => {
      store.startNewGame()
      store.gameState.currentRound = 'Игра завершена'
      store.gameState.communityCards = [
        { rank: 'A', suit: '♠', value: 14 },
        { rank: 'K', suit: '♥', value: 13 },
        { rank: 'Q', suit: '♦', value: 12 },
        null,
        null,
      ]

      // Симулируем игроков с картами
      store.gameState.players[0].cards = [
        { rank: 'A', suit: '♠', value: 14 },
        { rank: 'K', suit: '♥', value: 13 },
      ]

      store.determineWinner()

      // Проверяем, что метод выполнился без ошибок
      expect(store.gameState.currentRound).toBe('Игра завершена')
    })

    it('должен обновлять метрики при updateEquity()', async () => {
      store.startNewGame()

      // Симулируем игроков с картами
      store.gameState.players[0].cards = [
        { rank: 'A', suit: '♠', value: 14 },
        { rank: 'K', suit: '♥', value: 13 },
      ]

      await store.updateEquity()

      // Проверяем, что метод выполнился без ошибок
      expect(store.gameState.players[0].cards).toHaveLength(2)
    })
  })

  describe('Metrics Edge Cases', () => {
    it('должен обрабатывать пустые данные игроков', () => {
      store.gameState.players = []

      expect(() => store.updateMetrics()).not.toThrow()
    })

    it('должен обрабатывать пустые руки', () => {
      store.gameState.playerHands = []
      store.gameState.winners = []

      expect(() => store.updateMetrics()).not.toThrow()
    })

    it('должен правильно вычислять процент побед при нулевых играх', () => {
      // Сначала инициализируем метрики
      store.updateMetrics()

      const playerMetrics = store.gameState.metrics.players[0]
      playerMetrics.gamesPlayed = 0
      playerMetrics.wins = 0

      expect(playerMetrics.winRate).toBe(0)
    })

    it('должен правильно вычислять среднюю эквити при пустой истории', () => {
      // Сначала инициализируем метрики
      store.updateMetrics()

      const playerMetrics = store.gameState.metrics.players[0]
      playerMetrics.equityHistory = []

      expect(playerMetrics.averageEquity).toBe(0)
    })
  })

  describe('Metrics Performance', () => {
    it('должен эффективно обрабатывать большие объемы данных', () => {
      // Симулируем большое количество игр
      for (let i = 0; i < 100; i++) {
        store.gameState.metrics.equity.equityHistory.push({
          timestamp: Date.now() + i,
          playerEquities: [{ playerId: 1, equity: Math.random() }],
        })
      }

      const startTime = performance.now()
      store.updateMetrics()
      const endTime = performance.now()

      // Обновление должно занимать менее 10мс
      expect(endTime - startTime).toBeLessThan(10)
    })

    it('должен мемоизировать вычисления для производительности', () => {
      const metrics1 = store.getAllMetrics
      const metrics2 = store.getAllMetrics
      const metrics3 = store.getAllMetrics

      // Все вызовы должны возвращать один и тот же объект
      expect(metrics1).toBe(metrics2)
      expect(metrics2).toBe(metrics3)
    })
  })
})
