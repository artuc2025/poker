<template>
  <div class="equity-display">
    <div class="equity-display__header">
      <h3 class="equity-display__title">Шансы на выигрыш</h3>
      <div class="equity-display__controls">
        <button
          @click="calculateFullEquity"
          class="btn btn--small btn--secondary"
          :disabled="isCalculatingEquity"
        >
          {{ isCalculatingEquity ? 'Расчет...' : 'Точный расчет' }}
        </button>
      </div>
    </div>

    <div v-if="playerEquity.length > 0" class="equity-display__content">
      <div
        v-for="equity in playerEquity"
        :key="equity.playerId"
        class="equity-item"
        :class="{
          'equity-item--winner': isWinner(equity.playerId),
        }"
      >
        <div class="equity-item__header">
          <span class="equity-item__name">{{ equity.playerName }}</span>
          <span class="equity-item__percentage"
            >{{ equity.equity.toFixed(1) }}%</span
          >
        </div>

        <div class="equity-item__progress">
          <div
            class="equity-item__progress-bar"
            :style="{ width: `${equity.equity}%` }"
            :class="getEquityColorClass(equity.equity)"
          ></div>
        </div>

        <div class="equity-item__stats">
          <span class="equity-item__wins">
            Побед: {{ equity.winCount }} из {{ equity.totalSimulations }}
          </span>
        </div>
      </div>
    </div>

    <div v-else-if="shouldUpdateEquity" class="equity-display__empty">
      <div class="equity-display__loading">
        <div class="loading-spinner"></div>
        <span>Расчет шансов...</span>
      </div>
    </div>

    <div v-else class="equity-display__empty">
      <span>Нет данных для расчета</span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { usePokerStore } from '~/stores/poker'
  import type { PlayerEquity } from '~/utils/equityCalculator'

  const pokerStore = usePokerStore()

  // Получаем данные из store
  const playerEquity = computed(() => pokerStore.gameState.playerEquity)
  const isCalculatingEquity = computed(
    () => pokerStore.gameState.isCalculatingEquity
  )
  const shouldUpdateEquity = computed(() => pokerStore.shouldUpdateEquity)
  const winners = computed(() => pokerStore.gameState.winners)

  // Проверка, является ли игрок победителем
  const isWinner = (playerId: number): boolean => {
    return winners.value.some(winner => winner.playerId === playerId)
  }

  // Получение класса цвета для equity
  const getEquityColorClass = (equity: number): string => {
    if (equity >= 50) return 'equity-item__progress-bar--high'
    if (equity >= 25) return 'equity-item__progress-bar--medium'
    return 'equity-item__progress-bar--low'
  }

  // Запуск точного расчета equity
  const calculateFullEquity = async () => {
    await pokerStore.calculateEquity(false)
  }
</script>

<style scoped>
  .equity-display {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 1rem;
    padding: 1.5rem;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .equity-display__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .equity-display__title {
    color: white;
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
  }

  .equity-display__controls {
    display: flex;
    gap: 0.5rem;
  }

  .btn--small {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }

  .equity-display__content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .equity-item {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 0.5rem;
    padding: 1rem;
    transition: all 0.3s ease;
  }

  .equity-item--winner {
    border: 2px solid #ffd700;
    background: rgba(255, 215, 0, 0.1);
  }

  .equity-item__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .equity-item__name {
    color: white;
    font-weight: 600;
    font-size: 1rem;
  }

  .equity-item__percentage {
    color: #ffd700;
    font-weight: bold;
    font-size: 1.1rem;
  }

  .equity-item__progress {
    height: 8px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .equity-item__progress-bar {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease;
    position: relative;
  }

  .equity-item__progress-bar--high {
    background: linear-gradient(90deg, #4caf50, #8bc34a);
  }

  .equity-item__progress-bar--medium {
    background: linear-gradient(90deg, #ff9800, #ffc107);
  }

  .equity-item__progress-bar--low {
    background: linear-gradient(90deg, #f44336, #ff5722);
  }

  .equity-item__stats {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .equity-item__wins {
    color: #ccc;
    font-size: 0.8rem;
  }

  .equity-display__empty {
    text-align: center;
    color: #ccc;
    padding: 2rem;
  }

  .equity-display__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    color: #ccc;
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid #ffd700;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 768px) {
    .equity-display__header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .equity-display__controls {
      justify-content: center;
    }
  }
</style>
