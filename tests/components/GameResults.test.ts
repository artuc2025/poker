import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GameResults from '~/components/GameResults.vue'
import PokerCard from '~/components/PokerCard.vue'
import type { PlayerHand } from '~/utils/pokerHands'
import type { Card } from '~/stores/poker'

// Тестовые данные
const createCard = (rank: string, suit: string, value: number): Card => ({
  rank,
  suit,
  value,
})

const createPlayerHand = (
  playerId: number,
  playerName: string,
  handName: string,
  cards: Card[]
): PlayerHand => ({
  playerId,
  playerName,
  hand: {
    rank: 1,
    name: handName,
    cards,
  },
})

describe('GameResults', () => {
  // Глобальная регистрация компонентов для тестов
  const globalComponents = {
    PokerCard,
  }

  describe('Отображение победителей', () => {
    it('должен отображать одного победителя', () => {
      const winners = [
        createPlayerHand(1, 'Игрок 1', 'Роял-флеш', [
          createCard('A', '♠', 14),
          createCard('K', '♠', 13),
          createCard('Q', '♠', 12),
          createCard('J', '♠', 11),
          createCard('10', '♠', 10),
        ]),
      ]

      const playerHands = [
        ...winners,
        createPlayerHand(2, 'Игрок 2', 'Пара', [
          createCard('A', '♥', 14),
          createCard('A', '♦', 14),
        ]),
      ]

      const wrapper = mount(GameResults, {
        props: { playerHands, winners },
        global: {
          components: globalComponents,
        },
      })

      expect(wrapper.find('.winners__title').text()).toContain('Победитель')
      expect(wrapper.find('.winner__name').text()).toBe('Игрок 1')
      expect(wrapper.find('.winner__hand').text()).toBe('Роял-флеш')
    })

    it('должен отображать несколько победителей', () => {
      const winners = [
        createPlayerHand(1, 'Игрок 1', 'Пара', [
          createCard('A', '♠', 14),
          createCard('A', '♥', 14),
        ]),
        createPlayerHand(2, 'Игрок 2', 'Пара', [
          createCard('A', '♦', 14),
          createCard('A', '♣', 14),
        ]),
      ]

      const playerHands = [
        ...winners,
        createPlayerHand(3, 'Игрок 3', 'Старшая карта', [
          createCard('K', '♠', 13),
        ]),
      ]

      const wrapper = mount(GameResults, {
        props: { playerHands, winners },
        global: {
          components: globalComponents,
        },
      })

      expect(wrapper.find('.winners__title').text()).toContain('Победители')
      expect(wrapper.findAll('.winner')).toHaveLength(2)
    })
  })

  describe('Отображение комбинаций всех игроков', () => {
    it('должен отображать все комбинации игроков', () => {
      const playerHands = [
        createPlayerHand(1, 'Игрок 1', 'Роял-флеш', [
          createCard('A', '♠', 14),
          createCard('K', '♠', 13),
          createCard('Q', '♠', 12),
          createCard('J', '♠', 11),
          createCard('10', '♠', 10),
        ]),
        createPlayerHand(2, 'Игрок 2', 'Пара', [
          createCard('A', '♥', 14),
          createCard('A', '♦', 14),
        ]),
        createPlayerHand(3, 'Игрок 3', 'Старшая карта', [
          createCard('K', '♠', 13),
        ]),
      ]

      const winners = [playerHands[0]]

      const wrapper = mount(GameResults, {
        props: { playerHands, winners },
        global: {
          components: globalComponents,
        },
      })

      expect(wrapper.findAll('.hand-item')).toHaveLength(3)
      expect(wrapper.find('.all-hands__title').text()).toContain(
        'Комбинации всех игроков'
      )
    })

    it('должен выделять победителей в списке', () => {
      const playerHands = [
        createPlayerHand(1, 'Игрок 1', 'Роял-флеш', [
          createCard('A', '♠', 14),
          createCard('K', '♠', 13),
        ]),
        createPlayerHand(2, 'Игрок 2', 'Пара', [
          createCard('A', '♥', 14),
          createCard('A', '♦', 14),
        ]),
      ]

      const winners = [playerHands[0]]

      const wrapper = mount(GameResults, {
        props: { playerHands, winners },
        global: {
          components: globalComponents,
        },
      })

      const handItems = wrapper.findAll('.hand-item')
      expect(handItems[0].classes()).toContain('hand-item--winner')
      expect(handItems[1].classes()).not.toContain('hand-item--winner')
    })
  })

  describe('Структура DOM', () => {
    it('должен иметь правильную структуру', () => {
      const playerHands = [
        createPlayerHand(1, 'Игрок 1', 'Пара', [
          createCard('A', '♠', 14),
          createCard('A', '♥', 14),
        ]),
      ]

      const winners = playerHands

      const wrapper = mount(GameResults, {
        props: { playerHands, winners },
        global: {
          components: globalComponents,
        },
      })

      expect(wrapper.find('.game-results').exists()).toBe(true)
      expect(wrapper.find('.results__header').exists()).toBe(true)
      expect(wrapper.find('.results__title').exists()).toBe(true)
      expect(wrapper.find('.results__content').exists()).toBe(true)
      expect(wrapper.find('.winners-section').exists()).toBe(true)
      expect(wrapper.find('.all-hands').exists()).toBe(true)
    })

    it('должен отображать карты игроков', () => {
      const playerHands = [
        createPlayerHand(1, 'Игрок 1', 'Пара', [
          createCard('A', '♠', 14),
          createCard('A', '♥', 14),
        ]),
      ]

      const winners = playerHands

      const wrapper = mount(GameResults, {
        props: { playerHands, winners },
        global: {
          components: globalComponents,
        },
      })

      expect(wrapper.find('.hand-item__cards').exists()).toBe(true)
      expect(wrapper.find('.hand-item__player').text()).toBe('Игрок 1')
      expect(wrapper.find('.hand-item__combination').text()).toBe('Пара')
    })
  })

  describe('Props валидация', () => {
    it('должен принимать пустые массивы', () => {
      const wrapper = mount(GameResults, {
        props: { playerHands: [], winners: [] },
        global: {
          components: globalComponents,
        },
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('должен принимать большие массивы данных', () => {
      const playerHands = Array.from({ length: 9 }, (_, i) =>
        createPlayerHand(i + 1, `Игрок ${i + 1}`, 'Пара', [
          createCard('A', '♠', 14),
          createCard('A', '♥', 14),
        ])
      )

      const winners = [playerHands[0]]

      const wrapper = mount(GameResults, {
        props: { playerHands, winners },
        global: {
          components: globalComponents,
        },
      })

      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Логика isWinner', () => {
    it('должен правильно определять победителей', () => {
      const playerHands = [
        createPlayerHand(1, 'Игрок 1', 'Роял-флеш', [
          createCard('A', '♠', 14),
        ]),
        createPlayerHand(2, 'Игрок 2', 'Пара', [createCard('A', '♥', 14)]),
      ]

      const winners = [playerHands[0]]

      const wrapper = mount(GameResults, {
        props: { playerHands, winners },
        global: {
          components: globalComponents,
        },
      })

      const handItems = wrapper.findAll('.hand-item')
      expect(handItems[0].classes()).toContain('hand-item--winner')
      expect(handItems[1].classes()).not.toContain('hand-item--winner')
    })

    it('должен правильно обрабатывать несколько победителей', () => {
      const playerHands = [
        createPlayerHand(1, 'Игрок 1', 'Пара', [createCard('A', '♠', 14)]),
        createPlayerHand(2, 'Игрок 2', 'Пара', [createCard('A', '♥', 14)]),
        createPlayerHand(3, 'Игрок 3', 'Старшая карта', [
          createCard('K', '♠', 13),
        ]),
      ]

      const winners = [playerHands[0], playerHands[1]]

      const wrapper = mount(GameResults, {
        props: { playerHands, winners },
        global: {
          components: globalComponents,
        },
      })

      const handItems = wrapper.findAll('.hand-item')
      expect(handItems[0].classes()).toContain('hand-item--winner')
      expect(handItems[1].classes()).toContain('hand-item--winner')
      expect(handItems[2].classes()).not.toContain('hand-item--winner')
    })
  })

  describe('Edge cases', () => {
    it('должен обрабатывать пустые данные', () => {
      const wrapper = mount(GameResults, {
        props: { playerHands: [], winners: [] },
        global: {
          components: globalComponents,
        },
      })

      expect(wrapper.find('.winners__list').exists()).toBe(true)
      expect(wrapper.find('.hands__list').exists()).toBe(true)
    })

    it('должен обрабатывать игроков без карт', () => {
      const playerHands = [createPlayerHand(1, 'Игрок 1', 'Старшая карта', [])]

      const winners = playerHands

      const wrapper = mount(GameResults, {
        props: { playerHands, winners },
        global: {
          components: globalComponents,
        },
      })

      expect(wrapper.find('.hand-item__player').text()).toBe('Игрок 1')
      expect(wrapper.find('.hand-item__combination').text()).toBe(
        'Старшая карта'
      )
    })

    it('должен ограничивать отображение карт до 5', () => {
      const playerHands = [
        createPlayerHand(1, 'Игрок 1', 'Флеш', [
          createCard('A', '♠', 14),
          createCard('K', '♠', 13),
          createCard('Q', '♠', 12),
          createCard('J', '♠', 11),
          createCard('10', '♠', 10),
          createCard('9', '♠', 9), // Должна быть скрыта
        ]),
      ]

      const winners = playerHands

      const wrapper = mount(GameResults, {
        props: { playerHands, winners },
        global: {
          components: globalComponents,
        },
      })

      // Проверяем, что отображается только 5 карт
      const pokerCards = wrapper.findAllComponents({ name: 'PokerCard' })
      expect(pokerCards.length).toBeLessThanOrEqual(5)
    })
  })
})
