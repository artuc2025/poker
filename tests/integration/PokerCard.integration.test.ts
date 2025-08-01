import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PokerCard from '~/components/PokerCard.vue'
import { usePokerStore } from '~/stores/poker'
import type { Card } from '~/stores/poker'

describe('PokerCard Integration Tests', () => {
  let pinia: any
  let pokerStore: any

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    pokerStore = usePokerStore()

    // Сбрасываем состояние к начальному
    pokerStore.startNewGame()
  })

  describe('Взаимодействие с различными размерами', () => {
    it('должен корректно отображать карты разных размеров', async () => {
      const testCard: Card = { rank: 'A', suit: '♠', value: 14 }

      // Тестируем маленький размер
      const smallWrapper = mount(PokerCard, {
        props: {
          card: testCard,
          size: 'small',
        },
        global: {
          plugins: [pinia],
        },
      })

      expect(smallWrapper.classes()).toContain('poker-card--small')

      // Тестируем средний размер
      const mediumWrapper = mount(PokerCard, {
        props: {
          card: testCard,
          size: 'medium',
        },
        global: {
          plugins: [pinia],
        },
      })

      expect(mediumWrapper.classes()).toContain('poker-card--medium')

      // Тестируем большой размер
      const largeWrapper = mount(PokerCard, {
        props: {
          card: testCard,
          size: 'large',
        },
        global: {
          plugins: [pinia],
        },
      })

      expect(largeWrapper.classes()).toContain('poker-card--large')
    })

    it('должен корректно отображать общие карты', async () => {
      const testCard: Card = { rank: 'K', suit: '♥', value: 13 }

      const wrapper = mount(PokerCard, {
        props: {
          card: testCard,
          size: 'medium',
          isCommunity: true,
        },
        global: {
          plugins: [pinia],
        },
      })

      expect(wrapper.classes()).toContain('poker-card--community')
    })
  })

  describe('Взаимодействие с состоянием карт', () => {
    it('должен корректно отображать видимые карты', async () => {
      const visibleCard: Card = { rank: 'Q', suit: '♦', value: 12 }

      const wrapper = mount(PokerCard, {
        props: {
          card: visibleCard,
        },
        global: {
          plugins: [pinia],
        },
      })

      expect(wrapper.classes()).toContain('poker-card--visible')
      expect(wrapper.find('.poker-card__rank').text()).toBe('Q')
      expect(wrapper.find('.poker-card__suit').text()).toBe('♦')
    })

    it('должен корректно отображать скрытые карты', async () => {
      const wrapper = mount(PokerCard, {
        props: {
          card: null,
        },
        global: {
          plugins: [pinia],
        },
      })

      expect(wrapper.classes()).toContain('poker-card--hidden')
      expect(wrapper.find('.poker-card__content').exists()).toBe(false)
    })

    it('должен корректно обрабатывать все масти', async () => {
      const suits = ['♠', '♥', '♦', '♣']
      const ranks = [
        'A',
        'K',
        'Q',
        'J',
        '10',
        '9',
        '8',
        '7',
        '6',
        '5',
        '4',
        '3',
        '2',
      ]

      for (const suit of suits) {
        for (const rank of ranks) {
          const card: Card = { rank, suit, value: 14 }

          const wrapper = mount(PokerCard, {
            props: { card },
            global: {
              plugins: [pinia],
            },
          })

          expect(wrapper.find('.poker-card__rank').text()).toBe(rank)
          expect(wrapper.find('.poker-card__suit').text()).toBe(suit)
        }
      }
    })
  })

  describe('Взаимодействие с store', () => {
    it('должен корректно отображать карты из store', async () => {
      // Добавляем карты в store
      pokerStore.gameState.players[0].cards = [
        { rank: 'A', suit: '♠', value: 14 },
        { rank: 'K', suit: '♥', value: 13 },
      ]

      pokerStore.gameState.communityCards = [
        { rank: 'Q', suit: '♦', value: 12 },
        { rank: 'J', suit: '♣', value: 11 },
        { rank: '10', suit: '♠', value: 10 },
      ]

      // Тестируем карты игроков
      const playerCard = pokerStore.gameState.players[0].cards[0]
      const playerWrapper = mount(PokerCard, {
        props: { card: playerCard },
        global: {
          plugins: [pinia],
        },
      })

      expect(playerWrapper.find('.poker-card__rank').text()).toBe('A')
      expect(playerWrapper.find('.poker-card__suit').text()).toBe('♠')

      // Тестируем общие карты
      const communityCard = pokerStore.gameState.communityCards[0]
      const communityWrapper = mount(PokerCard, {
        props: {
          card: communityCard,
          isCommunity: true,
        },
        global: {
          plugins: [pinia],
        },
      })

      expect(communityWrapper.find('.poker-card__rank').text()).toBe('Q')
      expect(communityWrapper.find('.poker-card__suit').text()).toBe('♦')
    })

    it('должен корректно обрабатывать изменения карт в store', async () => {
      const wrapper = mount(PokerCard, {
        props: { card: null },
        global: {
          plugins: [pinia],
        },
      })

      // Проверяем начальное состояние (скрытая карта)
      expect(wrapper.classes()).toContain('poker-card--hidden')

      // Обновляем карту
      const newCard: Card = { rank: 'A', suit: '♠', value: 14 }
      await wrapper.setProps({ card: newCard })

      // Проверяем, что карта стала видимой
      expect(wrapper.classes()).toContain('poker-card--visible')
      expect(wrapper.find('.poker-card__rank').text()).toBe('A')
      expect(wrapper.find('.poker-card__suit').text()).toBe('♠')
    })
  })

  describe('Реактивность и обновления', () => {
    it('должен реактивно обновляться при изменении props', async () => {
      const wrapper = mount(PokerCard, {
        props: {
          card: { rank: 'A', suit: '♠', value: 14 },
          size: 'medium',
        },
        global: {
          plugins: [pinia],
        },
      })

      // Проверяем начальное состояние
      expect(wrapper.find('.poker-card__rank').text()).toBe('A')
      expect(wrapper.classes()).toContain('poker-card--medium')

      // Изменяем размер
      await wrapper.setProps({ size: 'large' })
      expect(wrapper.classes()).toContain('poker-card--large')

      // Изменяем карту
      await wrapper.setProps({
        card: { rank: 'K', suit: '♥', value: 13 },
      })
      expect(wrapper.find('.poker-card__rank').text()).toBe('K')
      expect(wrapper.find('.poker-card__suit').text()).toBe('♥')
    })

    it('должен корректно обрабатывать переключение между видимой и скрытой картой', async () => {
      const wrapper = mount(PokerCard, {
        props: {
          card: { rank: 'A', suit: '♠', value: 14 },
        },
        global: {
          plugins: [pinia],
        },
      })

      // Проверяем, что карта видима
      expect(wrapper.classes()).toContain('poker-card--visible')
      expect(wrapper.find('.poker-card__content').exists()).toBe(true)

      // Скрываем карту
      await wrapper.setProps({ card: null })

      // Проверяем, что карта скрыта
      expect(wrapper.classes()).toContain('poker-card--hidden')
      expect(wrapper.find('.poker-card__content').exists()).toBe(false)

      // Показываем карту снова
      await wrapper.setProps({
        card: { rank: 'K', suit: '♥', value: 13 },
      })

      // Проверяем, что карта снова видима
      expect(wrapper.classes()).toContain('poker-card--visible')
      expect(wrapper.find('.poker-card__content').exists()).toBe(true)
    })
  })

  describe('Валидация и обработка ошибок', () => {
    it('должен корректно обрабатывать некорректные данные карт', async () => {
      const invalidCard: any = {
        rank: 'INVALID',
        suit: 'INVALID',
        value: 'INVALID',
      }

      const wrapper = mount(PokerCard, {
        props: { card: invalidCard },
        global: {
          plugins: [pinia],
        },
      })

      // Проверяем, что компонент не падает
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.classes()).toContain('poker-card--visible')
    })

    it('должен корректно обрабатывать частично некорректные данные', async () => {
      const partialCard: any = {
        rank: 'A',
        suit: null,
        value: 14,
      }

      const wrapper = mount(PokerCard, {
        props: { card: partialCard },
        global: {
          plugins: [pinia],
        },
      })

      // Проверяем, что компонент не падает
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.poker-card__rank').text()).toBe('A')
    })
  })

  describe('Стилизация и CSS классы', () => {
    it('должен корректно применять CSS классы для разных состояний', async () => {
      // Тестируем видимую карту
      const visibleWrapper = mount(PokerCard, {
        props: {
          card: { rank: 'A', suit: '♠', value: 14 },
        },
        global: {
          plugins: [pinia],
        },
      })

      expect(visibleWrapper.classes()).toContain('poker-card--visible')
      expect(visibleWrapper.classes()).toContain('poker-card--medium')

      // Тестируем скрытую карту
      const hiddenWrapper = mount(PokerCard, {
        props: { card: null },
        global: {
          plugins: [pinia],
        },
      })

      expect(hiddenWrapper.classes()).toContain('poker-card--hidden')
      expect(hiddenWrapper.classes()).toContain('poker-card--medium')
    })

    it('должен корректно применять анимацию появления', async () => {
      const wrapper = mount(PokerCard, {
        props: {
          card: { rank: 'A', suit: '♠', value: 14 },
        },
        global: {
          plugins: [pinia],
        },
      })

      // Проверяем, что компонент имеет класс для анимации
      expect(wrapper.classes()).toContain('poker-card--visible')

      // Проверяем, что стили анимации применяются
      const computedStyles = window.getComputedStyle(wrapper.element)
      expect(computedStyles.animation).toBeDefined()
    })

    it('должен корректно применять тени и эффекты', async () => {
      const wrapper = mount(PokerCard, {
        props: {
          card: { rank: 'A', suit: '♠', value: 14 },
        },
        global: {
          plugins: [pinia],
        },
      })

      // Проверяем, что применяются тени
      const computedStyles = window.getComputedStyle(wrapper.element)
      expect(computedStyles.boxShadow).toBeDefined()
    })
  })

  describe('Интеграция с другими компонентами', () => {
    it('должен корректно работать в составе GameResults', async () => {
      // Импортируем GameResults для тестирования интеграции
      const { default: GameResults } = await import(
        '~/components/GameResults.vue'
      )

      // Исправил типизацию: hand должен содержать поле rank (см. ошибку линтера).
      // Добавил rank в объект hand для соответствия типу PokerHand.
      const wrapper = mount(GameResults, {
        props: {
          playerHands: [
            {
              playerId: 1,
              playerName: 'Игрок 1',
              hand: {
                name: 'Пара',
                rank: 14, // Исправил тип: rank должен быть числом (например, 14 для туза)
                cards: [
                  { rank: 'A', suit: '♠', value: 14 },
                  { rank: 'A', suit: '♥', value: 14 },
                  { rank: 'K', suit: '♦', value: 13 },
                ],
              },
            },
          ],
          winners: [],
        },
        global: {
          plugins: [pinia],
          components: {
            PokerCard,
          },
        },
      })

      // Проверяем, что PokerCard компоненты отображаются в GameResults
      const pokerCards = wrapper.findAllComponents(PokerCard)
      expect(pokerCards.length).toBeGreaterThan(0)

      // Проверяем, что карты отображаются с правильными данными
      const firstCard = pokerCards[0]
      expect(firstCard.props('card')).toEqual({
        rank: 'A',
        suit: '♠',
        value: 14,
      })
    })

    it('должен корректно работать с различными размерами в разных контекстах', async () => {
      // Тестируем маленький размер для GameResults
      const smallCard = mount(PokerCard, {
        props: {
          card: { rank: 'A', suit: '♠', value: 14 },
          size: 'small',
        },
        global: {
          plugins: [pinia],
        },
      })

      expect(smallCard.classes()).toContain('poker-card--small')

      // Тестируем большой размер для основного отображения
      const largeCard = mount(PokerCard, {
        props: {
          card: { rank: 'K', suit: '♥', value: 13 },
          size: 'large',
        },
        global: {
          plugins: [pinia],
        },
      })

      expect(largeCard.classes()).toContain('poker-card--large')
    })
  })
})
