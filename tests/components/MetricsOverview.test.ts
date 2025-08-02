import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MetricsOverview from '~/components/MetricsOverview.vue'
import { usePokerStore } from '~/stores/poker'

// Мокаем Chart.js
vi.mock('chart.js/auto', () => ({
  Chart: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
  })),
}))

// Мокаем MetricsCharts компонент
vi.mock('~/components/MetricsCharts.vue', () => ({
  default: {
    name: 'MetricsCharts',
    template: '<div class="metrics-charts">Mock Charts</div>',
  },
}))

// Мокаем URL API для тестовой среды
global.URL = {
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn(),
} as any

describe('MetricsOverview', () => {
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

    store.gameState.currentRound = 'Флоп'

    // Инициализируем метрики
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
  })

  describe('Форматирование данных', () => {
    it('должен корректно форматировать проценты', () => {
      const wrapper = mount(MetricsOverview, {
        global: {
          plugins: [pinia],
          stubs: {
            MetricsCharts: true,
          },
        },
      })
      const vm = wrapper.vm as any

      expect(vm.formatPercentage(0.123)).toBe('12.3%')
      expect(vm.formatPercentage(0.5)).toBe('50.0%')
      expect(vm.formatPercentage(1)).toBe('100.0%')
    })

    it('должен корректно форматировать числа', () => {
      const wrapper = mount(MetricsOverview, {
        global: {
          plugins: [pinia],
          stubs: {
            MetricsCharts: true,
          },
        },
      })
      const vm = wrapper.vm as any

      expect(vm.formatNumber(3.14159)).toBe('3.1')
      expect(vm.formatNumber(10)).toBe('10.0')
    })

    it('должен корректно форматировать длительность', () => {
      const wrapper = mount(MetricsOverview, {
        global: {
          plugins: [pinia],
          stubs: {
            MetricsCharts: true,
          },
        },
      })
      const vm = wrapper.vm as any

      expect(vm.formatDuration(0)).toBe('0с')
      expect(vm.formatDuration(30000)).toBe('30с')
      expect(vm.formatDuration(65000)).toBe('65с')
    })

    it('должен корректно форматировать временные метки', () => {
      const wrapper = mount(MetricsOverview, {
        global: {
          plugins: [pinia],
          stubs: {
            MetricsCharts: true,
          },
        },
      })
      const vm = wrapper.vm as any

      expect(vm.formatTimestamp(0)).toBe('Нет данных')
      expect(vm.formatTimestamp(Date.now())).toMatch(/\d{1,2}:\d{2}:\d{2}/)
    })
  })

  describe('Вспомогательные методы', () => {
    it('должен возвращать имя игрока', () => {
      const wrapper = mount(MetricsOverview, {
        global: {
          plugins: [pinia],
          stubs: {
            MetricsCharts: true,
          },
        },
      })
      const vm = wrapper.vm as any

      expect(vm.getPlayerName(1)).toBe('Игрок 1')
      expect(vm.getPlayerName(2)).toBe('Игрок 2')
      expect(vm.getPlayerName(999)).toBe('Игрок 999')
    })

    it('должен возвращать тренд equity для игрока', () => {
      const wrapper = mount(MetricsOverview, {
        global: {
          plugins: [pinia],
          stubs: {
            MetricsCharts: true,
          },
        },
      })
      const vm = wrapper.vm as any

      const trend1 = vm.getEquityTrend(1)
      expect(trend1?.trend).toBe('up')
      expect(trend1?.change).toBe(0.12)

      const trend2 = vm.getEquityTrend(2)
      expect(trend2?.trend).toBe('down')
      expect(trend2?.change).toBe(-0.08)

      const trend3 = vm.getEquityTrend(999)
      expect(trend3).toBeUndefined()
    })

    it('должен возвращать стрелки трендов', () => {
      const wrapper = mount(MetricsOverview, {
        global: {
          plugins: [pinia],
          stubs: {
            MetricsCharts: true,
          },
        },
      })
      const vm = wrapper.vm as any

      expect(vm.getTrendArrow('up')).toBe('↗')
      expect(vm.getTrendArrow('down')).toBe('↘')
      expect(vm.getTrendArrow('stable')).toBe('→')
      expect(vm.getTrendArrow(undefined)).toBe('→')
    })
  })
})
