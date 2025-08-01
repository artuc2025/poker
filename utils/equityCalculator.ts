import type { Card } from '~/stores/poker'
import { determineWinner } from './pokerHands'

export interface PlayerEquity {
  playerId: number
  playerName: string
  equity: number // Процент шансов на выигрыш (0-100)
  winCount: number
  totalSimulations: number
}

export interface EquityResult {
  players: PlayerEquity[]
  totalSimulations: number
  calculationTime: number
}

// Получение всех известных карт (личные карты игроков + общие карты)
export const getKnownCards = (
  players: Array<{ id: number; name: string; cards: (Card | null)[] }>,
  communityCards: (Card | null)[]
): Card[] => {
  const knownCards: Card[] = []

  // Добавляем личные карты игроков
  players.forEach(player => {
    player.cards.forEach(card => {
      if (card !== null) {
        knownCards.push(card)
      }
    })
  })

  // Добавляем общие карты
  communityCards.forEach(card => {
    if (card !== null) {
      knownCards.push(card)
    }
  })

  return knownCards
}

// Создание колоды без известных карт
export const createRemainingDeck = (knownCards: Card[]): Card[] => {
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
  const remainingDeck: Card[] = []

  for (const suit of suits) {
    for (let i = 0; i < ranks.length; i++) {
      const card: Card = {
        rank: ranks[i],
        suit,
        value: i + 2,
      }

      // Проверяем, есть ли эта карта в известных картах
      const isKnown = knownCards.some(
        knownCard =>
          knownCard.rank === card.rank && knownCard.suit === card.suit
      )

      if (!isKnown) {
        remainingDeck.push(card)
      }
    }
  }

  return remainingDeck
}

// Перемешивание массива карт
export const shuffleCards = (cards: Card[]): Card[] => {
  const shuffled = [...cards]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Получение случайных карт из колоды
export const getRandomCards = (deck: Card[], count: number): Card[] => {
  const shuffled = shuffleCards(deck)
  return shuffled.slice(0, count)
}

// Симуляция одной игры для расчета equity
export const simulateGame = (
  players: Array<{ id: number; name: string; cards: (Card | null)[] }>,
  communityCards: (Card | null)[],
  remainingDeck: Card[]
): number => {
  // Определяем, сколько карт нужно добавить к общим картам
  const currentCommunityCount = communityCards.filter(
    card => card !== null
  ).length
  const neededCommunityCards = 5 - currentCommunityCount

  // Получаем случайные карты для завершения общих карт
  const additionalCommunityCards = getRandomCards(
    remainingDeck,
    neededCommunityCards
  )

  // Создаем полные общие карты
  const fullCommunityCards = [...communityCards]
  let cardIndex = 0
  for (let i = 0; i < fullCommunityCards.length; i++) {
    if (
      fullCommunityCards[i] === null &&
      cardIndex < additionalCommunityCards.length
    ) {
      fullCommunityCards[i] = additionalCommunityCards[cardIndex]
      cardIndex++
    }
  }

  // Создаем полные карты для игроков (добавляем недостающие карты)
  const playersWithFullCards = players.map(player => {
    const fullCards = [...player.cards]
    const missingCards = fullCards.filter(card => card === null).length

    if (missingCards > 0) {
      // Получаем случайные карты для игрока
      const availableCards = remainingDeck.filter(
        card =>
          !additionalCommunityCards.some(
            commCard =>
              commCard.rank === card.rank && commCard.suit === card.suit
          )
      )
      const playerAdditionalCards = getRandomCards(availableCards, missingCards)

      // Заполняем недостающие карты
      let playerCardIndex = 0
      for (let i = 0; i < fullCards.length; i++) {
        if (
          fullCards[i] === null &&
          playerCardIndex < playerAdditionalCards.length
        ) {
          fullCards[i] = playerAdditionalCards[playerCardIndex]
          playerCardIndex++
        }
      }
    }

    return {
      id: player.id,
      name: player.name,
      cards: fullCards as Card[],
    }
  })

  // Оцениваем руки всех игроков
  const playerHands = determineWinner(
    playersWithFullCards,
    fullCommunityCards.filter(card => card !== null) as Card[]
  )

  // Определяем победителя
  if (playerHands.length === 0) return -1

  const bestHand = playerHands[0]
  const winners = playerHands.filter(
    player =>
      player.hand.rank === bestHand.hand.rank &&
      player.hand.cards[0]?.value === bestHand.hand.cards[0]?.value
  )

  // Возвращаем ID победителя (если несколько победителей, возвращаем первого)
  return winners[0]?.playerId || -1
}

// Основная функция расчета equity
export const calculateEquity = (
  players: Array<{ id: number; name: string; cards: (Card | null)[] }>,
  communityCards: (Card | null)[],
  simulations: number = 10000
): EquityResult => {
  const startTime = performance.now()

  // Получаем известные карты
  const knownCards = getKnownCards(players, communityCards)

  // Создаем колоду оставшихся карт
  const remainingDeck = createRemainingDeck(knownCards)

  // Проверяем, есть ли активные игроки
  const activePlayers = players.filter(player =>
    player.cards.some(card => card !== null)
  )

  if (activePlayers.length === 0) {
    return {
      players: [],
      totalSimulations: 0,
      calculationTime: 0,
    }
  }

  // Счетчики побед для каждого игрока
  const winCounts = new Map<number, number>()
  activePlayers.forEach(player => {
    winCounts.set(player.id, 0)
  })

  // Проводим симуляции
  for (let i = 0; i < simulations; i++) {
    const winnerId = simulateGame(players, communityCards, remainingDeck)
    if (winnerId !== -1) {
      winCounts.set(winnerId, (winCounts.get(winnerId) || 0) + 1)
    }
  }

  // Рассчитываем equity для каждого игрока
  const playerEquity: PlayerEquity[] = activePlayers.map(player => {
    const wins = winCounts.get(player.id) || 0
    const equity = (wins / simulations) * 100

    return {
      playerId: player.id,
      playerName: player.name,
      equity: Math.round(equity * 100) / 100, // Округляем до 2 знаков
      winCount: wins,
      totalSimulations: simulations,
    }
  })

  const calculationTime = performance.now() - startTime

  return {
    players: playerEquity,
    totalSimulations: simulations,
    calculationTime,
  }
}

// Быстрый расчет equity для UI (меньше симуляций)
export const calculateQuickEquity = (
  players: Array<{ id: number; name: string; cards: (Card | null)[] }>,
  communityCards: (Card | null)[]
): EquityResult => {
  return calculateEquity(players, communityCards, 1000)
}

// Полный расчет equity для точных результатов
export const calculateFullEquity = (
  players: Array<{ id: number; name: string; cards: (Card | null)[] }>,
  communityCards: (Card | null)[]
): EquityResult => {
  return calculateEquity(players, communityCards, 10000)
}
