import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  determineWinner as evaluateWinner,
  getWinners,
  type PlayerHand,
} from '../utils/pokerHands'
import {
  calculateQuickEquity,
  calculateFullEquity,
  type PlayerEquity,
} from '../utils/equityCalculator'

export interface Card {
  rank: string
  suit: string
  value: number
}

export interface Player {
  id: number
  name: string
  cards: (Card | null)[]
  isActive: boolean
}

export interface GameState {
  currentRound: 'Префлоп' | 'Флоп' | 'Терн' | 'Ривер' | 'Игра завершена'
  communityCards: (Card | null)[]
  deck: Card[]
  remainingCards: number
  isDealing: boolean
  players: Player[]
  playerHands: PlayerHand[]
  winners: PlayerHand[]
  showResults: boolean
  playerEquity: PlayerEquity[]
  isCalculatingEquity: boolean
  lastEquityCalculation: number
}

export const usePokerStore = defineStore('poker', () => {
  // Состояние игры
  const gameState = ref<GameState>({
    currentRound: 'Префлоп',
    communityCards: [null, null, null, null, null],
    deck: [],
    remainingCards: 52,
    isDealing: false,
    players: [
      { id: 1, name: 'Игрок 1', cards: [null, null], isActive: true },
      { id: 2, name: 'Игрок 2', cards: [null, null], isActive: true },
      { id: 3, name: 'Игрок 3', cards: [null, null], isActive: true },
      { id: 4, name: 'Игрок 4', cards: [null, null], isActive: true },
    ],
    playerHands: [],
    winners: [],
    showResults: false,
    playerEquity: [],
    isCalculatingEquity: false,
    lastEquityCalculation: 0,
  })

  // Создание колоды
  const createDeck = (): Card[] => {
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
    const deck: Card[] = []

    for (const suit of suits) {
      for (let i = 0; i < ranks.length; i++) {
        deck.push({
          rank: ranks[i],
          suit,
          value: i + 2,
        })
      }
    }

    return shuffleDeck(deck)
  }

  // Перемешивание колоды
  const shuffleDeck = (deck: Card[]): Card[] => {
    const shuffled = [...deck]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Обновление количества карт в колоде
  const updateRemainingCards = () => {
    const activePlayers = gameState.value.players.filter(
      player => player.isActive
    )
    gameState.value.remainingCards = 52 - activePlayers.length * 2
  }

  // Начало новой игры
  const startNewGame = () => {
    gameState.value.deck = createDeck()
    gameState.value.currentRound = 'Префлоп'
    gameState.value.isDealing = false
    gameState.value.showResults = false
    gameState.value.playerHands = []
    gameState.value.winners = []

    // Очищаем карты игроков
    gameState.value.players.forEach(player => {
      player.cards = [null, null]
      player.isActive = true
    })

    // Очищаем общие карты
    gameState.value.communityCards = [null, null, null, null, null]

    // Обновляем количество карт в колоде
    updateRemainingCards()
  }

  // Раздача карт
  const dealCards = async () => {
    if (gameState.value.isDealing || gameState.value.remainingCards === 0)
      return

    gameState.value.isDealing = true

    switch (gameState.value.currentRound) {
      case 'Префлоп':
        // Раздаем по 2 карты каждому активному игроку
        for (let i = 0; i < 2; i++) {
          for (const player of gameState.value.players) {
            if (player.isActive && gameState.value.deck.length > 0) {
              player.cards[i] = gameState.value.deck.pop()!
              gameState.value.remainingCards--
              await new Promise(resolve => setTimeout(resolve, 200))
            }
          }
        }
        gameState.value.currentRound = 'Флоп'
        // Обновляем equity после раздачи карт игрокам
        await updateEquity()
        break

      case 'Флоп':
        // Раздаем 3 общие карты
        for (let i = 0; i < 3; i++) {
          if (gameState.value.deck.length > 0) {
            gameState.value.communityCards[i] = gameState.value.deck.pop()!
            gameState.value.remainingCards--
            await new Promise(resolve => setTimeout(resolve, 300))
          }
        }
        gameState.value.currentRound = 'Терн'
        // Обновляем equity после флопа
        await updateEquity()
        break

      case 'Терн':
        // Раздаем 4-ю общую карту
        if (gameState.value.deck.length > 0) {
          gameState.value.communityCards[3] = gameState.value.deck.pop()!
          gameState.value.remainingCards--
          gameState.value.currentRound = 'Ривер'
          // Обновляем equity после терна
          await updateEquity()
        }
        break

      case 'Ривер':
        // Раздаем 5-ю общую карту
        if (gameState.value.deck.length > 0) {
          gameState.value.communityCards[4] = gameState.value.deck.pop()!
          gameState.value.remainingCards--
          gameState.value.currentRound = 'Игра завершена'
          // Обновляем equity после ривера
          await updateEquity()
          // Определяем победителя после раздачи всех карт
          determineWinner()
        }
        break
    }

    gameState.value.isDealing = false
  }

  // Определение победителя
  const determineWinner = () => {
    const activePlayers = gameState.value.players.filter(
      player => player.isActive
    )
    const validPlayers = activePlayers.filter(player =>
      player.cards.every(card => card !== null)
    )

    if (validPlayers.length === 0) return

    const validCommunityCards = gameState.value.communityCards.filter(
      card => card !== null
    )

    if (validCommunityCards.length < 3) return

    const playersForEvaluation = validPlayers.map(player => ({
      id: player.id,
      name: player.name,
      cards: player.cards as Card[],
    }))

    const playerHands = evaluateWinner(
      playersForEvaluation,
      validCommunityCards as Card[]
    )
    const winners = getWinners(playerHands)

    gameState.value.playerHands = playerHands
    gameState.value.winners = winners
    gameState.value.showResults = true
  }

  // Проверка возможности раздачи
  const canDeal = computed(() => {
    return gameState.value.remainingCards > 0 && !gameState.value.isDealing
  })

  // Получение активных игроков
  const activePlayers = computed(() => {
    return gameState.value.players.filter(player => player.isActive)
  })

  // Получение видимых общих карт
  const visibleCommunityCards = computed(() => {
    return gameState.value.communityCards.filter(card => card !== null)
  })

  // Проверка, можно ли определить победителя
  const canDetermineWinner = computed(() => {
    return (
      gameState.value.currentRound === 'Игра завершена' &&
      gameState.value.communityCards.filter(card => card !== null).length >= 3
    )
  })

  // Расчет equity для игроков
  const calculateEquity = async (useQuickCalculation: boolean = true) => {
    if (gameState.value.isCalculatingEquity) return

    const activePlayers = gameState.value.players.filter(
      player => player.isActive
    )
    const hasPlayerCards = activePlayers.some(player =>
      player.cards.some(card => card !== null)
    )

    if (!hasPlayerCards) {
      gameState.value.playerEquity = []
      return
    }

    gameState.value.isCalculatingEquity = true

    try {
      const equityResult = useQuickCalculation
        ? calculateQuickEquity(activePlayers, gameState.value.communityCards)
        : calculateFullEquity(activePlayers, gameState.value.communityCards)

      gameState.value.playerEquity = equityResult.players
      gameState.value.lastEquityCalculation = Date.now()
    } catch {
      gameState.value.playerEquity = []
    } finally {
      gameState.value.isCalculatingEquity = false
    }
  }

  // Автоматический расчет equity при изменении карт
  const updateEquity = async () => {
    // Проверяем, прошло ли достаточно времени с последнего расчета
    const timeSinceLastCalculation =
      Date.now() - gameState.value.lastEquityCalculation
    const minInterval = 1000 // Минимум 1 секунда между расчетами

    if (timeSinceLastCalculation < minInterval) {
      return
    }

    await calculateEquity(true) // Используем быстрый расчет для UI
  }

  // Получение equity для конкретного игрока
  const getPlayerEquity = (playerId: number): PlayerEquity | undefined => {
    return gameState.value.playerEquity.find(
      equity => equity.playerId === playerId
    )
  }

  // Проверка, нужно ли обновить equity
  const shouldUpdateEquity = computed(() => {
    const activePlayers = gameState.value.players.filter(
      player => player.isActive
    )
    const hasPlayerCards = activePlayers.some(player =>
      player.cards.some(card => card !== null)
    )
    const hasCommunityCards = gameState.value.communityCards.some(
      card => card !== null
    )

    return (
      hasPlayerCards &&
      (hasCommunityCards || gameState.value.currentRound !== 'Префлоп')
    )
  })

  return {
    gameState,
    startNewGame,
    dealCards,
    determineWinner,
    canDeal,
    activePlayers,
    visibleCommunityCards,
    canDetermineWinner,
    calculateEquity,
    updateEquity,
    getPlayerEquity,
    shouldUpdateEquity,
  }
})
