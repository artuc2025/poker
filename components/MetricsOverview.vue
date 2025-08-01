<template>
  <div class="metrics-overview">
    <div class="metrics-header">
      <h2 class="metrics-title">Обзор метрик</h2>
      <div class="metrics-controls">
        <button
          @click="toggleMetrics"
          class="btn btn--secondary"
          :class="{ 'btn--active': isVisible }"
        >
          {{ isVisible ? 'Скрыть' : 'Показать' }} метрики
        </button>
        <button
          @click="resetMetrics"
          class="btn btn--danger"
          title="Сбросить все метрики"
        >
          Сброс
        </button>
        <button
          @click="exportMetrics"
          class="btn btn--success"
          title="Экспортировать метрики"
        >
          Экспорт
        </button>
      </div>
    </div>

    <Transition name="metrics-fade" mode="out-in">
      <div v-if="isVisible" class="metrics-content">
        <!-- Статистика игроков -->
        <div class="metrics-section">
          <h3 class="section-title">Статистика игроков</h3>
          <div class="players-grid">
            <div
              v-for="player in activePlayers"
              :key="player.id"
              class="player-metrics"
            >
              <div class="player-metrics__header">
                <h4 class="player-metrics__name">{{ player.name }}</h4>
                <div class="player-metrics__status">
                  <span
                    class="status-indicator"
                    :class="{
                      'status-indicator--active': player.isActive,
                      'status-indicator--inactive': !player.isActive,
                    }"
                  ></span>
                </div>
              </div>

              <div class="player-metrics__stats">
                <div class="stat-item">
                  <span class="stat-label">Игр:</span>
                  <span class="stat-value">{{
                    getPlayerMetrics(player.id)?.gamesPlayed || 0
                  }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Побед:</span>
                  <span class="stat-value">{{
                    getPlayerMetrics(player.id)?.wins || 0
                  }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Win Rate:</span>
                  <span class="stat-value">{{
                    formatPercentage(getPlayerMetrics(player.id)?.winRate || 0)
                  }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Средняя Equity:</span>
                  <span class="stat-value">{{
                    formatPercentage(
                      getPlayerMetrics(player.id)?.averageEquity || 0
                    )
                  }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Текущая Equity:</span>
                  <span class="stat-value">{{
                    formatPercentage(
                      getPlayerMetrics(player.id)?.currentEquity || 0
                    )
                  }}</span>
                </div>
              </div>

              <!-- Тренд equity -->
              <div class="player-metrics__trend">
                <div
                  v-if="getEquityTrend(player.id)"
                  class="trend-indicator"
                  :class="`trend-indicator--${getEquityTrend(player.id)?.trend}`"
                >
                  <span class="trend-arrow">
                    {{ getTrendArrow(getEquityTrend(player.id)?.trend) }}
                  </span>
                  <span class="trend-change">
                    {{
                      formatPercentage(getEquityTrend(player.id)?.change || 0)
                    }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Статистика игры -->
        <div class="metrics-section">
          <h3 class="section-title">Статистика игры</h3>
          <div class="game-stats-grid">
            <div class="game-stat-item">
              <span class="stat-label">Всего игр:</span>
              <span class="stat-value">{{ metrics.game.totalGames }}</span>
            </div>
            <div class="game-stat-item">
              <span class="stat-label">Всего раздач:</span>
              <span class="stat-value">{{ metrics.game.totalDeals }}</span>
            </div>
            <div class="game-stat-item">
              <span class="stat-label">Средняя продолжительность раунда:</span>
              <span class="stat-value">{{
                formatDuration(metrics.game.averageRoundDuration)
              }}</span>
            </div>
            <div class="game-stat-item">
              <span class="stat-label">Среднее количество игроков:</span>
              <span class="stat-value">{{
                formatNumber(metrics.game.averagePlayersPerGame)
              }}</span>
            </div>
            <div class="game-stat-item">
              <span class="stat-label">Расчетов equity:</span>
              <span class="stat-value">{{
                metrics.game.totalEquityCalculations
              }}</span>
            </div>
            <div class="game-stat-item">
              <span class="stat-label">Текущий раунд:</span>
              <span class="stat-value">{{ gameState.currentRound }}</span>
            </div>
          </div>
        </div>

        <!-- Статистика комбинаций -->
        <div class="metrics-section">
          <h3 class="section-title">Статистика комбинаций</h3>
          <div class="hands-stats">
            <div class="hands-summary">
              <div class="summary-item">
                <span class="summary-label">Всего комбинаций:</span>
                <span class="summary-value">{{
                  metrics.hands.totalHands
                }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Самая частая:</span>
                <span class="summary-value">
                  {{ metrics.game.mostFrequentHand || 'Нет данных' }}
                  <span
                    v-if="metrics.game.mostFrequentHandCount"
                    class="frequency-count"
                  >
                    ({{ metrics.game.mostFrequentHandCount }})
                  </span>
                </span>
              </div>
            </div>

            <div
              v-if="Object.keys(metrics.hands.handFrequency).length > 0"
              class="hands-frequency"
            >
              <h4 class="frequency-title">Частота комбинаций:</h4>
              <div class="frequency-list">
                <div
                  v-for="(count, hand) in sortedHandFrequency"
                  :key="hand"
                  class="frequency-item"
                >
                  <span class="hand-name">{{ hand }}</span>
                  <span class="hand-count">{{ count }}</span>
                  <div class="frequency-bar">
                    <div
                      class="frequency-progress"
                      :style="{ width: `${(count / maxHandFrequency) * 100}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Тренды equity -->
        <div class="metrics-section">
          <h3 class="section-title">Тренды Equity</h3>
          <div class="equity-trends">
            <div class="trends-summary">
              <div class="summary-item">
                <span class="summary-label">Записей в истории:</span>
                <span class="summary-value">{{
                  metrics.equity.equityHistory.length
                }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Средняя equity по раундам:</span>
                <span class="summary-value">{{
                  formatAverageEquityByRound()
                }}</span>
              </div>
            </div>

            <div
              v-if="metrics.equity.currentTrends.length > 0"
              class="trends-list"
            >
              <h4 class="trends-title">Текущие тренды:</h4>
              <div class="trends-grid">
                <div
                  v-for="trend in metrics.equity.currentTrends"
                  :key="trend.playerId"
                  class="trend-item"
                >
                  <span class="trend-player">{{
                    getPlayerName(trend.playerId)
                  }}</span>
                  <span
                    class="trend-direction"
                    :class="`trend-direction--${trend.trend}`"
                  >
                    {{ getTrendArrow(trend.trend) }}
                  </span>
                  <span class="trend-change">{{
                    formatPercentage(trend.change)
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Визуализация метрик -->
        <div class="metrics-section">
          <h3 class="section-title">Визуализация метрик</h3>
          <MetricsCharts />
        </div>

        <!-- Время последнего обновления -->
        <div class="metrics-footer">
          <span class="last-updated">
            Последнее обновление: {{ formatTimestamp(metrics.lastUpdated) }}
          </span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { usePokerStore } from '~/stores/poker'
  import type { PlayerMetrics } from '~/stores/poker'
  import MetricsCharts from './MetricsCharts.vue'

  const pokerStore = usePokerStore()
  const isVisible = ref(false)

  // Получаем данные из store
  const { gameState, getAllMetrics, getPlayerMetrics, resetMetrics } =
    pokerStore

  // Вычисляемые свойства
  const metrics = computed(() => getAllMetrics)
  const activePlayers = computed(() =>
    gameState.players.filter(p => p.isActive)
  )

  // Сортированная частота комбинаций
  const sortedHandFrequency = computed(() => {
    const frequency = metrics.value.hands.handFrequency
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .reduce(
        (acc, [hand, count]) => {
          acc[hand] = count
          return acc
        },
        {} as Record<string, number>
      )
  })

  // Максимальная частота для нормализации
  const maxHandFrequency = computed(() => {
    const frequencies = Object.values(metrics.value.hands.handFrequency)
    return frequencies.length > 0 ? Math.max(...frequencies) : 1
  })

  // Методы
  const toggleMetrics = () => {
    isVisible.value = !isVisible.value
  }

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`
  }

  const formatNumber = (value: number): string => {
    return value.toFixed(1)
  }

  const formatDuration = (milliseconds: number): string => {
    if (milliseconds === 0) return '0с'
    const seconds = Math.floor(milliseconds / 1000)
    return `${seconds}с`
  }

  const formatTimestamp = (timestamp: number): string => {
    if (timestamp === 0) return 'Нет данных'
    return new Date(timestamp).toLocaleTimeString()
  }

  const getPlayerName = (playerId: number): string => {
    const player = gameState.players.find(p => p.id === playerId)
    return player?.name || `Игрок ${playerId}`
  }

  const getEquityTrend = (playerId: number) => {
    return metrics.value.equity.currentTrends.find(t => t.playerId === playerId)
  }

  const getTrendArrow = (
    trend: 'up' | 'down' | 'stable' | undefined
  ): string => {
    switch (trend) {
      case 'up':
        return '↗'
      case 'down':
        return '↘'
      case 'stable':
        return '→'
      default:
        return '→'
    }
  }

  const formatAverageEquityByRound = (): string => {
    const rounds = Object.entries(metrics.value.equity.averageEquityByRound)
    if (rounds.length === 0) return 'Нет данных'

    const total = rounds.reduce((sum, [, equity]) => sum + equity, 0)
    const average = total / rounds.length
    return formatPercentage(average)
  }

  // Экспорт метрик
  const exportMetrics = () => {
    const dataStr = JSON.stringify(metrics.value, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `poker-metrics-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Инициализация
  onMounted(() => {
    // Показываем метрики по умолчанию
    isVisible.value = true
  })
</script>

<style scoped>
  .metrics-overview {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 1rem;
    backdrop-filter: blur(10px);
    margin: 2rem 0;
    overflow: hidden;
  }

  .metrics-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    background: rgba(0, 0, 0, 0.2);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .metrics-title {
    color: white;
    margin: 0;
    font-size: 1.5rem;
    font-weight: bold;
  }

  .metrics-controls {
    display: flex;
    gap: 1rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .btn--secondary {
    background: #2196f3;
    color: white;
  }

  .btn--secondary:hover {
    background: #1976d2;
    transform: translateY(-1px);
  }

  .btn--secondary.btn--active {
    background: #4caf50;
  }

  .btn--danger {
    background: #f44336;
    color: white;
  }

  .btn--danger:hover {
    background: #d32f2f;
    transform: translateY(-1px);
  }

  .btn--success {
    background: #4caf50;
    color: white;
  }

  .btn--success:hover {
    background: #388e3c;
    transform: translateY(-1px);
  }

  .metrics-content {
    padding: 2rem;
  }

  .metrics-section {
    margin-bottom: 2rem;
  }

  .metrics-section:last-child {
    margin-bottom: 0;
  }

  .section-title {
    color: #ffd700;
    margin: 0 0 1rem 0;
    font-size: 1.2rem;
    font-weight: bold;
    border-bottom: 2px solid rgba(255, 215, 0, 0.3);
    padding-bottom: 0.5rem;
  }

  /* Статистика игроков */
  .players-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .player-metrics {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 0.8rem;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .player-metrics__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .player-metrics__name {
    color: white;
    margin: 0;
    font-size: 1.1rem;
    font-weight: bold;
  }

  .status-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    display: inline-block;
  }

  .status-indicator--active {
    background: #4caf50;
    box-shadow: 0 0 8px rgba(76, 175, 80, 0.5);
  }

  .status-indicator--inactive {
    background: #f44336;
    box-shadow: 0 0 8px rgba(244, 67, 54, 0.5);
  }

  .player-metrics__stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.8rem;
    margin-bottom: 1rem;
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .stat-label {
    color: #ccc;
    font-size: 0.9rem;
  }

  .stat-value {
    color: white;
    font-weight: bold;
    font-size: 1rem;
  }

  .player-metrics__trend {
    display: flex;
    justify-content: center;
  }

  .trend-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-weight: bold;
  }

  .trend-indicator--up {
    background: rgba(76, 175, 80, 0.2);
    color: #4caf50;
    border: 1px solid rgba(76, 175, 80, 0.3);
  }

  .trend-indicator--down {
    background: rgba(244, 67, 54, 0.2);
    color: #f44336;
    border: 1px solid rgba(244, 67, 54, 0.3);
  }

  .trend-indicator--stable {
    background: rgba(158, 158, 158, 0.2);
    color: #9e9e9e;
    border: 1px solid rgba(158, 158, 158, 0.3);
  }

  .trend-arrow {
    font-size: 1.2rem;
  }

  .trend-change {
    font-size: 0.9rem;
  }

  /* Статистика игры */
  .game-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .game-stat-item {
    background: rgba(0, 0, 0, 0.3);
    padding: 1rem;
    border-radius: 0.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  /* Статистика комбинаций */
  .hands-stats {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .hands-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .summary-item {
    background: rgba(0, 0, 0, 0.3);
    padding: 1rem;
    border-radius: 0.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .summary-label {
    color: #ccc;
    font-size: 0.9rem;
  }

  .summary-value {
    color: white;
    font-weight: bold;
  }

  .frequency-count {
    color: #ffd700;
    font-size: 0.8rem;
  }

  .frequency-title {
    color: white;
    margin: 0 0 1rem 0;
    font-size: 1rem;
  }

  .frequency-list {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .frequency-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.8rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 0.5rem;
  }

  .hand-name {
    color: white;
    font-weight: bold;
    min-width: 120px;
  }

  .hand-count {
    color: #ffd700;
    font-weight: bold;
    min-width: 40px;
    text-align: center;
  }

  .frequency-bar {
    flex: 1;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
  }

  .frequency-progress {
    height: 100%;
    background: linear-gradient(90deg, #4caf50, #8bc34a);
    transition: width 0.3s ease;
  }

  /* Тренды equity */
  .equity-trends {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .trends-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .trends-title {
    color: white;
    margin: 0 0 1rem 0;
    font-size: 1rem;
  }

  .trends-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .trend-item {
    background: rgba(0, 0, 0, 0.3);
    padding: 1rem;
    border-radius: 0.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .trend-player {
    color: white;
    font-weight: bold;
  }

  .trend-direction {
    font-size: 1.2rem;
    font-weight: bold;
  }

  .trend-direction--up {
    color: #4caf50;
  }

  .trend-direction--down {
    color: #f44336;
  }

  .trend-direction--stable {
    color: #9e9e9e;
  }

  .trend-change {
    color: #ffd700;
    font-weight: bold;
  }

  /* Футер */
  .metrics-footer {
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    text-align: center;
  }

  .last-updated {
    color: #ccc;
    font-size: 0.9rem;
  }

  /* Анимации */
  .metrics-fade-enter-active,
  .metrics-fade-leave-active {
    transition: all 0.3s ease;
  }

  .metrics-fade-enter-from {
    opacity: 0;
    transform: translateY(-20px);
  }

  .metrics-fade-leave-to {
    opacity: 0;
    transform: translateY(20px);
  }

  /* Адаптивность */
  @media (max-width: 768px) {
    .metrics-header {
      flex-direction: column;
      gap: 1rem;
    }

    .metrics-controls {
      width: 100%;
      justify-content: center;
    }

    .players-grid {
      grid-template-columns: 1fr;
    }

    .game-stats-grid {
      grid-template-columns: 1fr;
    }

    .hands-summary {
      grid-template-columns: 1fr;
    }

    .trends-grid {
      grid-template-columns: 1fr;
    }

    .player-metrics__stats {
      grid-template-columns: 1fr;
    }
  }
</style>
