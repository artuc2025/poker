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

// Интерфейсы для метрик
export interface PlayerMetrics {
  playerId: number
  playerName: string
  gamesPlayed: number
  wins: number
  winRate: number
  averageEquity: number
  totalEquity: number
  bestHand: string
  bestHandCount: number
  currentEquity: number
  equityHistory: number[]
  lastUpdated: number
}

export interface GameStats {
  totalGames: number
  totalDeals: number
  averageRoundDuration: number
  currentGameStartTime: number
  currentRoundStartTime: number
  mostFrequentHand: string
  mostFrequentHandCount: number
  averagePlayersPerGame: number
  totalEquityCalculations: number
}

export interface HandStats {
  handFrequency: Record<string, number>
  totalHands: number
  winningHands: Record<string, number>
  averageHandStrength: number
  handHistory: Array<{
    hand: string
    playerId: number
    gameId: number
    timestamp: number
  }>
}

export interface EquityTrends {
  currentTrends: Array<{
    playerId: number
    trend: 'up' | 'down' | 'stable'
    change: number
  }>
  equityHistory: Array<{
    timestamp: number
    playerEquities: Array<{
      playerId: number
      equity: number
    }>
  }>
  averageEquityByRound: Record<string, number>
}

export interface GameMetrics {
  players: PlayerMetrics[]
  game: GameStats
  hands: HandStats
  equity: EquityTrends
  lastUpdated: number
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
  metrics: GameMetrics
  currentGameId: number
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
    metrics: {
      players: [],
      game: {
        totalGames: 0,
        totalDeals: 0,
        averageRoundDuration: 0,
        currentGameStartTime: 0,
        currentRoundStartTime: 0,
        mostFrequentHand: '',
        mostFrequentHandCount: 0,
        averagePlayersPerGame: 0,
        totalEquityCalculations: 0,
      },
      hands: {
        handFrequency: {},
        totalHands: 0,
        winningHands: {},
        averageHandStrength: 0,
        handHistory: [],
      },
      equity: {
        currentTrends: [],
        equityHistory: [],
        averageEquityByRound: {},
      },
      lastUpdated: 0,
    },
    currentGameId: 0,
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
    gameState.value.metrics.game.totalGames++
    gameState.value.metrics.game.currentGameStartTime = Date.now()
    gameState.value.metrics.game.currentRoundStartTime = Date.now()
    gameState.value.metrics.game.totalEquityCalculations++

    // Очищаем карты игроков
    gameState.value.players.forEach(player => {
      player.cards = [null, null]
      player.isActive = true
    })

    // Очищаем общие карты
    gameState.value.communityCards = [null, null, null, null, null]

    // Обновляем количество карт в колоде
    updateRemainingCards()

    // Обновляем метрики
    gameState.value.currentGameId++
    updateMetrics()
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
        gameState.value.metrics.game.currentRoundStartTime = Date.now()
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
        gameState.value.metrics.game.currentRoundStartTime = Date.now()
        // Обновляем equity после флопа
        await updateEquity()
        break

      case 'Терн':
        // Раздаем 4-ю общую карту
        if (gameState.value.deck.length > 0) {
          gameState.value.communityCards[3] = gameState.value.deck.pop()!
          gameState.value.remainingCards--
          gameState.value.currentRound = 'Ривер'
          gameState.value.metrics.game.currentRoundStartTime = Date.now()
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
          gameState.value.metrics.game.currentRoundStartTime = Date.now()
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

    // Обновляем метрики победителя
    if (winners && winners.length > 0) {
      winners.forEach(winner => {
        const player = gameState.value.players.find(
          p => p.id === winner.playerId
        )
        if (player) {
          const playerMetrics = gameState.value.metrics.players.find(
            p => p.playerId === player.id
          )
          if (playerMetrics) {
            playerMetrics.wins++
            playerMetrics.winRate =
              (playerMetrics.wins / playerMetrics.gamesPlayed) * 100
            playerMetrics.equityHistory.push(playerMetrics.currentEquity)
            playerMetrics.currentEquity = 0 // Сбрасываем текущую эквити после определения победителя
          }
        }
      })
    }

    // Обновляем все метрики
    updateMetrics()
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
      gameState.value.metrics.game.totalEquityCalculations++
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

    // Обновляем метрики после расчета equity
    updateMetrics()
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

  // Методы для работы с метриками

  // Инициализация метрик игрока
  const initializePlayerMetrics = (player: Player) => {
    const existingMetrics = gameState.value.metrics.players.find(
      p => p.playerId === player.id
    )

    if (!existingMetrics) {
      gameState.value.metrics.players.push({
        playerId: player.id,
        playerName: player.name,
        gamesPlayed: 0,
        wins: 0,
        winRate: 0,
        averageEquity: 0,
        totalEquity: 0,
        bestHand: '',
        bestHandCount: 0,
        currentEquity: 0,
        equityHistory: [],
        lastUpdated: Date.now(),
      })
    }
  }

  // Обновление метрик игрока
  const updatePlayerMetrics = (playerId: number) => {
    const playerMetrics = gameState.value.metrics.players.find(
      p => p.playerId === playerId
    )

    if (playerMetrics) {
      const playerEquity = getPlayerEquity(playerId)
      if (playerEquity) {
        playerMetrics.currentEquity = playerEquity.equity
        playerMetrics.totalEquity += playerEquity.equity

        // Обновляем среднюю equity
        const equityCount = playerMetrics.equityHistory.length + 1
        playerMetrics.averageEquity = playerMetrics.totalEquity / equityCount
      }

      // Увеличиваем количество игр при начале новой игры
      if (
        gameState.value.currentRound === 'Префлоп' &&
        gameState.value.players
          .find(p => p.id === playerId)
          ?.cards.every(card => card === null)
      ) {
        playerMetrics.gamesPlayed++
        playerMetrics.winRate =
          playerMetrics.gamesPlayed > 0
            ? (playerMetrics.wins / playerMetrics.gamesPlayed) * 100
            : 0
      }

      playerMetrics.lastUpdated = Date.now()
    }
  }

  // Обновление статистики игры
  const updateGameStats = () => {
    const stats = gameState.value.metrics.game

    // Обновляем количество раздач
    if (gameState.value.currentRound !== 'Префлоп') {
      stats.totalDeals++
    }

    // Обновляем среднюю продолжительность раунда
    const currentTime = Date.now()
    const roundDuration = currentTime - stats.currentRoundStartTime
    if (roundDuration > 0) {
      const totalRounds = stats.totalGames * 4 // 4 раунда на игру
      stats.averageRoundDuration =
        (stats.averageRoundDuration * (totalRounds - 1) + roundDuration) /
        totalRounds
    }

    // Обновляем среднее количество игроков
    const activePlayersCount = gameState.value.players.filter(
      p => p.isActive
    ).length
    stats.averagePlayersPerGame =
      (stats.averagePlayersPerGame * (stats.totalGames - 1) +
        activePlayersCount) /
      stats.totalGames
  }

  // Обновление статистики комбинаций
  const updateHandStats = () => {
    if (!gameState.value.showResults) return

    const hands = gameState.value.metrics.hands

    if (gameState.value.playerHands && gameState.value.playerHands.length > 0) {
      gameState.value.playerHands.forEach(playerHand => {
        const handName = playerHand.hand.name

        // Обновляем частоту комбинаций
        hands.handFrequency[handName] = (hands.handFrequency[handName] || 0) + 1
        hands.totalHands++

        // Обновляем выигрышные комбинации
        const isWinner = gameState.value.winners?.some(
          w => w.playerId === playerHand.playerId
        )
        if (isWinner) {
          hands.winningHands[handName] = (hands.winningHands[handName] || 0) + 1
        }

        // Добавляем в историю
        hands.handHistory.push({
          hand: handName,
          playerId: playerHand.playerId,
          gameId: gameState.value.currentGameId,
          timestamp: Date.now(),
        })
      })
    }

    // Обновляем самую частую комбинацию
    let maxFrequency = 0
    let mostFrequent = ''

    Object.entries(hands.handFrequency).forEach(([hand, frequency]) => {
      if (frequency > maxFrequency) {
        maxFrequency = frequency
        mostFrequent = hand
      }
    })

    gameState.value.metrics.game.mostFrequentHand = mostFrequent
    gameState.value.metrics.game.mostFrequentHandCount = maxFrequency
  }

  // Обновление трендов equity
  const updateEquityTrends = () => {
    const trends = gameState.value.metrics.equity
    const currentTime = Date.now()

    // Добавляем текущие equity в историю
    const currentEquities = gameState.value.playerEquity.map(equity => ({
      playerId: equity.playerId,
      equity: equity.equity,
    }))

    trends.equityHistory.push({
      timestamp: currentTime,
      playerEquities: currentEquities,
    })

    // Ограничиваем историю последними 50 записями
    if (trends.equityHistory.length > 50) {
      trends.equityHistory = trends.equityHistory.slice(-50)
    }

    // Обновляем тренды
    trends.currentTrends = gameState.value.playerEquity.map(equity => {
      const history = trends.equityHistory
      if (history.length < 2) {
        return {
          playerId: equity.playerId,
          trend: 'stable' as const,
          change: 0,
        }
      }

      const current = history[history.length - 1]
      const previous = history[history.length - 2]

      const currentEquity =
        current.playerEquities.find(p => p.playerId === equity.playerId)
          ?.equity || 0
      const previousEquity =
        previous.playerEquities.find(p => p.playerId === equity.playerId)
          ?.equity || 0

      const change = currentEquity - previousEquity
      let trend: 'up' | 'down' | 'stable' = 'stable'

      if (change > 0.01) trend = 'up'
      else if (change < -0.01) trend = 'down'

      return {
        playerId: equity.playerId,
        trend,
        change,
      }
    })

    // Обновляем среднюю equity по раундам
    const round = gameState.value.currentRound
    const averageEquity =
      gameState.value.playerEquity.reduce(
        (sum, equity) => sum + equity.equity,
        0
      ) / gameState.value.playerEquity.length
    trends.averageEquityByRound[round] = averageEquity
  }

  // Полное обновление метрик
  const updateMetrics = () => {
    // Инициализируем метрики для новых игроков
    gameState.value.players.forEach(player => {
      if (player.isActive) {
        initializePlayerMetrics(player)
      }
    })

    // Обновляем метрики игроков
    gameState.value.players.forEach(player => {
      if (player.isActive) {
        updatePlayerMetrics(player.id)
      }
    })

    // Обновляем статистику игры
    updateGameStats()

    // Обновляем статистику комбинаций
    updateHandStats()

    // Обновляем тренды equity
    updateEquityTrends()

    // Обновляем время последнего обновления
    gameState.value.metrics.lastUpdated = Date.now()
  }

  // Сброс метрик
  const resetMetrics = () => {
    gameState.value.metrics = {
      players: [],
      game: {
        totalGames: 0,
        totalDeals: 0,
        averageRoundDuration: 0,
        currentGameStartTime: 0,
        currentRoundStartTime: 0,
        mostFrequentHand: '',
        mostFrequentHandCount: 0,
        averagePlayersPerGame: 0,
        totalEquityCalculations: 0,
      },
      hands: {
        handFrequency: {},
        totalHands: 0,
        winningHands: {},
        averageHandStrength: 0,
        handHistory: [],
      },
      equity: {
        currentTrends: [],
        equityHistory: [],
        averageEquityByRound: {},
      },
      lastUpdated: 0,
    }
  }

  // Получение метрик игрока
  const getPlayerMetrics = (playerId: number): PlayerMetrics | undefined => {
    return gameState.value.metrics.players.find(p => p.playerId === playerId)
  }

  // Мемоизированное получение всех метрик
  const getAllMetrics = computed((): GameMetrics => {
    return gameState.value.metrics
  })

  // Мемоизированное получение метрик игрока
  const getPlayerMetricsComputed = computed(() => {
    return (playerId: number): PlayerMetrics | undefined => {
      return gameState.value.metrics.players.find(p => p.playerId === playerId)
    }
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
    // Методы для метрик
    updateMetrics,
    resetMetrics,
    getPlayerMetrics,
    getAllMetrics: getAllMetrics.value,
    getPlayerMetricsComputed: getPlayerMetricsComputed.value,
  }
})
