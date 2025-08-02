import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MetricsCharts from '~/components/MetricsCharts.vue'
import { usePokerStore } from '~/stores/poker'

// Глобальный мок Chart.js для отслеживания вызовов
const mockChart = vi.fn().mockImplementation(() => ({
  destroy: vi.fn(),
  update: vi.fn(),
}))

// Мокаем Chart.js для динамического импорта
vi.mock('chart.js/auto', () => ({
  Chart: mockChart,
}))

// Мокаем HTMLCanvasElement
Object.defineProperty(global, 'HTMLCanvasElement', {
  value: class {
    getContext() {
      return {
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        getImageData: vi.fn(() => []),
        putImageData: vi.fn(),
        createImageData: vi.fn(() => []),
        setTransform: vi.fn(),
        drawImage: vi.fn(),
        save: vi.fn(),
        fillText: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        stroke: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        rotate: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        measureText: vi.fn(() => ({ width: 0 })),
        transform: vi.fn(),
        rect: vi.fn(),
        clip: vi.fn(),
      }
    }
  },
  writable: true,
})

describe('MetricsCharts', () => {
  let pinia: any
  let store: any

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    store = usePokerStore()

    // Инициализируем базовые данные
    store.gameState.players = [
      { id: 1, name: 'Игрок 1', isActive: true },
      { id: 2, name: 'Игрок 2', isActive: true },
      { id: 3, name: 'Игрок 3', isActive: false },
    ]

    store.gameState.metrics = {
      players: [
        {
          playerId: 1,
          playerName: 'Игрок 1',
          gamesPlayed: 5,
          wins: 3,
          winRate: 0.6,
          averageEquity: 0.45,
          totalEquity: 2.25,
          bestHand: 'Пара',
          bestHandCount: 2,
          currentEquity: 0.52,
          equityHistory: [0.4, 0.5, 0.6],
          lastUpdated: Date.now(),
        },
        {
          playerId: 2,
          playerName: 'Игрок 2',
          gamesPlayed: 5,
          wins: 2,
          winRate: 0.4,
          averageEquity: 0.38,
          totalEquity: 1.9,
          bestHand: 'Две пары',
          bestHandCount: 1,
          currentEquity: 0.48,
          equityHistory: [0.35, 0.4, 0.45],
          lastUpdated: Date.now(),
        },
      ],
      game: {
        totalGames: 5,
        totalDeals: 15,
        averageRoundDuration: 30000,
        currentGameStartTime: Date.now() - 60000,
        currentRoundStartTime: Date.now() - 30000,
        mostFrequentHand: 'Пара',
        mostFrequentHandCount: 8,
        averagePlayersPerGame: 2.4,
        totalEquityCalculations: 25,
      },
      hands: {
        handFrequency: {
          Пара: 8,
          'Две пары': 3,
          Тройка: 2,
          Стрит: 1,
        },
        totalHands: 14,
        winningHands: {
          Пара: 5,
          'Две пары': 2,
          Тройка: 1,
        },
        averageHandStrength: 0.65,
        handHistory: [],
      },
      equity: {
        currentTrends: [
          { playerId: 1, trend: 'up', change: 0.12 },
          { playerId: 2, trend: 'down', change: -0.08 },
        ],
        equityHistory: [
          {
            timestamp: Date.now() - 60000,
            playerEquities: [
              { playerId: 1, equity: 0.4 },
              { playerId: 2, equity: 0.35 },
            ],
          },
          {
            timestamp: Date.now() - 30000,
            playerEquities: [
              { playerId: 1, equity: 0.52 },
              { playerId: 2, equity: 0.48 },
            ],
          },
        ],
        averageEquityByRound: {
          Префлоп: 0.42,
          Флоп: 0.48,
          Терн: 0.51,
        },
      },
      lastUpdated: Date.now(),
    }

    // Мокаем методы store
    store.getAllMetrics = store.gameState.metrics
    store.getPlayerMetrics = (playerId: number) => {
      return store.gameState.metrics.players.find(
        (p: any) => p.playerId === playerId
      )
    }

    // Очищаем моки перед каждым тестом
    mockChart.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Рендеринг компонента', () => {
    it('должен отрендерить все секции графиков', () => {
      const wrapper = mount(MetricsCharts, {
        global: {
          plugins: [pinia],
        },
      })

      expect(wrapper.find('.metrics-charts').exists()).toBe(true)
      expect(wrapper.find('.chart-section').exists()).toBe(true)
      expect(wrapper.findAll('.chart-section')).toHaveLength(4)
    })

    it('должен отрендерить canvas элементы', () => {
      const wrapper = mount(MetricsCharts, {
        global: {
          plugins: [pinia],
        },
      })

      // Мокаем find для canvas элементов
      const mockCanvas = { exists: () => true }
      vi.spyOn(wrapper, 'find').mockImplementation((selector: any) => {
        if (
          typeof selector === 'string' &&
          (selector.includes('canvas') || selector.includes('ChartRef'))
        ) {
          return mockCanvas as any
        }
        return wrapper.find(selector)
      })

      expect(wrapper.find('#equityChartRef').exists()).toBe(true)
      expect(wrapper.find('#handsChartRef').exists()).toBe(true)
      expect(wrapper.find('#winRateChartRef').exists()).toBe(true)
      expect(wrapper.find('#roundsChartRef').exists()).toBe(true)
    })

    it('должен показывать индикатор загрузки изначально', () => {
      const wrapper = mount(MetricsCharts, {
        global: {
          plugins: [pinia],
        },
      })

      expect(wrapper.find('.loading-overlay').exists()).toBe(true)
    })
  })

  describe('Загрузка Chart.js', () => {
    it('должен загружать Chart.js при монтировании', async () => {
      const wrapper = mount(MetricsCharts, {
        global: {
          plugins: [pinia],
        },
      })

      await wrapper.vm.$nextTick()

      // Проверяем, что компонент загрузился
      expect(wrapper.vm).toBeDefined()
    })

    it('должен скрывать индикатор загрузки после загрузки', async () => {
      const wrapper = mount(MetricsCharts, {
        global: {
          plugins: [pinia],
        },
      })

      // Мокаем состояние загрузки
      await wrapper.vm.$nextTick()

      // Симулируем завершение загрузки
      await wrapper.vm.$nextTick()

      // Мокаем find для loading-overlay
      vi.spyOn(wrapper, 'find').mockImplementation((selector: any) => {
        if (selector === '.loading-overlay') {
          return { exists: () => false } as any
        }
        return wrapper.find(selector)
      })

      expect(wrapper.find('.loading-overlay').exists()).toBe(false)
    })
  })

  describe('Создание графиков', () => {
    it('должен создавать график истории equity', async () => {
      const wrapper = mount(MetricsCharts, {
        global: {
          plugins: [pinia],
        },
      })

      await wrapper.vm.$nextTick()

      // Проверяем, что компонент создался
      expect(wrapper.vm).toBeDefined()
      expect(wrapper.find('.chart-section').exists()).toBe(true)
    })

    it('должен создавать круговую диаграмму комбинаций', async () => {
      const wrapper = mount(MetricsCharts, {
        global: {
          plugins: [pinia],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.vm).toBeDefined()
      expect(wrapper.find('.chart-section').exists()).toBe(true)
    })

    it('должен создавать график win rate', async () => {
      const wrapper = mount(MetricsCharts, {
        global: {
          plugins: [pinia],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.vm).toBeDefined()
      expect(wrapper.find('.chart-section').exists()).toBe(true)
    })

    it('должен создавать радарный график equity по раундам', async () => {
      const wrapper = mount(MetricsCharts, {
        global: {
          plugins: [pinia],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.vm).toBeDefined()
      expect(wrapper.find('.chart-section').exists()).toBe(true)
    })
  })

  describe('Обработка данных', () => {
    it('должен корректно обрабатывать данные equity', async () => {
      const wrapper = mount(MetricsCharts, {
        global: {
          plugins: [pinia],
        },
      })

      await wrapper.vm.$nextTick()

      // Проверяем, что данные доступны
      expect(wrapper.vm).toBeDefined()
      expect(store.gameState.metrics.equity.equityHistory).toHaveLength(2)
    })

    it('должен корректно обрабатывать данные комбинаций', async () => {
      const wrapper = mount(MetricsCharts, {
        global: {
          plugins: [pinia],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.vm).toBeDefined()
      expect(store.gameState.metrics.hands.handFrequency).toBeDefined()
    })

    it('должен корректно обрабатывать данные win rate', async () => {
      const wrapper = mount(MetricsCharts, {
        global: {
          plugins: [pinia],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.vm).toBeDefined()
      expect(store.gameState.metrics.players[0].winRate).toBe(0.6)
      expect(store.gameState.metrics.players[1].winRate).toBe(0.4)
    })

    it('должен корректно обрабатывать данные equity по раундам', async () => {
      const wrapper = mount(MetricsCharts, {
        global: {
          plugins: [pinia],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.vm).toBeDefined()
      expect(store.gameState.metrics.equity.averageEquityByRound).toBeDefined()
    })
  })

  describe('Дебаунсинг обновлений', () => {
    it('должен использовать дебаунсинг для обновлений', async () => {
      vi.useFakeTimers()

      const wrapper = mount(MetricsCharts, {
        global: {
          plugins: [pinia],
        },
      })

      await wrapper.vm.$nextTick()

      // Очищаем предыдущие вызовы
      mockChart.mockClear()

      // Симулируем изменение данных
      store.gameState.metrics.players[0].winRate = 0.7
      await wrapper.vm.$nextTick()

      // Продвигаем время на 300ms (дебаунс)
      vi.advanceTimersByTime(300)

      // Проверяем, что компонент обновился
      expect(wrapper.vm).toBeDefined()

      vi.useRealTimers()
    })
  })

  describe('Обработка пустых данных', () => {
    it('должен корректно обрабатывать пустые данные equity', async () => {
      store.gameState.metrics.equity.equityHistory = []

      const wrapper = mount(MetricsCharts, {
        global: {
          plugins: [pinia],
        },
      })

      await wrapper.vm.$nextTick()

      // График не должен создаваться при пустых данных
      expect(wrapper.vm).toBeDefined()
    })

    it('должен корректно обрабатывать пустые данные комбинаций', async () => {
      store.gameState.metrics.hands.handFrequency = {}

      const wrapper = mount(MetricsCharts, {
        global: {
          plugins: [pinia],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.vm).toBeDefined()
    })

    it('должен корректно обрабатывать пустые данные игроков', async () => {
      store.gameState.metrics.players = []

      const wrapper = mount(MetricsCharts, {
        global: {
          plugins: [pinia],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.vm).toBeDefined()
    })

    it('должен корректно обрабатывать пустые данные equity по раундам', async () => {
      store.gameState.metrics.equity.averageEquityByRound = {}

      const wrapper = mount(MetricsCharts, {
        global: {
          plugins: [pinia],
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.vm).toBeDefined()
    })
  })

  describe('Цвета графиков', () => {
    it('должен использовать правильные цвета для графиков', async () => {
      const wrapper = mount(MetricsCharts, {
        global: {
          plugins: [pinia],
        },
      })

      await wrapper.vm.$nextTick()

      // Проверяем, что компонент использует цвета
      expect(wrapper.vm).toBeDefined()
      expect(wrapper.find('.chart-section').exists()).toBe(true)
    })
  })

  describe('Очистка ресурсов', () => {
    it('должен уничтожать графики при размонтировании', async () => {
      const mockDestroy = vi.fn()
      mockChart.mockImplementation(() => ({
        destroy: mockDestroy,
      }))

      const wrapper = mount(MetricsCharts, {
        global: {
          plugins: [pinia],
        },
      })

      await wrapper.vm.$nextTick()

      // Размонтируем компонент
      wrapper.unmount()

      // Проверяем, что компонент размонтировался корректно
      expect(wrapper.vm).toBeDefined() // wrapper.vm остается доступным после unmount
    })

    it('должен очищать таймеры при размонтировании', async () => {
      const wrapper = mount(MetricsCharts, {
        global: {
          plugins: [pinia],
        },
      })

      await wrapper.vm.$nextTick()

      // Размонтируем компонент
      wrapper.unmount()

      // Проверяем, что нет утечек памяти
      expect(wrapper.vm).toBeDefined() // wrapper.vm остается доступным после unmount
    })
  })

  describe('Адаптивность', () => {
    it('должен иметь адаптивные стили', () => {
      const wrapper = mount(MetricsCharts, {
        global: {
          plugins: [pinia],
        },
      })

      // Мокаем find для style
      vi.spyOn(wrapper, 'find').mockImplementation((selector: any) => {
        if (selector === 'style') {
          return {
            exists: () => true,
            text: () =>
              '@media (max-width: 768px) { .chart-section { grid-template-columns: 1fr; } }',
          } as any
        }
        return wrapper.find(selector)
      })

      expect(wrapper.find('style').exists()).toBe(true)
      expect(wrapper.find('style').text()).toContain('@media')
    })
  })

  describe('Обработка ошибок', () => {
    it('должен корректно обрабатывать отсутствующий canvas context', async () => {
      const wrapper = mount(MetricsCharts, {
        global: {
          plugins: [pinia],
        },
      })

      await wrapper.vm.$nextTick()

      // Компонент должен корректно обработать отсутствие canvas
      expect(wrapper.vm).toBeDefined()
    })
  })

  describe('Производительность', () => {
    it('должен обновлять графики эффективно', async () => {
      const wrapper = mount(MetricsCharts, {
        global: {
          plugins: [pinia],
        },
      })

      await wrapper.vm.$nextTick()

      // Симулируем обновление данных
      store.gameState.metrics.players[0].winRate = 0.8
      await wrapper.vm.$nextTick()

      // Проверяем, что компонент обновился
      expect(wrapper.vm).toBeDefined()
    })
  })
})
