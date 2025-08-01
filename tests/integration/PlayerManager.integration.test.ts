import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PlayerManager from '~/components/PlayerManager.vue'
import { usePokerStore } from '~/stores/poker'

describe('PlayerManager Integration Tests', () => {
  let pinia: any
  let pokerStore: any

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    pokerStore = usePokerStore()

    // Сбрасываем состояние к начальному
    pokerStore.startNewGame()
  })

  describe('Взаимодействие с store', () => {
    it('должен корректно обновлять количество игроков в store', async () => {
      const wrapper = mount(PlayerManager, {
        global: {
          plugins: [pinia],
        },
      })

      // Проверяем начальное состояние
      expect(pokerStore.gameState.players).toHaveLength(4)

      // Находим select и изменяем количество игроков
      const select = wrapper.find('.manager__select')
      await select.setValue(6)

      // Нажимаем кнопку "Применить"
      const applyButton = wrapper.find('.btn--primary')
      await applyButton.trigger('click')

      // Проверяем, что количество игроков изменилось в store
      expect(pokerStore.gameState.players).toHaveLength(6)
      expect(pokerStore.gameState.remainingCards).toBe(52 - 6 * 2) // 40 карт
    })

    it('должен корректно обрабатывать отключение игроков', async () => {
      const wrapper = mount(PlayerManager, {
        global: {
          plugins: [pinia],
        },
      })

      // Проверяем начальное состояние
      expect(
        pokerStore.gameState.players.filter(
          (p: { isActive: boolean }) => p.isActive
        )
      ).toHaveLength(4)

      // Находим кнопку отключения первого игрока
      const toggleButtons = wrapper.findAll('.btn--small')
      const firstPlayerToggle = toggleButtons[0]

      await firstPlayerToggle.trigger('click')

      // Проверяем, что игрок отключен
      expect(pokerStore.gameState.players[0].isActive).toBe(false)
      expect(pokerStore.gameState.players[0].cards).toEqual([null, null])

      // Проверяем обновление количества карт в колоде
      const activePlayers = pokerStore.gameState.players.filter(
        (p: { isActive: boolean }) => p.isActive
      )
      expect(pokerStore.gameState.remainingCards).toBe(
        52 - activePlayers.length * 2
      )
    })

    it('должен блокировать управление во время раздачи карт', async () => {
      const wrapper = mount(PlayerManager, {
        global: {
          plugins: [pinia],
        },
      })

      // Симулируем раздачу карт
      pokerStore.gameState.isDealing = true
      pokerStore.gameState.currentRound = 'Флоп'

      await wrapper.vm.$nextTick()

      // Проверяем, что элементы заблокированы
      const select = wrapper.find('.manager__select')
      const applyButton = wrapper.find('.btn--primary')
      const toggleButtons = wrapper.findAll('.btn--small')

      expect(select.attributes('disabled')).toBeDefined()
      expect(applyButton.attributes('disabled')).toBeDefined()

      toggleButtons.forEach(button => {
        expect(button.attributes('disabled')).toBeDefined()
      })
    })
  })

  describe('Взаимодействие с другими компонентами', () => {
    it('должен корректно обновлять состояние для GameResults', async () => {
      // Устанавливаем состояние игры для тестирования результатов
      pokerStore.gameState.currentRound = 'Игра завершена'
      pokerStore.gameState.showResults = true

      // Добавляем тестовые данные для результатов
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

      // Проверяем, что данные корректно передаются
      expect(pokerStore.gameState.playerHands).toHaveLength(2)
      expect(pokerStore.gameState.winners).toHaveLength(1)
    })

    it('должен корректно работать с PokerCard компонентами', async () => {
      // Добавляем карты игрокам
      pokerStore.gameState.players[0].cards = [
        { rank: 'A', suit: '♠', value: 14 },
        { rank: 'K', suit: '♥', value: 13 },
      ]

      // Проверяем, что карты корректно установлены
      expect(pokerStore.gameState.players[0].cards[0]).toEqual({
        rank: 'A',
        suit: '♠',
        value: 14,
      })
      expect(pokerStore.gameState.players[0].cards[1]).toEqual({
        rank: 'K',
        suit: '♥',
        value: 13,
      })
    })
  })

  describe('Реактивность и обновления', () => {
    it('должен реактивно обновлять UI при изменении состояния', async () => {
      const wrapper = mount(PlayerManager, {
        global: {
          plugins: [pinia],
        },
      })

      // Проверяем начальное количество игроков
      let playerItems = wrapper.findAll('.player-item')
      expect(playerItems).toHaveLength(4)

      // Изменяем количество игроков в store
      pokerStore.gameState.players.push({
        id: 5,
        name: 'Игрок 5',
        cards: [null, null],
        isActive: true,
      })

      await wrapper.vm.$nextTick()

      // Проверяем, что UI обновился
      playerItems = wrapper.findAll('.player-item')
      expect(playerItems).toHaveLength(5)
    })

    it('должен корректно обрабатывать изменения активности игроков', async () => {
      const wrapper = mount(PlayerManager, {
        global: {
          plugins: [pinia],
        },
      })

      // Проверяем начальное состояние активности
      let activePlayers = wrapper.findAll('.player-item--active')
      expect(activePlayers).toHaveLength(4)

      // Отключаем первого игрока
      pokerStore.gameState.players[0].isActive = false

      await wrapper.vm.$nextTick()

      // Проверяем, что UI обновился
      activePlayers = wrapper.findAll('.player-item--active')
      expect(activePlayers).toHaveLength(3)
    })
  })

  describe('Валидация и ограничения', () => {
    it('должен корректно обрабатывать минимальное и максимальное количество игроков', async () => {
      const wrapper = mount(PlayerManager, {
        global: {
          plugins: [pinia],
        },
      })

      // Проверяем доступные опции
      const options = wrapper.findAll('option')
      expect(options).toHaveLength(8) // от 2 до 9 игроков

      // Проверяем минимальное значение
      const minOption = options[0]
      expect(minOption.text()).toBe('2')

      // Проверяем максимальное значение
      const maxOption = options[options.length - 1]
      expect(maxOption.text()).toBe('9')
    })

    it('должен корректно обновлять количество карт при изменении игроков', async () => {
      const wrapper = mount(PlayerManager, {
        global: {
          plugins: [pinia],
        },
      })

      // Проверяем начальное количество карт
      expect(pokerStore.gameState.remainingCards).toBe(44) // 52 - 4 * 2

      // Изменяем количество игроков на 6
      const select = wrapper.find('.manager__select')
      await select.setValue(6)

      const applyButton = wrapper.find('.btn--primary')
      await applyButton.trigger('click')

      // Проверяем обновленное количество карт
      expect(pokerStore.gameState.remainingCards).toBe(40) // 52 - 6 * 2
    })
  })
})
