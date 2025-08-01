import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PlayerManager from '~/components/PlayerManager.vue'
import GameResults from '~/components/GameResults.vue'
import PokerCard from '~/components/PokerCard.vue'
import { usePokerStore } from '~/stores/poker'
import type { PlayerHand } from '~/utils/pokerHands'

describe('Full Game Flow Integration Tests', () => {
  let pinia: any
  let pokerStore: any

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    pokerStore = usePokerStore()

    // Сбрасываем состояние к начальному
    pokerStore.startNewGame()
  })

  describe('Полный игровой процесс', () => {
    it('должен корректно обрабатывать полный цикл игры', async () => {
      // 1. Настройка игроков
      const playerManagerWrapper = mount(PlayerManager, {
        global: {
          plugins: [pinia],
        },
      })

      // Проверяем начальное состояние
      expect(pokerStore.gameState.players).toHaveLength(4)
      expect(pokerStore.gameState.currentRound).toBe('Префлоп')

      // Изменяем количество игроков
      const select = playerManagerWrapper.find('.manager__select')
      await select.setValue(3)

      const applyButton = playerManagerWrapper.find('.btn--primary')
      await applyButton.trigger('click')

      // Проверяем, что количество игроков изменилось
      expect(pokerStore.gameState.players).toHaveLength(3)
      expect(pokerStore.gameState.remainingCards).toBe(46) // 52 - 3 * 2

      // 2. Симулируем раздачу карт
      pokerStore.gameState.deck = [
        { rank: 'A', suit: '♠', value: 14 },
        { rank: 'K', suit: '♥', value: 13 },
        { rank: 'Q', suit: '♦', value: 12 },
        { rank: 'J', suit: '♣', value: 11 },
        { rank: '10', suit: '♠', value: 10 },
        { rank: '9', suit: '♥', value: 9 },
      ]

      // Раздаем карты игрокам
      pokerStore.gameState.players[0].cards = [
        { rank: 'A', suit: '♠', value: 14 },
        { rank: 'K', suit: '♥', value: 13 },
      ]
      pokerStore.gameState.players[1].cards = [
        { rank: 'Q', suit: '♦', value: 12 },
        { rank: 'J', suit: '♣', value: 11 },
      ]
      pokerStore.gameState.players[2].cards = [
        { rank: '10', suit: '♠', value: 10 },
        { rank: '9', suit: '♥', value: 9 },
      ]

      // Проверяем, что карты корректно установлены
      expect(pokerStore.gameState.players[0].cards[0].rank).toBe('A')
      expect(pokerStore.gameState.players[1].cards[0].rank).toBe('Q')
      expect(pokerStore.gameState.players[2].cards[0].rank).toBe('10')

      // 3. Симулируем раздачу общих карт
      pokerStore.gameState.communityCards = [
        { rank: '8', suit: '♦', value: 8 },
        { rank: '7', suit: '♣', value: 7 },
        { rank: '6', suit: '♠', value: 6 },
        { rank: '5', suit: '♥', value: 5 },
        { rank: '4', suit: '♦', value: 4 },
      ]

      pokerStore.gameState.currentRound = 'Игра завершена'

      // 4. Симулируем определение победителя
      const mockPlayerHands: PlayerHand[] = [
        {
          playerId: 1,
          playerName: 'Игрок 1',
          hand: {
            name: 'Пара',
            rank: 2, // добавляем обязательное поле rank для PokerHand
            cards: [
              { rank: 'A', suit: '♠', value: 14 },
              { rank: 'A', suit: '♥', value: 14 },
              { rank: 'K', suit: '♦', value: 13 },
              { rank: 'Q', suit: '♣', value: 12 },
              { rank: 'J', suit: '♠', value: 11 },
            ],
          },
        },
        {
          playerId: 2,
          playerName: 'Игрок 2',
          hand: {
            name: 'Тройка',
            rank: 3, // добавляем обязательное поле rank для PokerHand
            cards: [
              { rank: 'Q', suit: '♦', value: 12 },
              { rank: 'Q', suit: '♣', value: 12 },
              { rank: 'Q', suit: '♠', value: 12 },
              { rank: 'J', suit: '♥', value: 11 },
              { rank: '10', suit: '♦', value: 10 },
            ],
          },
        },
        {
          playerId: 3,
          playerName: 'Игрок 3',
          hand: {
            name: 'Старшая карта',
            cards: [
              { rank: '10', suit: '♠', value: 10 },
              { rank: '9', suit: '♥', value: 9 },
              { rank: '8', suit: '♦', value: 8 },
              { rank: '7', suit: '♣', value: 7 },
              { rank: '6', suit: '♠', value: 6 },
            ],
            rank: 0,
          },
        },
      ]

      const mockWinners: PlayerHand[] = [
        {
          playerId: 2,
          playerName: 'Игрок 2',
          hand: {
            name: 'Тройка',
            cards: [
              { rank: 'Q', suit: '♦', value: 12 },
              { rank: 'Q', suit: '♣', value: 12 },
              { rank: 'Q', suit: '♠', value: 12 },
              { rank: 'J', suit: '♥', value: 11 },
              { rank: '10', suit: '♦', value: 10 },
            ],
            rank: 0,
          },
        },
      ]

      pokerStore.gameState.playerHands = mockPlayerHands
      pokerStore.gameState.winners = mockWinners
      pokerStore.gameState.showResults = true

      // 5. Тестируем отображение результатов
      const gameResultsWrapper = mount(GameResults, {
        props: {
          playerHands: mockPlayerHands,
          winners: mockWinners,
        },
        global: {
          plugins: [pinia],
          components: {
            PokerCard,
          },
        },
      })

      // Проверяем отображение результатов
      expect(gameResultsWrapper.find('.winners__list').exists()).toBe(true)
      expect(gameResultsWrapper.find('.hands__list').exists()).toBe(true)

      // Проверяем количество элементов
      const handItems = gameResultsWrapper.findAll('.hand-item')
      expect(handItems).toHaveLength(3)

      // Проверяем, что победитель выделен
      const winnerItems = gameResultsWrapper.findAll('.hand-item--winner')
      expect(winnerItems).toHaveLength(1)

      // Проверяем, что PokerCard компоненты отображаются
      const pokerCards = gameResultsWrapper.findAllComponents(PokerCard)
      expect(pokerCards.length).toBeGreaterThan(0)
    })

    it('должен корректно обрабатывать изменения состояния во время игры', async () => {
      const playerManagerWrapper = mount(PlayerManager, {
        global: {
          plugins: [pinia],
        },
      })

      // Симулируем раздачу карт
      pokerStore.gameState.isDealing = true
      pokerStore.gameState.currentRound = 'Флоп'

      await playerManagerWrapper.vm.$nextTick()

      // Проверяем, что управление заблокировано
      const select = playerManagerWrapper.find('.manager__select')
      const applyButton = playerManagerWrapper.find('.btn--primary')
      const toggleButtons = playerManagerWrapper.findAll('.btn--small')

      expect(select.attributes('disabled')).toBeDefined()
      expect(applyButton.attributes('disabled')).toBeDefined()

      toggleButtons.forEach(button => {
        expect(button.attributes('disabled')).toBeDefined()
      })

      // Завершаем раздачу
      pokerStore.gameState.isDealing = false
      pokerStore.gameState.currentRound = 'Префлоп'

      await playerManagerWrapper.vm.$nextTick()

      // Проверяем, что управление разблокировано
      expect(select.attributes('disabled')).toBeUndefined()
      expect(applyButton.attributes('disabled')).toBeUndefined()
    })

    it('должен корректно обрабатывать отключение игроков во время игры', async () => {
      const playerManagerWrapper = mount(PlayerManager, {
        global: {
          plugins: [pinia],
        },
      })

      // Добавляем карты игрокам
      pokerStore.gameState.players[0].cards = [
        { rank: 'A', suit: '♠', value: 14 },
        { rank: 'K', suit: '♥', value: 13 },
      ]

      // Отключаем первого игрока
      const toggleButtons = playerManagerWrapper.findAll('.btn--small')
      const firstPlayerToggle = toggleButtons[0]

      await firstPlayerToggle.trigger('click')

      // Проверяем, что игрок отключен
      expect(pokerStore.gameState.players[0].isActive).toBe(false)
      expect(pokerStore.gameState.players[0].cards).toEqual([null, null])

      // Проверяем обновление количества карт
      const activePlayers = pokerStore.gameState.players.filter(
        (p: { isActive: boolean }) => p.isActive
      )
      expect(pokerStore.gameState.remainingCards).toBe(
        52 - activePlayers.length * 2
      )
    })
  })

  describe('Интеграция компонентов', () => {
    it('должен корректно передавать данные между компонентами', async () => {
      // Настраиваем состояние игры
      pokerStore.gameState.players = [
        { id: 1, name: 'Игрок 1', cards: [null, null], isActive: true },
        { id: 2, name: 'Игрок 2', cards: [null, null], isActive: true },
      ]

      // Монтируем PlayerManager
      const playerManagerWrapper = mount(PlayerManager, {
        global: {
          plugins: [pinia],
        },
      })

      // Монтируем GameResults
      const mockPlayerHands: PlayerHand[] = [
        {
          playerId: 1,
          playerName: 'Игрок 1',
          hand: {
            name: 'Пара',
            rank: 0,
            cards: [
              { rank: 'A', suit: '♠', value: 14 },
              { rank: 'A', suit: '♥', value: 14 },
              { rank: 'K', suit: '♦', value: 13 },
            ],
          },
        },
        {
          playerId: 2,
          playerName: 'Игрок 2',
          hand: {
            name: 'Тройка',
            rank: 0,
            cards: [
              { rank: 'Q', suit: '♣', value: 12 },
              { rank: 'Q', suit: '♦', value: 12 },
              { rank: 'Q', suit: '♠', value: 12 },
            ],
          },
        },
      ]

      const gameResultsWrapper = mount(GameResults, {
        props: {
          playerHands: mockPlayerHands,
          winners: [mockPlayerHands[1]],
        },
        global: {
          plugins: [pinia],
          components: {
            PokerCard,
          },
        },
      })

      // Проверяем, что данные корректно передаются
      expect(playerManagerWrapper.findAll('.player-item')).toHaveLength(2)
      expect(gameResultsWrapper.findAll('.hand-item')).toHaveLength(2)

      // Проверяем, что PokerCard компоненты работают в обоих контекстах
      const pokerCardsInResults =
        gameResultsWrapper.findAllComponents(PokerCard)
      expect(pokerCardsInResults.length).toBeGreaterThan(0)
    })

    it('должен корректно обрабатывать реактивные обновления', async () => {
      const playerManagerWrapper = mount(PlayerManager, {
        global: {
          plugins: [pinia],
        },
      })

      // Изменяем количество игроков
      const initialPlayerCount = pokerStore.gameState.players.length
      expect(initialPlayerCount).toBe(4)

      // Добавляем игрока
      pokerStore.gameState.players.push({
        id: 5,
        name: 'Игрок 5',
        cards: [null, null],
        isActive: true,
      })

      await playerManagerWrapper.vm.$nextTick()

      // Проверяем, что UI обновился
      const playerItems = playerManagerWrapper.findAll('.player-item')
      expect(playerItems).toHaveLength(5)

      // Проверяем обновление количества карт
      expect(pokerStore.gameState.remainingCards).toBe(44) // 52 - 4 * 2 (все игроки активны)
    })
  })

  describe('Обработка ошибок и граничные случаи', () => {
    it('должен корректно обрабатывать минимальное количество игроков', async () => {
      const playerManagerWrapper = mount(PlayerManager, {
        global: {
          plugins: [pinia],
        },
      })

      // Устанавливаем минимальное количество игроков
      const select = playerManagerWrapper.find('.manager__select')
      await select.setValue(2)

      const applyButton = playerManagerWrapper.find('.btn--primary')
      await applyButton.trigger('click')

      // Проверяем, что количество игроков изменилось
      expect(pokerStore.gameState.players).toHaveLength(2)
      expect(pokerStore.gameState.remainingCards).toBe(48) // 52 - 2 * 2
    })

    it('должен корректно обрабатывать максимальное количество игроков', async () => {
      const playerManagerWrapper = mount(PlayerManager, {
        global: {
          plugins: [pinia],
        },
      })

      // Устанавливаем максимальное количество игроков
      const select = playerManagerWrapper.find('.manager__select')
      await select.setValue(9)

      const applyButton = playerManagerWrapper.find('.btn--primary')
      await applyButton.trigger('click')

      // Проверяем, что количество игроков изменилось
      expect(pokerStore.gameState.players).toHaveLength(9)
      expect(pokerStore.gameState.remainingCards).toBe(34) // 52 - 9 * 2
    })

    it('должен корректно обрабатывать отключение всех игроков', async () => {
      const playerManagerWrapper = mount(PlayerManager, {
        global: {
          plugins: [pinia],
        },
      })

      // Отключаем всех игроков
      const toggleButtons = playerManagerWrapper.findAll('.btn--small')

      for (const button of toggleButtons) {
        await button.trigger('click')
      }

      // Проверяем, что все игроки отключены
      const activePlayers = pokerStore.gameState.players.filter(
        (p: { isActive: boolean }) => p.isActive
      )
      expect(activePlayers).toHaveLength(0)

      // Проверяем количество карт в колоде
      expect(pokerStore.gameState.remainingCards).toBe(52)
    })

    it('должен корректно обрабатывать пустые результаты игры', async () => {
      const gameResultsWrapper = mount(GameResults, {
        props: {
          playerHands: [],
          winners: [],
        },
        global: {
          plugins: [pinia],
          components: {
            PokerCard,
          },
        },
      })

      // Проверяем, что компонент не падает
      expect(gameResultsWrapper.exists()).toBe(true)
      expect(gameResultsWrapper.find('.game-results').exists()).toBe(true)

      // Проверяем, что списки пустые
      const handItems = gameResultsWrapper.findAll('.hand-item')
      expect(handItems).toHaveLength(0)
    })
  })

  describe('Производительность и оптимизация', () => {
    it('должен эффективно обрабатывать большое количество игроков', async () => {
      const playerManagerWrapper = mount(PlayerManager, {
        global: {
          plugins: [pinia],
        },
      })

      // Устанавливаем максимальное количество игроков
      const select = playerManagerWrapper.find('.manager__select')
      await select.setValue(9)

      const applyButton = playerManagerWrapper.find('.btn--primary')
      await applyButton.trigger('click')

      // Проверяем производительность рендеринга
      const playerItems = playerManagerWrapper.findAll('.player-item')
      expect(playerItems).toHaveLength(9)

      // Проверяем, что все элементы отображаются корректно
      for (let i = 0; i < playerItems.length; i++) {
        const playerName = playerItems[i].find('.player-item__name')
        expect(playerName.text()).toBe(`Игрок ${i + 1}`)
      }
    })

    it('должен эффективно обрабатывать большое количество карт в результатах', async () => {
      const largePlayerHands: PlayerHand[] = []

      // Создаем большое количество игроков с картами
      for (let i = 1; i <= 9; i++) {
        largePlayerHands.push({
          playerId: i,
          playerName: `Игрок ${i}`,
          hand: {
            name: 'Пара',
            rank: 0,
            cards: [
              { rank: 'A', suit: '♠', value: 14 },
              { rank: 'A', suit: '♥', value: 14 },
              { rank: 'K', suit: '♦', value: 13 },
              { rank: 'Q', suit: '♣', value: 12 },
              { rank: 'J', suit: '♠', value: 11 },
            ],
          },
        })
      }

      const gameResultsWrapper = mount(GameResults, {
        props: {
          playerHands: largePlayerHands,
          winners: [largePlayerHands[0]],
        },
        global: {
          plugins: [pinia],
          components: {
            PokerCard,
          },
        },
      })

      // Проверяем, что все элементы отображаются
      const handItems = gameResultsWrapper.findAll('.hand-item')
      expect(handItems).toHaveLength(9)

      // Проверяем количество PokerCard компонентов
      const pokerCards = gameResultsWrapper.findAllComponents(PokerCard)
      expect(pokerCards.length).toBe(45) // 9 игроков * 5 карт
    })
  })
})
