<template>
  <div class="metrics-charts">
    <!-- Индикатор загрузки -->
    <div v-if="!isChartLoaded" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Загрузка графиков...</p>
    </div>

    <!-- График истории equity -->
    <div class="chart-section">
      <h3 class="chart-title">История Equity</h3>
      <div class="chart-container">
        <canvas ref="equityChartRef" class="chart-canvas"></canvas>
      </div>
    </div>

    <!-- Круговая диаграмма комбинаций -->
    <div class="chart-section">
      <h3 class="chart-title">Распределение комбинаций</h3>
      <div class="chart-container">
        <canvas ref="handsChartRef" class="chart-canvas"></canvas>
      </div>
    </div>

    <!-- График win rate по игрокам -->
    <div class="chart-section">
      <h3 class="chart-title">Win Rate по игрокам</h3>
      <div class="chart-container">
        <canvas ref="winRateChartRef" class="chart-canvas"></canvas>
      </div>
    </div>

    <!-- График средней equity по раундам -->
    <div class="chart-section">
      <h3 class="chart-title">Средняя Equity по раундам</h3>
      <div class="chart-container">
        <canvas ref="roundsChartRef" class="chart-canvas"></canvas>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
  import { usePokerStore } from '~/stores/poker'

  // Lazy loading Chart.js
  let Chart: any = null
  const isChartLoaded = ref(false)

  const pokerStore = usePokerStore()
  const { getAllMetrics, gameState } = pokerStore

  // Refs для canvas элементов
  const equityChartRef = ref<HTMLCanvasElement>()
  const handsChartRef = ref<HTMLCanvasElement>()
  const winRateChartRef = ref<HTMLCanvasElement>()
  const roundsChartRef = ref<HTMLCanvasElement>()

  // Refs для Chart.js экземпляров
  const equityChart = ref<any>(null)
  const handsChart = ref<any>(null)
  const winRateChart = ref<any>(null)
  const roundsChart = ref<any>(null)

  // Цвета для графиков
  const chartColors = {
    primary: '#4caf50',
    secondary: '#2196f3',
    accent: '#ff9800',
    success: '#8bc34a',
    warning: '#ffc107',
    danger: '#f44336',
    info: '#00bcd4',
    light: '#9e9e9e',
    player1: '#4caf50',
    player2: '#2196f3',
    player3: '#ff9800',
    player4: '#9c27b0',
  }

  // Получение данных метрик
  const metrics = computed(() => getAllMetrics)

  // Создание графика истории equity
  const createEquityChart = () => {
    if (!equityChartRef.value || !Chart) return

    const ctx = equityChartRef.value.getContext('2d')
    if (!ctx) return

    const equityHistory = metrics.value.equity.equityHistory
    if (equityHistory.length === 0) return

    // Подготавливаем данные
    const labels = equityHistory.map((_, index) => `Запись ${index + 1}`)
    const datasets = gameState.players
      .filter(player => player.isActive)
      .map((player, index) => {
        const playerEquities = equityHistory.map(entry => {
          const playerEntry = entry.playerEquities.find(
            p => p.playerId === player.id
          )
          return playerEntry ? playerEntry.equity * 100 : 0
        })

        return {
          label: player.name,
          data: playerEquities,
          borderColor:
            Object.values(chartColors)[
              index % Object.values(chartColors).length
            ],
          backgroundColor: `${Object.values(chartColors)[index % Object.values(chartColors).length]}20`,
          borderWidth: 2,
          fill: false,
          tension: 0.4,
        }
      })

    if (equityChart.value) {
      equityChart.value.destroy()
    }

    equityChart.value = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: 'white',
            },
          },
          title: {
            display: true,
            text: 'История Equity (%)',
            color: 'white',
          },
        },
        scales: {
          x: {
            ticks: {
              color: 'white',
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
          },
          y: {
            ticks: {
              color: 'white',
              callback(value: number) {
                return `${value}%`
              },
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
          },
        },
      },
    })
  }

  // Создание круговой диаграммы комбинаций
  const createHandsChart = () => {
    if (!handsChartRef.value || !Chart) return

    const ctx = handsChartRef.value.getContext('2d')
    if (!ctx) return

    const handFrequency = metrics.value.hands.handFrequency
    if (Object.keys(handFrequency).length === 0) return

    const labels = Object.keys(handFrequency)
    const data = Object.values(handFrequency)
    const colors = [
      chartColors.primary,
      chartColors.secondary,
      chartColors.accent,
      chartColors.success,
      chartColors.warning,
      chartColors.danger,
      chartColors.info,
      chartColors.light,
    ]

    if (handsChart.value) {
      handsChart.value.destroy()
    }

    handsChart.value = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors.slice(0, labels.length),
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: 'white',
              padding: 20,
            },
          },
          title: {
            display: true,
            text: 'Распределение комбинаций',
            color: 'white',
          },
        },
      },
    })
  }

  // Создание графика win rate
  const createWinRateChart = () => {
    if (!winRateChartRef.value || !Chart) return

    const ctx = winRateChartRef.value.getContext('2d')
    if (!ctx) return

    const players = gameState.players.filter(player => player.isActive)
    const playerMetrics = players.map(player => {
      const metrics = pokerStore.getPlayerMetrics(player.id)
      return {
        name: player.name,
        winRate: metrics?.winRate || 0,
        gamesPlayed: metrics?.gamesPlayed || 0,
      }
    })

    if (playerMetrics.length === 0) return

    const labels = playerMetrics.map(p => p.name)
    const data = playerMetrics.map(p => p.winRate)
    const colors = playerMetrics.map(
      (_, index) =>
        Object.values(chartColors)[index % Object.values(chartColors).length]
    )

    if (winRateChart.value) {
      winRateChart.value.destroy()
    }

    winRateChart.value = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Win Rate (%)',
            data,
            backgroundColor: colors,
            borderColor: colors.map(color => `${color}80`),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: 'Win Rate по игрокам',
            color: 'white',
          },
        },
        scales: {
          x: {
            ticks: {
              color: 'white',
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
          },
          y: {
            ticks: {
              color: 'white',
              callback(value: number) {
                return `${value}%`
              },
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
          },
        },
      },
    })
  }

  // Создание графика equity по раундам
  const createRoundsChart = () => {
    if (!roundsChartRef.value || !Chart) return

    const ctx = roundsChartRef.value.getContext('2d')
    if (!ctx) return

    const averageEquityByRound = metrics.value.equity.averageEquityByRound
    if (Object.keys(averageEquityByRound).length === 0) return

    // Явно типизируем значения averageEquityByRound, чтобы избежать ошибки unknown
    const labels = Object.keys(averageEquityByRound)
    const data = Object.values(averageEquityByRound).map(
      equity => Number(equity) * 100
    )

    if (roundsChart.value) {
      roundsChart.value.destroy()
    }

    roundsChart.value = new Chart(ctx, {
      type: 'radar',
      data: {
        labels,
        datasets: [
          {
            label: 'Средняя Equity (%)',
            data,
            backgroundColor: `${chartColors.primary}40`,
            borderColor: chartColors.primary,
            borderWidth: 2,
            pointBackgroundColor: chartColors.primary,
            pointBorderColor: 'white',
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: 'white',
            },
          },
          title: {
            display: true,
            text: 'Средняя Equity по раундам',
            color: 'white',
          },
        },
        scales: {
          r: {
            ticks: {
              color: 'white',
              callback(value: number) {
                return `${value}%`
              },
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
            pointLabels: {
              color: 'white',
            },
          },
        },
      },
    })
  }

  // Обновление всех графиков
  const updateCharts = async () => {
    if (!isChartLoaded.value) {
      await loadChartJS()
    }
    await nextTick()
    createEquityChart()
    createHandsChart()
    createWinRateChart()
    createRoundsChart()
  }

  // Дебаунсинг для обновления графиков
  let updateTimeout: NodeJS.Timeout | null = null

  // Следим за изменениями метрик с дебаунсингом
  watch(
    () => [
      metrics.value.equity.equityHistory.length,
      Object.keys(metrics.value.hands.handFrequency).length,
      metrics.value.players.length,
      Object.keys(metrics.value.equity.averageEquityByRound).length,
    ],
    () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout)
      }
      updateTimeout = setTimeout(() => {
        updateCharts()
      }, 300) // Задержка 300мс
    },
    { deep: true }
  )

  // Загрузка Chart.js
  const loadChartJS = async () => {
    if (!isChartLoaded.value) {
      const { Chart: ChartJS } = await import('chart.js/auto')
      Chart = ChartJS
      isChartLoaded.value = true
    }
  }

  // Инициализация
  onMounted(async () => {
    await loadChartJS()
    await nextTick()
    updateCharts()
  })

  // Очистка при размонтировании
  onUnmounted(() => {
    if (updateTimeout) {
      clearTimeout(updateTimeout)
    }
    if (equityChart.value) equityChart.value.destroy()
    if (handsChart.value) handsChart.value.destroy()
    if (winRateChart.value) winRateChart.value.destroy()
    if (roundsChart.value) roundsChart.value.destroy()
  })
</script>

<style scoped>
  .metrics-charts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
  }

  .chart-section {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 1rem;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .chart-title {
    color: #ffd700;
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    font-weight: bold;
    text-align: center;
  }

  .chart-container {
    position: relative;
    height: 300px;
    width: 100%;
  }

  .chart-canvas {
    width: 100% !important;
    height: 100% !important;
  }

  /* Индикатор загрузки */
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 10;
    border-radius: 1rem;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid #ffd700;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .loading-overlay p {
    color: white;
    margin: 0;
    font-size: 0.9rem;
  }

  /* Адаптивность */
  @media (max-width: 768px) {
    .metrics-charts {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .chart-container {
      height: 250px;
    }
  }
</style>
