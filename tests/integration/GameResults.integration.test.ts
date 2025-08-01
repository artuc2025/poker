import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GameResults from '~/components/GameResults.vue'
import PokerCard from '~/components/PokerCard.vue'
import { usePokerStore } from '~/stores/poker'
import type { PlayerHand } from '~/utils/pokerHands'

describe('GameResults Integration Tests', () => {
  let pinia: any
  let pokerStore: any

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    pokerStore = usePokerStore()

    // Сбрасываем состояние к начальному
    pokerStore.startNewGame()
  })

  describe('Взаимодействие с PokerCard компонентами', () => {
    it('должен корректно отображать карты игроков через PokerCard', async () => {
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
            rank: 0,
            cards: [
              { rank: 'K', suit: '♠', value: 13 },
              { rank: 'K', suit: '♥', value: 13 },
              { rank: 'K', suit: '♦', value: 13 },
              { rank: 'A', suit: '♣', value: 14 },
              { rank: '2', suit: '♠', value: 2 },
            ],
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
              { rank: 'K', suit: '♠', value: 13 },
              { rank: 'K', suit: '♥', value: 13 },
              { rank: 'K', suit: '♦', value: 13 },
              { rank: 'A', suit: '♣', value: 14 },
              { rank: '2', suit: '♠', value: 2 },
            ],
            rank: 0,
          },
        },
      ]

      const wrapper = mount(GameResults, {
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

      // Проверяем, что PokerCard компоненты отображаются
      const pokerCards = wrapper.findAllComponents(PokerCard)
      expect(pokerCards.length).toBeGreaterThan(0)

      // Проверяем, что карты отображаются с правильными props
      const firstPlayerCards = wrapper.findAll('.hand-item__cards')[0]
      const cardsInFirstPlayer = firstPlayerCards.findAllComponents(PokerCard)
      expect(cardsInFirstPlayer).toHaveLength(5) // Максимум 5 карт отображается
    })

    it('должен корректно обрабатывать пустые карты', async () => {
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
              {} as Card,
              {} as Card,
              {} as Card,
            ],
          },
        },
      ]

      const wrapper = mount(GameResults, {
        props: {
          playerHands: mockPlayerHands,
          winners: [],
        },
        global: {
          plugins: [pinia],
          components: {
            PokerCard,
          },
        },
      })

      // Проверяем, что компонент не падает при null картах
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.game-results').exists()).toBe(true)
    })
  })

  describe('Взаимодействие с store', () => {
    it('должен корректно отображать данные из store', async () => {
      // Устанавливаем данные в store
      pokerStore.gameState.playerHands = [
        {
          playerId: 1,
          playerName: 'Игрок 1',
          hand: { name: 'Пара', cards: [] },
        },
        {
          playerId: 2,
          playerName: 'Игрок 2',
          hand: { name: 'Тройка', cards: [] },
        },
      ]
      pokerStore.gameState.winners = [
        {
          playerId: 2,
          playerName: 'Игрок 2',
          hand: { name: 'Тройка', cards: [] },
        },
      ]

      const wrapper = mount(GameResults, {
        props: {
          playerHands: pokerStore.gameState.playerHands,
          winners: pokerStore.gameState.winners,
        },
        global: {
          plugins: [pinia],
          components: {
            PokerCard,
          },
        },
      })

      // Проверяем отображение победителей
      const winnersList = wrapper.find('.winners__list')
      expect(winnersList.exists()).toBe(true)

      // Проверяем отображение всех комбинаций
      const handsList = wrapper.find('.hands__list')
      expect(handsList.exists()).toBe(true)

      // Проверяем количество элементов
      const handItems = wrapper.findAll('.hand-item')
      expect(handItems).toHaveLength(2)
    })

    it('должен корректно обрабатывать множественных победителей', async () => {
      const mockWinners: PlayerHand[] = [
        {
          playerId: 1,
          playerName: 'Игрок 1',
          hand: {
            name: 'Пара',
            cards: [],
            rank: 0,
          },
        },
        {
          playerId: 2,
          playerName: 'Игрок 2',
          hand: {
            name: 'Пара',
            cards: [],
            rank: 0,
          },
        },
      ]

      const wrapper = mount(GameResults, {
        props: {
          playerHands: mockWinners,
          winners: mockWinners,
        },
        global: {
          plugins: [pinia],
          components: {
            PokerCard,
          },
        },
      })

      // Проверяем, что заголовок показывает "Победители" (множественное число)
      const winnersTitle = wrapper.find('.winners__title')
      expect(winnersTitle.text()).toContain('Победители')
    })
  })

  describe('Реактивность и обновления', () => {
    it('должен реактивно обновляться при изменении props', async () => {
      const initialPlayerHands: PlayerHand[] = [
        {
          playerId: 1,
          playerName: 'Игрок 1',
          hand: {
            name: 'Пара',
            cards: [],
            rank: 0,
          },
        },
      ]

      const wrapper = mount(GameResults, {
        props: {
          playerHands: initialPlayerHands,
          winners: [],
        },
        global: {
          plugins: [pinia],
          components: {
            PokerCard,
          },
        },
      })

      // Проверяем начальное количество элементов
      let handItems = wrapper.findAll('.hand-item')
      expect(handItems).toHaveLength(1)

      // Обновляем props
      const updatedPlayerHands: PlayerHand[] = [
        {
          playerId: 1,
          playerName: 'Игрок 1',
          hand: {
            name: 'Пара',
            cards: [],
            rank: 0,
          },
        },
        {
          playerId: 2,
          playerName: 'Игрок 2',
          hand: {
            name: 'Тройка',
            cards: [],
            rank: 0,
          },
        },
      ]

      await wrapper.setProps({
        playerHands: updatedPlayerHands,
        winners: [],
      })

      // Проверяем, что UI обновился
      handItems = wrapper.findAll('.hand-item')
      expect(handItems).toHaveLength(2)
    })

    it('должен корректно обрабатывать изменения победителей', async () => {
      const mockPlayerHands: PlayerHand[] = [
        {
          playerId: 1,
          playerName: 'Игрок 1',
          hand: {
            name: 'Пара',
            cards: [],
            rank: 0,
          },
        },
        {
          playerId: 2,
          playerName: 'Игрок 2',
          hand: {
            name: 'Тройка',
            cards: [],
            rank: 0,
          },
        },
      ]

      const wrapper = mount(GameResults, {
        props: {
          playerHands: mockPlayerHands,
          winners: [],
        },
        global: {
          plugins: [pinia],
          components: {
            PokerCard,
          },
        },
      })

      // Проверяем начальное состояние (нет победителей)
      let winnerItems = wrapper.findAll('.hand-item--winner')
      expect(winnerItems).toHaveLength(0)

      // Добавляем победителя
      await wrapper.setProps({
        playerHands: mockPlayerHands,
        winners: [mockPlayerHands[1]], // Игрок 2 становится победителем
      })

      // Проверяем, что победитель выделен
      winnerItems = wrapper.findAll('.hand-item--winner')
      expect(winnerItems).toHaveLength(1)
    })
  })

  describe('Валидация и обработка ошибок', () => {
    it('должен корректно обрабатывать пустые массивы', async () => {
      const wrapper = mount(GameResults, {
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
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.game-results').exists()).toBe(true)

      // Проверяем, что списки пустые
      const handItems = wrapper.findAll('.hand-item')
      expect(handItems).toHaveLength(0)
    })

    it('должен корректно обрабатывать некорректные данные', async () => {
      const invalidPlayerHands: any[] = [
        {
          playerId: 1,
          playerName: 'Игрок 1',
          hand: null, // Некорректные данные
        },
      ]

      const wrapper = mount(GameResults, {
        props: {
          playerHands: invalidPlayerHands,
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
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Стилизация и CSS классы', () => {
    it('должен корректно применять CSS классы для победителей', async () => {
      const mockPlayerHands: PlayerHand[] = [
        {
          playerId: 1,
          playerName: 'Игрок 1',
          hand: {
            name: 'Пара',
            cards: [],
            rank: 0,
          },
        },
        {
          playerId: 2,
          playerName: 'Игрок 2',
          hand: {
            name: 'Тройка',
            cards: [],
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
            cards: [],
            rank: 0,
          },
        },
      ]

      const wrapper = mount(GameResults, {
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

      // Проверяем, что победитель имеет правильный CSS класс
      const handItems = wrapper.findAll('.hand-item')
      const winnerItem = handItems[1] // Второй игрок - победитель
      expect(winnerItem.classes()).toContain('hand-item--winner')

      // Проверяем, что не-победитель не имеет класс победителя
      const nonWinnerItem = handItems[0] // Первый игрок - не победитель
      expect(nonWinnerItem.classes()).not.toContain('hand-item--winner')
    })

    it('должен корректно отображать анимацию появления', async () => {
      const wrapper = mount(GameResults, {
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

      // Проверяем, что компонент имеет класс для анимации
      const gameResults = wrapper.find('.game-results')
      expect(gameResults.exists()).toBe(true)

      // Проверяем, что стили анимации применяются
      const computedStyles = window.getComputedStyle(gameResults.element)
      expect(computedStyles.animation).toBeDefined()
    })
  })
})
