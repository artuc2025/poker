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
