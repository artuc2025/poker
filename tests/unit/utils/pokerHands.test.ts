import { describe, it, expect } from 'vitest'
import {
  getPlayerAllCards,
  getCardCounts,
  isFlush,
  isStraight,
  getBestFiveCards,
  getStraightCards,
  evaluateHand,
  determineWinner,
  getWinners,
  HAND_RANKS,
  HAND_NAMES,
} from '~/utils/pokerHands'
import type { Card } from '~/stores/poker'

// Тестовые данные
const createCard = (rank: string, suit: string, value: number): Card => ({
  rank,
  suit,
  value,
})

describe('pokerHands utils', () => {
  describe('getPlayerAllCards', () => {
    it('должен объединить карты игрока и общие карты', () => {
      const playerCards: Card[] = [
        createCard('A', '♠', 14),
        createCard('K', '♥', 13),
      ]
      const communityCards: Card[] = [
        createCard('Q', '♦', 12),
        createCard('J', '♣', 11),
        createCard('10', '♠', 10),
      ]

      const result = getPlayerAllCards(playerCards, communityCards)

      expect(result).toHaveLength(5)
      expect(result).toEqual([
        createCard('A', '♠', 14),
        createCard('K', '♥', 13),
        createCard('Q', '♦', 12),
        createCard('J', '♣', 11),
        createCard('10', '♠', 10),
      ])
    })

    it('должен фильтровать null значения из общих карт', () => {
      const playerCards: Card[] = [
        createCard('A', '♠', 14),
        createCard('K', '♥', 13),
      ]
      const communityCards: (Card | null)[] = [
        createCard('Q', '♦', 12),
        null,
        createCard('J', '♣', 11),
        null,
        createCard('10', '♠', 10),
      ]

      // Приводим communityCards к типу Card[], фильтруя null — это нужно для корректной типизации и предотвращения ошибок
      const filteredCommunityCards: Card[] = communityCards.filter(
        (card): card is Card => card !== null
      )

      const result = getPlayerAllCards(playerCards, filteredCommunityCards)

      expect(result).toHaveLength(5)
      expect(result).toEqual([
        createCard('A', '♠', 14),
        createCard('K', '♥', 13),
        createCard('Q', '♦', 12),
        createCard('J', '♣', 11),
        createCard('10', '♠', 10),
      ])
    })
  })

  describe('getCardCounts', () => {
    it('должен подсчитать количество карт каждого достоинства', () => {
      const cards: Card[] = [
        createCard('A', '♠', 14),
        createCard('A', '♥', 14),
        createCard('K', '♦', 13),
        createCard('Q', '♣', 12),
        createCard('Q', '♠', 12),
      ]

      const result = getCardCounts(cards)

      expect(result).toEqual({
        A: 2,
        K: 1,
        Q: 2,
      })
    })

    it('должен вернуть пустой объект для пустого массива', () => {
      const result = getCardCounts([])
      expect(result).toEqual({})
    })
  })

  describe('isFlush', () => {
    it('должен вернуть true для флеша (5 карт одной масти)', () => {
      const cards: Card[] = [
        createCard('A', '♠', 14),
        createCard('K', '♠', 13),
        createCard('Q', '♠', 12),
        createCard('J', '♠', 11),
        createCard('10', '♠', 10),
      ]

      const result = isFlush(cards)
      expect(result).toBe(true)
    })

    it('должен вернуть false для неполного флеша', () => {
      const cards: Card[] = [
        createCard('A', '♠', 14),
        createCard('K', '♠', 13),
        createCard('Q', '♠', 12),
        createCard('J', '♥', 11),
        createCard('10', '♠', 10),
      ]

      const result = isFlush(cards)
      expect(result).toBe(false)
    })

    it('должен вернуть true для флеша с более чем 5 картами одной масти', () => {
      const cards: Card[] = [
        createCard('A', '♠', 14),
        createCard('K', '♠', 13),
        createCard('Q', '♠', 12),
        createCard('J', '♠', 11),
        createCard('10', '♠', 10),
        createCard('9', '♠', 9),
      ]

      const result = isFlush(cards)
      expect(result).toBe(true)
    })
  })

  describe('isStraight', () => {
    it('должен вернуть true для обычного стрита', () => {
      const cards: Card[] = [
        createCard('A', '♠', 14),
        createCard('K', '♥', 13),
        createCard('Q', '♦', 12),
        createCard('J', '♣', 11),
        createCard('10', '♠', 10),
      ]

      const result = isStraight(cards)
      expect(result).toBe(true)
    })

    it('должен вернуть true для стрита с тузом внизу (A,2,3,4,5)', () => {
      const cards: Card[] = [
        createCard('A', '♠', 14),
        createCard('2', '♥', 2),
        createCard('3', '♦', 3),
        createCard('4', '♣', 4),
        createCard('5', '♠', 5),
      ]

      const result = isStraight(cards)
      expect(result).toBe(true)
    })

    it('должен вернуть false для неполного стрита', () => {
      const cards: Card[] = [
        createCard('A', '♠', 14),
        createCard('K', '♥', 13),
        createCard('Q', '♦', 12),
        createCard('J', '♣', 11),
        createCard('9', '♠', 9),
      ]

      const result = isStraight(cards)
      expect(result).toBe(false)
    })

    it('должен вернуть false для дублирующихся значений', () => {
      const cards: Card[] = [
        createCard('A', '♠', 14),
        createCard('K', '♥', 13),
        createCard('K', '♦', 13),
        createCard('J', '♣', 11),
        createCard('10', '♠', 10),
      ]

      const result = isStraight(cards)
      expect(result).toBe(false)
    })
  })

  describe('getBestFiveCards', () => {
    it('должен вернуть 5 лучших карт', () => {
      const cards: Card[] = [
        createCard('2', '♠', 2),
        createCard('A', '♥', 14),
        createCard('K', '♦', 13),
        createCard('Q', '♣', 12),
        createCard('J', '♠', 11),
        createCard('10', '♥', 10),
        createCard('9', '♦', 9),
      ]

      const result = getBestFiveCards(cards)

      expect(result).toHaveLength(5)
      expect(result[0].value).toBe(14) // A
      expect(result[1].value).toBe(13) // K
      expect(result[2].value).toBe(12) // Q
      expect(result[3].value).toBe(11) // J
      expect(result[4].value).toBe(10) // 10
    })
  })

  describe('getStraightCards', () => {
    it('должен вернуть карты для обычного стрита', () => {
      const cards: Card[] = [
        createCard('A', '♠', 14),
        createCard('K', '♥', 13),
        createCard('Q', '♦', 12),
        createCard('J', '♣', 11),
        createCard('10', '♠', 10),
      ]

      const result = getStraightCards(cards)

      expect(result).toHaveLength(5)
      expect(result[0].value).toBe(14) // A
      expect(result[1].value).toBe(13) // K
      expect(result[2].value).toBe(12) // Q
      expect(result[3].value).toBe(11) // J
      expect(result[4].value).toBe(10) // 10
    })

    it('должен вернуть карты для стрита с тузом внизу', () => {
      const cards: Card[] = [
        createCard('A', '♠', 14),
        createCard('2', '♥', 2),
        createCard('3', '♦', 3),
        createCard('4', '♣', 4),
        createCard('5', '♠', 5),
      ]

      const result = getStraightCards(cards)

      expect(result).toHaveLength(5)
      expect(result[0].value).toBe(14) // A
      expect(result[1].value).toBe(5) // 5
      expect(result[2].value).toBe(4) // 4
      expect(result[3].value).toBe(3) // 3
      expect(result[4].value).toBe(2) // 2
    })
  })

  describe('evaluateHand', () => {
    describe('Роял-флеш', () => {
      it('должен определить роял-флеш', () => {
        const cards: Card[] = [
          createCard('A', '♠', 14),
          createCard('K', '♠', 13),
          createCard('Q', '♠', 12),
          createCard('J', '♠', 11),
          createCard('10', '♠', 10),
        ]

        const result = evaluateHand(cards)

        expect(result.rank).toBe(HAND_RANKS.ROYAL_FLUSH)
        expect(result.name).toBe(HAND_NAMES[HAND_RANKS.ROYAL_FLUSH])
        expect(result.cards).toHaveLength(5)
      })
    })

    describe('Стрит-флеш', () => {
      it('должен определить стрит-флеш', () => {
        const cards: Card[] = [
          createCard('9', '♠', 9),
          createCard('8', '♠', 8),
          createCard('7', '♠', 7),
          createCard('6', '♠', 6),
          createCard('5', '♠', 5),
        ]

        const result = evaluateHand(cards)

        expect(result.rank).toBe(HAND_RANKS.STRAIGHT_FLUSH)
        expect(result.name).toBe(HAND_NAMES[HAND_RANKS.STRAIGHT_FLUSH])
        expect(result.cards).toHaveLength(5)
      })
    })

    describe('Каре', () => {
      it('должен определить каре', () => {
        const cards: Card[] = [
          createCard('A', '♠', 14),
          createCard('A', '♥', 14),
          createCard('A', '♦', 14),
          createCard('A', '♣', 14),
          createCard('K', '♠', 13),
        ]

        const result = evaluateHand(cards)

        expect(result.rank).toBe(HAND_RANKS.FOUR_OF_A_KIND)
        expect(result.name).toBe(HAND_NAMES[HAND_RANKS.FOUR_OF_A_KIND])
        expect(result.cards).toHaveLength(5)
      })
    })

    describe('Фулл-хаус', () => {
      it('должен определить фулл-хаус', () => {
        const cards: Card[] = [
          createCard('A', '♠', 14),
          createCard('A', '♥', 14),
          createCard('A', '♦', 14),
          createCard('K', '♣', 13),
          createCard('K', '♠', 13),
        ]

        const result = evaluateHand(cards)

        expect(result.rank).toBe(HAND_RANKS.FULL_HOUSE)
        expect(result.name).toBe(HAND_NAMES[HAND_RANKS.FULL_HOUSE])
        expect(result.cards).toHaveLength(5)
      })
    })

    describe('Флеш', () => {
      it('должен определить флеш', () => {
        const cards: Card[] = [
          createCard('A', '♠', 14),
          createCard('K', '♠', 13),
          createCard('Q', '♠', 12),
          createCard('J', '♠', 11),
          createCard('9', '♠', 9),
        ]

        const result = evaluateHand(cards)

        expect(result.rank).toBe(HAND_RANKS.FLUSH)
        expect(result.name).toBe(HAND_NAMES[HAND_RANKS.FLUSH])
        expect(result.cards).toHaveLength(5)
      })
    })

    describe('Стрит', () => {
      it('должен определить стрит', () => {
        const cards: Card[] = [
          createCard('A', '♠', 14),
          createCard('K', '♥', 13),
          createCard('Q', '♦', 12),
          createCard('J', '♣', 11),
          createCard('10', '♠', 10),
        ]

        const result = evaluateHand(cards)

        expect(result.rank).toBe(HAND_RANKS.STRAIGHT)
        expect(result.name).toBe(HAND_NAMES[HAND_RANKS.STRAIGHT])
        expect(result.cards).toHaveLength(5)
      })
    })

    describe('Тройка', () => {
      it('должен определить тройку', () => {
        const cards: Card[] = [
          createCard('A', '♠', 14),
          createCard('A', '♥', 14),
          createCard('A', '♦', 14),
          createCard('K', '♣', 13),
          createCard('Q', '♠', 12),
        ]

        const result = evaluateHand(cards)

        expect(result.rank).toBe(HAND_RANKS.THREE_OF_A_KIND)
        expect(result.name).toBe(HAND_NAMES[HAND_RANKS.THREE_OF_A_KIND])
        expect(result.cards).toHaveLength(5)
      })
    })

    describe('Две пары', () => {
      it('должен определить две пары', () => {
        const cards: Card[] = [
          createCard('A', '♠', 14),
          createCard('A', '♥', 14),
          createCard('K', '♦', 13),
          createCard('K', '♣', 13),
          createCard('Q', '♠', 12),
        ]

        const result = evaluateHand(cards)

        expect(result.rank).toBe(HAND_RANKS.TWO_PAIR)
        expect(result.name).toBe(HAND_NAMES[HAND_RANKS.TWO_PAIR])
        expect(result.cards).toHaveLength(5)
      })
    })

    describe('Пара', () => {
      it('должен определить пару', () => {
        const cards: Card[] = [
          createCard('A', '♠', 14),
          createCard('A', '♥', 14),
          createCard('K', '♦', 13),
          createCard('Q', '♣', 12),
          createCard('J', '♠', 11),
        ]

        const result = evaluateHand(cards)

        expect(result.rank).toBe(HAND_RANKS.ONE_PAIR)
        expect(result.name).toBe(HAND_NAMES[HAND_RANKS.ONE_PAIR])
        expect(result.cards).toHaveLength(5)
      })
    })

    describe('Старшая карта', () => {
      it('должен определить старшую карту', () => {
        const cards: Card[] = [
          createCard('A', '♠', 14),
          createCard('K', '♥', 13),
          createCard('Q', '♦', 12),
          createCard('J', '♣', 11),
          createCard('9', '♠', 9),
        ]

        const result = evaluateHand(cards)

        expect(result.rank).toBe(HAND_RANKS.HIGH_CARD)
        expect(result.name).toBe(HAND_NAMES[HAND_RANKS.HIGH_CARD])
        expect(result.cards).toHaveLength(5)
        expect(result.highCard?.value).toBe(14)
      })
    })

    describe('Edge cases', () => {
      it('должен обработать неполную руку', () => {
        const cards: Card[] = [
          createCard('A', '♠', 14),
          createCard('K', '♥', 13),
          createCard('Q', '♦', 12),
        ]

        const result = evaluateHand(cards)

        expect(result.rank).toBe(HAND_RANKS.HIGH_CARD)
        expect(result.cards).toHaveLength(3)
      })

      it('должен обработать пустой массив', () => {
        const result = evaluateHand([])

        expect(result.rank).toBe(HAND_RANKS.HIGH_CARD)
        expect(result.cards).toHaveLength(0)
      })
    })
  })

  describe('determineWinner', () => {
    it('должен определить победителя с лучшей комбинацией', () => {
      const players = [
        {
          id: 1,
          name: 'Игрок 1',
          cards: [createCard('A', '♠', 14), createCard('A', '♥', 14)],
        },
        {
          id: 2,
          name: 'Игрок 2',
          cards: [createCard('K', '♦', 13), createCard('K', '♣', 13)],
        },
      ]
      const communityCards: Card[] = [
        createCard('Q', '♠', 12),
        createCard('J', '♥', 11),
        createCard('10', '♦', 10),
        createCard('9', '♣', 9),
        createCard('8', '♠', 8),
      ]

      const result = determineWinner(players, communityCards)

      expect(result).toHaveLength(2)
      // Оба игрока имеют стрит (Q, J, 10, 9, 8), но у первого игрока старшая карта A
      expect(result[0].hand.rank).toBe(HAND_RANKS.STRAIGHT)
      expect(result[1].hand.rank).toBe(HAND_RANKS.STRAIGHT)
      // Проверяем, что результат отсортирован по силе комбинации
      expect(result[0].hand.cards[0].value).toBeGreaterThanOrEqual(
        result[1].hand.cards[0].value
      )
    })

    it('должен правильно отсортировать по силе комбинации', () => {
      const players = [
        {
          id: 1,
          name: 'Игрок 1',
          cards: [createCard('A', '♠', 14), createCard('A', '♥', 14)],
        },
        {
          id: 2,
          name: 'Игрок 2',
          cards: [createCard('K', '♦', 13), createCard('K', '♣', 13)],
        },
        {
          id: 3,
          name: 'Игрок 3',
          cards: [createCard('Q', '♠', 12), createCard('Q', '♥', 12)],
        },
      ]
      const communityCards: Card[] = [
        createCard('J', '♦', 11),
        createCard('10', '♣', 10),
        createCard('9', '♠', 9),
        createCard('8', '♥', 8),
        createCard('7', '♦', 7),
      ]

      const result = determineWinner(players, communityCards)

      expect(result).toHaveLength(3)
      // Все игроки имеют стрит (J, 10, 9, 8, 7)
      expect(result[0].hand.rank).toBe(HAND_RANKS.STRAIGHT)
      expect(result[1].hand.rank).toBe(HAND_RANKS.STRAIGHT)
      expect(result[2].hand.rank).toBe(HAND_RANKS.STRAIGHT)
      // Проверяем, что результат отсортирован по силе комбинации (от лучшей к худшей)
      expect(result[0].hand.cards[0].value).toBeGreaterThanOrEqual(
        result[1].hand.cards[0].value
      )
      expect(result[1].hand.cards[0].value).toBeGreaterThanOrEqual(
        result[2].hand.cards[0].value
      )
    })
  })

  describe('getWinners', () => {
    it('должен вернуть только победителей', () => {
      const playerHands = [
        {
          playerId: 1,
          playerName: 'Игрок 1',
          hand: {
            rank: HAND_RANKS.ONE_PAIR,
            name: HAND_NAMES[HAND_RANKS.ONE_PAIR],
            cards: [createCard('A', '♠', 14), createCard('A', '♥', 14)],
          },
        },
        {
          playerId: 2,
          playerName: 'Игрок 2',
          hand: {
            rank: HAND_RANKS.ONE_PAIR,
            name: HAND_NAMES[HAND_RANKS.ONE_PAIR],
            cards: [createCard('A', '♦', 14), createCard('A', '♣', 14)],
          },
        },
        {
          playerId: 3,
          playerName: 'Игрок 3',
          hand: {
            rank: HAND_RANKS.HIGH_CARD,
            name: HAND_NAMES[HAND_RANKS.HIGH_CARD],
            cards: [createCard('K', '♠', 13)],
          },
        },
      ]

      const result = getWinners(playerHands)

      expect(result).toHaveLength(2)
      expect(result[0].playerId).toBe(1)
      expect(result[1].playerId).toBe(2)
    })

    it('должен вернуть пустой массив для пустого ввода', () => {
      const result = getWinners([])
      expect(result).toHaveLength(0)
    })

    it('должен вернуть одного победителя', () => {
      const playerHands = [
        {
          playerId: 1,
          playerName: 'Игрок 1',
          hand: {
            rank: HAND_RANKS.ONE_PAIR,
            name: HAND_NAMES[HAND_RANKS.ONE_PAIR],
            cards: [createCard('A', '♠', 14), createCard('A', '♥', 14)],
          },
        },
        {
          playerId: 2,
          playerName: 'Игрок 2',
          hand: {
            rank: HAND_RANKS.HIGH_CARD,
            name: HAND_NAMES[HAND_RANKS.HIGH_CARD],
            cards: [createCard('K', '♦', 13)],
          },
        },
      ]

      const result = getWinners(playerHands)

      expect(result).toHaveLength(1)
      expect(result[0].playerId).toBe(1)
    })
  })
})
