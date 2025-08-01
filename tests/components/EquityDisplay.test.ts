import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import EquityDisplay from '~/components/EquityDisplay.vue'

describe('EquityDisplay', () => {
  const createWrapper = () => {
    const pinia = createPinia()
    setActivePinia(pinia)

    return mount(EquityDisplay, {
      global: {
        plugins: [pinia],
      },
    })
  }

  describe('Отображение', () => {
    it('должен отображать заголовок', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.equity-display__title').text()).toBe(
        'Шансы на выигрыш'
      )
    })

    it('должен отображать кнопку точного расчета', () => {
      const wrapper = createWrapper()
      const button = wrapper.find('.btn--secondary')
      expect(button.exists()).toBe(true)
      expect(button.text()).toBe('Точный расчет')
    })

    it('должен показывать сообщение когда нет данных', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.equity-display__empty').text()).toContain(
        'Нет данных для расчета'
      )
    })
  })

  describe('Структура компонента', () => {
    it('должен иметь правильную структуру HTML', () => {
      const wrapper = createWrapper()

      // Проверяем основные элементы
      expect(wrapper.find('.equity-display').exists()).toBe(true)
      expect(wrapper.find('.equity-display__header').exists()).toBe(true)
      expect(wrapper.find('.equity-display__title').exists()).toBe(true)
      expect(wrapper.find('.equity-display__controls').exists()).toBe(true)
    })

    it('должен иметь кнопку с правильными классами', () => {
      const wrapper = createWrapper()
      const button = wrapper.find('.btn--secondary')

      expect(button.exists()).toBe(true)
      expect(button.classes()).toContain('btn')
      expect(button.classes()).toContain('btn--small')
      expect(button.classes()).toContain('btn--secondary')
    })
  })

  describe('Интерактивность', () => {
    it('должен иметь кликабельную кнопку', async () => {
      const wrapper = createWrapper()
      const button = wrapper.find('.btn--secondary')

      expect(button.exists()).toBe(true)

      // Проверяем, что кнопка не заблокирована по умолчанию
      expect(button.attributes('disabled')).toBeUndefined()
    })
  })
})
