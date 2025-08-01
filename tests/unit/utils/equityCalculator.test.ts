import { describe, it, expect } from 'vitest'
import {
  calculateQuickEquity,
  getKnownCards,
  createRemainingDeck,
} from '~/utils/equityCalculator'

import type { Card } from '~/stores/poker'

describe('Equity Calculator', () => {
  const mockCard: Card = {
    rank: 'A',
    suit: '♠',
    value: 14,
  }

  const mockPlayers = [
    {
      id: 1,
      name: 'Игрок 1',
      cards: [mockCard, { rank: 'K', suit: '♠', value: 13 }],
    },
    {
      id: 2,
      name: 'Игрок 2',
      cards: [
        { rank: 'Q', suit: '♥', value: 12 },
        { rank: 'J', suit: '♥', value: 11 },
      ],
    },
  ]

  const mockCommunityCards = [
    { rank: '10', suit: '♠', value: 10 },
    { rank: '9', suit: '♠', value: 9 },
    { rank: '8', suit: '♠', value: 8 },
    null,
    null,
  ]

  describe('getKnownCards', () => {
    it('должен собрать все известные карты', () => {
      const knownCards = getKnownCards(mockPlayers, mockCommunityCards)

      // 2 игрока × 2 карты + 3 общие карты = 7 карт
      expect(knownCards).toHaveLength(7)
      expect(knownCards).toContainEqual(mockCard)
      expect(knownCards).toContainEqual({ rank: 'K', suit: '♠', value: 13 })
      expect(knownCards).toContainEqual({ rank: 'Q', suit: '♥', value: 12 })
      expect(knownCards).toContainEqual({ rank: 'J', suit: '♥', value: 11 })
      expect(knownCards).toContainEqual({ rank: '10', suit: '♠', value: 10 })
      expect(knownCards).toContainEqual({ rank: '9', suit: '♠', value: 9 })
      expect(knownCards).toContainEqual({ rank: '8', suit: '♠', value: 8 })
    })
  })

  describe('createRemainingDeck', () => {
    it('должен создать колоду без известных карт', () => {
      const knownCards = getKnownCards(mockPlayers, mockCommunityCards)
      const remainingDeck = createRemainingDeck(knownCards)

      // Проверяем, что известные карты не включены в оставшуюся колоду
      knownCards.forEach(knownCard => {
        expect(remainingDeck).not.toContainEqual(knownCard)
      })

      // Проверяем размер колоды (52 - 7 известных карт = 45)
      expect(remainingDeck).toHaveLength(45)
    })
  })

  describe('calculateQuickEquity', () => {
    it('должен рассчитать equity для игроков', async () => {
      const result = calculateQuickEquity(mockPlayers, mockCommunityCards)

      expect(result).toHaveProperty('players')
      expect(result).toHaveProperty('totalSimulations')
      expect(result).toHaveProperty('calculationTime')
      expect(result.players).toHaveLength(2)
      expect(result.totalSimulations).toBe(1000)

      // Проверяем, что equity для каждого игрока в диапазоне 0-100
      result.players.forEach(player => {
        expect(player.equity).toBeGreaterThanOrEqual(0)
        expect(player.equity).toBeLessThanOrEqual(100)
        expect(player.playerId).toBeDefined()
        expect(player.playerName).toBeDefined()
        expect(player.winCount).toBeGreaterThanOrEqual(0)
        expect(player.totalSimulations).toBe(1000)
      })
    })

    it('должен вернуть пустой результат для игроков без карт', () => {
      const playersWithoutCards = [
        {
          id: 1,
          name: 'Игрок 1',
          cards: [null, null],
        },
        {
          id: 2,
          name: 'Игрок 2',
          cards: [null, null],
        },
      ]

      const result = calculateQuickEquity(playersWithoutCards, [])

      expect(result.players).toHaveLength(0)
      expect(result.totalSimulations).toBe(0)
    })

    it('должен корректно рассчитывать equity для сильных рук', () => {
      // Игрок с тузом и королем одной масти (сильная рука)
      const strongPlayer = [
        {
          id: 1,
          name: 'Сильный игрок',
          cards: [
            { rank: 'A', suit: '♠', value: 14 },
            { rank: 'K', suit: '♠', value: 13 },
          ],
        },
      ]

      // Игрок со слабыми картами
      const weakPlayer = [
        {
          id: 2,
          name: 'Слабый игрок',
          cards: [
            { rank: '7', suit: '♥', value: 7 },
            { rank: '2', suit: '♦', value: 2 },
          ],
        },
      ]

      const allPlayers = [...strongPlayer, ...weakPlayer]
      const communityCards = [
        { rank: 'Q', suit: '♠', value: 12 },
        { rank: 'J', suit: '♠', value: 11 },
        { rank: '10', suit: '♠', value: 10 },
        null,
        null,
      ]

      const result = calculateQuickEquity(allPlayers, communityCards)

      expect(result.players).toHaveLength(2)

      const strongPlayerEquity = result.players.find(p => p.playerId === 1)
      const weakPlayerEquity = result.players.find(p => p.playerId === 2)

      // Сильный игрок должен иметь больше equity
      expect(strongPlayerEquity?.equity).toBeGreaterThan(
        weakPlayerEquity?.equity || 0
      )
    })
  })
})
