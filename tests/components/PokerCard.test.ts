import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PokerCard from '~/components/PokerCard.vue'
import type { Card } from '~/stores/poker'

// Тестовые данные
const createCard = (rank: string, suit: string, value: number): Card => ({
  rank,
  suit,
  value,
})

describe('PokerCard', () => {
  describe('Отображение карты', () => {
    it('должен отображать карту с правильными данными', () => {
      const card = createCard('A', '♠', 14)
      const wrapper = mount(PokerCard, {
        props: { card },
      })

      expect(wrapper.find('.poker-card__rank').text()).toBe('A')
      expect(wrapper.find('.poker-card__suit').text()).toBe('♠')
    })

    it('должен отображать скрытую карту когда card = null', () => {
      const wrapper = mount(PokerCard, {
        props: { card: null },
      })

      expect(wrapper.classes()).toContain('poker-card--hidden')
      expect(wrapper.find('.poker-card__content').exists()).toBe(false)
    })

    it('должен отображать видимую карту когда card передан', () => {
      const card = createCard('K', '♥', 13)
      const wrapper = mount(PokerCard, {
        props: { card },
      })

      expect(wrapper.classes()).toContain('poker-card--visible')
      expect(wrapper.find('.poker-card__content').exists()).toBe(true)
    })
  })

  describe('Размеры карт', () => {
    it('должен применять размер small по умолчанию', () => {
      const card = createCard('Q', '♦', 12)
      const wrapper = mount(PokerCard, {
        props: { card },
      })

      expect(wrapper.classes()).toContain('poker-card--medium')
    })

    it('должен применять размер small', () => {
      const card = createCard('J', '♣', 11)
      const wrapper = mount(PokerCard, {
        props: { card, size: 'small' },
      })

      expect(wrapper.classes()).toContain('poker-card--small')
    })

    it('должен применять размер large', () => {
      const card = createCard('10', '♠', 10)
      const wrapper = mount(PokerCard, {
        props: { card, size: 'large' },
      })

      expect(wrapper.classes()).toContain('poker-card--large')
    })
  })

  describe('Общие карты', () => {
    it('должен применять стиль community карты', () => {
      const card = createCard('A', '♥', 14)
      const wrapper = mount(PokerCard, {
        props: { card, isCommunity: true },
      })

      expect(wrapper.classes()).toContain('poker-card--community')
    })

    it('не должен применять стиль community карты по умолчанию', () => {
      const card = createCard('K', '♦', 13)
      const wrapper = mount(PokerCard, {
        props: { card },
      })

      expect(wrapper.classes()).not.toContain('poker-card--community')
    })
  })

  describe('Структура DOM', () => {
    it('должен иметь правильную структуру для видимой карты', () => {
      const card = createCard('A', '♠', 14)
      const wrapper = mount(PokerCard, {
        props: { card },
      })

      expect(wrapper.find('.poker-card').exists()).toBe(true)
      expect(wrapper.find('.poker-card__content').exists()).toBe(true)
      expect(wrapper.find('.poker-card__rank').exists()).toBe(true)
      expect(wrapper.find('.poker-card__suit').exists()).toBe(true)
    })

    it('должен иметь правильную структуру для скрытой карты', () => {
      const wrapper = mount(PokerCard, {
        props: { card: null },
      })

      expect(wrapper.find('.poker-card').exists()).toBe(true)
      expect(wrapper.find('.poker-card__content').exists()).toBe(false)
    })
  })

  describe('Props валидация', () => {
    it('должен принимать все валидные props', () => {
      const card = createCard('A', '♠', 14)
      const wrapper = mount(PokerCard, {
        props: {
          card,
          size: 'large',
          isCommunity: true,
        },
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('должен использовать значения по умолчанию', () => {
      const card = createCard('K', '♥', 13)
      const wrapper = mount(PokerCard, {
        props: { card },
      })

      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('CSS классы', () => {
    it('должен применять правильные CSS классы для видимой карты', () => {
      const card = createCard('Q', '♦', 12)
      const wrapper = mount(PokerCard, {
        props: { card },
      })

      const classes = wrapper.classes()
      expect(classes).toContain('poker-card')
      expect(classes).toContain('poker-card--visible')
      expect(classes).toContain('poker-card--medium')
    })

    it('должен применять правильные CSS классы для скрытой карты', () => {
      const wrapper = mount(PokerCard, {
        props: { card: null },
      })

      const classes = wrapper.classes()
      expect(classes).toContain('poker-card')
      expect(classes).toContain('poker-card--hidden')
      expect(classes).toContain('poker-card--medium')
    })

    it('должен применять все CSS классы для community карты', () => {
      const card = createCard('J', '♣', 11)
      const wrapper = mount(PokerCard, {
        props: { card, isCommunity: true, size: 'large' },
      })

      const classes = wrapper.classes()
      expect(classes).toContain('poker-card')
      expect(classes).toContain('poker-card--visible')
      expect(classes).toContain('poker-card--large')
      expect(classes).toContain('poker-card--community')
    })
  })

  describe('Edge cases', () => {
    it('должен корректно обрабатывать карты с разными мастями', () => {
      const cards = [
        createCard('A', '♠', 14),
        createCard('K', '♥', 13),
        createCard('Q', '♦', 12),
        createCard('J', '♣', 11),
      ]

      cards.forEach(card => {
        const wrapper = mount(PokerCard, {
          props: { card },
        })

        expect(wrapper.find('.poker-card__rank').text()).toBe(card.rank)
        expect(wrapper.find('.poker-card__suit').text()).toBe(card.suit)
      })
    })

    it('должен корректно обрабатывать карты с разными достоинствами', () => {
      const cards = [
        createCard('A', '♠', 14),
        createCard('10', '♥', 10),
        createCard('2', '♦', 2),
      ]

      cards.forEach(card => {
        const wrapper = mount(PokerCard, {
          props: { card },
        })

        expect(wrapper.find('.poker-card__rank').text()).toBe(card.rank)
      })
    })
  })
})
