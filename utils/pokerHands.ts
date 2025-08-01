import type { Card } from '~/stores/poker'

export interface PokerHand {
  rank: number
  name: string
  cards: Card[]
  highCard?: Card
}

export interface PlayerHand {
  playerId: number
  playerName: string
  hand: PokerHand
}

// Ранги комбинаций (от лучшей к худшей)
export const HAND_RANKS = {
  ROYAL_FLUSH: 10,
  STRAIGHT_FLUSH: 9,
  FOUR_OF_A_KIND: 8,
  FULL_HOUSE: 7,
  FLUSH: 6,
  STRAIGHT: 5,
  THREE_OF_A_KIND: 4,
  TWO_PAIR: 3,
  ONE_PAIR: 2,
  HIGH_CARD: 1,
} as const

// Названия комбинаций
export const HAND_NAMES = {
  [HAND_RANKS.ROYAL_FLUSH]: 'Роял-флеш',
  [HAND_RANKS.STRAIGHT_FLUSH]: 'Стрит-флеш',
  [HAND_RANKS.FOUR_OF_A_KIND]: 'Каре',
  [HAND_RANKS.FULL_HOUSE]: 'Фулл-хаус',
  [HAND_RANKS.FLUSH]: 'Флеш',
  [HAND_RANKS.STRAIGHT]: 'Стрит',
  [HAND_RANKS.THREE_OF_A_KIND]: 'Тройка',
  [HAND_RANKS.TWO_PAIR]: 'Две пары',
  [HAND_RANKS.ONE_PAIR]: 'Пара',
  [HAND_RANKS.HIGH_CARD]: 'Старшая карта',
} as const

// Получение всех карт игрока (личные + общие)
export const getPlayerAllCards = (
  playerCards: Card[],
  communityCards: Card[]
): Card[] => {
  return [...playerCards, ...communityCards.filter(card => card !== null)]
}

// Подсчет количества карт каждого достоинства
export const getCardCounts = (cards: Card[]): Record<string, number> => {
  const counts: Record<string, number> = {}
  cards.forEach(card => {
    counts[card.rank] = (counts[card.rank] || 0) + 1
  })
  return counts
}

// Проверка на флеш (5 карт одной масти)
export const isFlush = (cards: Card[]): boolean => {
  const suits = cards.map(card => card.suit)
  return suits.some(suit => suits.filter(s => s === suit).length >= 5)
}

// Проверка на стритт (5 карт по порядку)
export const isStraight = (cards: Card[]): boolean => {
  const values = cards.map(card => card.value).sort((a, b) => a - b)
  const uniqueValues = [...new Set(values)]

  for (let i = 0; i <= uniqueValues.length - 5; i++) {
    if (uniqueValues[i + 4] - uniqueValues[i] === 4) {
      return true
    }
  }

  // Проверка на стритт с тузом внизу (A, 2, 3, 4, 5)
  if (values.includes(14)) {
    // Туз
    const lowAceValues = values.filter(v => v !== 14).concat([1])
    const uniqueLowValues = [...new Set(lowAceValues)].sort((a, b) => a - b)
    for (let i = 0; i <= uniqueLowValues.length - 4; i++) {
      if (
        uniqueLowValues[i + 3] - uniqueLowValues[i] === 3 &&
        uniqueLowValues[i] === 1
      ) {
        return true
      }
    }
  }

  return false
}

// Получение лучших 5 карт для комбинации
export const getBestFiveCards = (cards: Card[]): Card[] => {
  const sortedCards = [...cards].sort((a, b) => b.value - a.value)
  return sortedCards.slice(0, 5)
}

// Получение карт для стрита
export const getStraightCards = (cards: Card[]): Card[] => {
  const values = cards.map(card => card.value).sort((a, b) => b - a)
  const uniqueValues = [...new Set(values)]

  // Ищем обычный стрит
  for (let i = 0; i <= uniqueValues.length - 5; i++) {
    if (uniqueValues[i] - uniqueValues[i + 4] === 4) {
      const straightValues = uniqueValues.slice(i, i + 5)
      return straightValues
        .map(value => cards.find(card => card.value === value)!)
        .sort((a, b) => b.value - a.value)
    }
  }

  // Проверяем стрит с тузом внизу (A, 2, 3, 4, 5)
  if (values.includes(14)) {
    // Туз
    const lowAceValues = values.filter(v => v !== 14).concat([1])
    const uniqueLowValues = [...new Set(lowAceValues)].sort((a, b) => b - a)
    for (let i = 0; i <= uniqueLowValues.length - 4; i++) {
      if (
        uniqueLowValues[i] - uniqueLowValues[i + 3] === 3 &&
        uniqueLowValues[i] === 5
      ) {
        const straightValues = [14, 2, 3, 4, 5] // A, 2, 3, 4, 5
        return straightValues
          .map(value => cards.find(card => card.value === value)!)
          .sort((a, b) => b.value - a.value)
      }
    }
  }

  // Если стрит не найден, возвращаем лучшие 5 карт
  return getBestFiveCards(cards)
}

// Определение комбинации карт
export const evaluateHand = (cards: Card[]): PokerHand => {
  if (cards.length < 5) {
    return {
      rank: HAND_RANKS.HIGH_CARD,
      name: HAND_NAMES[HAND_RANKS.HIGH_CARD],
      cards: cards.slice(0, 5),
      highCard: cards[0],
    }
  }

  const cardCounts = getCardCounts(cards)
  const counts = Object.values(cardCounts).sort((a, b) => b - a)
  const sortedCards = [...cards].sort((a, b) => b.value - a.value)

  // Роял-флеш
  if (isFlush(cards) && isStraight(cards) && sortedCards[0].value === 14) {
    return {
      rank: HAND_RANKS.ROYAL_FLUSH,
      name: HAND_NAMES[HAND_RANKS.ROYAL_FLUSH],
      cards: getStraightCards(cards),
    }
  }

  // Стритт-флеш
  if (isFlush(cards) && isStraight(cards)) {
    return {
      rank: HAND_RANKS.STRAIGHT_FLUSH,
      name: HAND_NAMES[HAND_RANKS.STRAIGHT_FLUSH],
      cards: getStraightCards(cards),
    }
  }

  // Каре
  if (counts[0] === 4) {
    const fourRank = Object.keys(cardCounts).find(
      rank => cardCounts[rank] === 4
    )!
    const fourCards = cards.filter(card => card.rank === fourRank)
    const kicker = cards.find(card => card.rank !== fourRank)!
    return {
      rank: HAND_RANKS.FOUR_OF_A_KIND,
      name: HAND_NAMES[HAND_RANKS.FOUR_OF_A_KIND],
      cards: [...fourCards, kicker],
    }
  }

  // Фулл-хаус
  if (counts[0] === 3 && counts[1] === 2) {
    const threeRank = Object.keys(cardCounts).find(
      rank => cardCounts[rank] === 3
    )!
    const twoRank = Object.keys(cardCounts).find(
      rank => cardCounts[rank] === 2
    )!
    const threeCards = cards.filter(card => card.rank === threeRank)
    const twoCards = cards.filter(card => card.rank === twoRank)
    return {
      rank: HAND_RANKS.FULL_HOUSE,
      name: HAND_NAMES[HAND_RANKS.FULL_HOUSE],
      cards: [...threeCards, ...twoCards.slice(0, 2)],
    }
  }

  // Флеш
  if (isFlush(cards)) {
    const suits = cards.map(card => card.suit)
    const flushSuit = suits.find(
      suit => suits.filter(s => s === suit).length >= 5
    )!
    const flushCards = cards.filter(card => card.suit === flushSuit).slice(0, 5)
    return {
      rank: HAND_RANKS.FLUSH,
      name: HAND_NAMES[HAND_RANKS.FLUSH],
      cards: flushCards,
    }
  }

  // Стритт
  if (isStraight(cards)) {
    return {
      rank: HAND_RANKS.STRAIGHT,
      name: HAND_NAMES[HAND_RANKS.STRAIGHT],
      cards: getStraightCards(cards),
    }
  }

  // Тройка
  if (counts[0] === 3) {
    const threeRank = Object.keys(cardCounts).find(
      rank => cardCounts[rank] === 3
    )!
    const threeCards = cards.filter(card => card.rank === threeRank)
    const kickers = cards.filter(card => card.rank !== threeRank).slice(0, 2)
    return {
      rank: HAND_RANKS.THREE_OF_A_KIND,
      name: HAND_NAMES[HAND_RANKS.THREE_OF_A_KIND],
      cards: [...threeCards, ...kickers],
    }
  }

  // Две пары
  if (counts[0] === 2 && counts[1] === 2) {
    const pairRanks = Object.keys(cardCounts).filter(
      rank => cardCounts[rank] === 2
    )
    const firstPair = cards.filter(card => card.rank === pairRanks[0])
    const secondPair = cards.filter(card => card.rank === pairRanks[1])
    const kicker = cards.find(card => !pairRanks.includes(card.rank))!
    return {
      rank: HAND_RANKS.TWO_PAIR,
      name: HAND_NAMES[HAND_RANKS.TWO_PAIR],
      cards: [...firstPair, ...secondPair, kicker],
    }
  }

  // Пара
  if (counts[0] === 2) {
    const pairRank = Object.keys(cardCounts).find(
      rank => cardCounts[rank] === 2
    )!
    const pairCards = cards.filter(card => card.rank === pairRank)
    const kickers = cards.filter(card => card.rank !== pairRank).slice(0, 3)
    return {
      rank: HAND_RANKS.ONE_PAIR,
      name: HAND_NAMES[HAND_RANKS.ONE_PAIR],
      cards: [...pairCards, ...kickers],
    }
  }

  // Старшая карта
  return {
    rank: HAND_RANKS.HIGH_CARD,
    name: HAND_NAMES[HAND_RANKS.HIGH_CARD],
    cards: sortedCards.slice(0, 5),
    highCard: sortedCards[0],
  }
}

// Определение победителя
export const determineWinner = (
  players: Array<{ id: number; name: string; cards: Card[] }>,
  communityCards: Card[]
): PlayerHand[] => {
  const playerHands: PlayerHand[] = players.map(player => {
    const allCards = getPlayerAllCards(player.cards, communityCards)
    const hand = evaluateHand(allCards)
    return {
      playerId: player.id,
      playerName: player.name,
      hand,
    }
  })

  // Сортируем по силе комбинации (от лучшей к худшей)
  playerHands.sort((a, b) => {
    if (a.hand.rank !== b.hand.rank) {
      return b.hand.rank - a.hand.rank
    }

    // При одинаковых комбинациях сравниваем по старшей карте
    const aHighCard = a.hand.cards[0]?.value || 0
    const bHighCard = b.hand.cards[0]?.value || 0
    return bHighCard - aHighCard
  })

  // Возвращаем всех игроков с их комбинациями (для отображения)
  return playerHands
}

// Получение только победителей (могут быть несколько при ничьей)
export const getWinners = (playerHands: PlayerHand[]): PlayerHand[] => {
  if (playerHands.length === 0) return []

  const bestHand = playerHands[0]
  return playerHands.filter(
    player =>
      player.hand.rank === bestHand.hand.rank &&
      player.hand.cards[0]?.value === bestHand.hand.cards[0]?.value
  )
}
