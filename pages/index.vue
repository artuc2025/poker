<template>
  <div class="poker-table">
    <!-- Управление игроками -->
    <PlayerManager />

    <div class="table-header">
      <h1 class="table-title">Покерный стол</h1>
      <div class="game-controls">
        <button
          @click="startNewGame"
          class="btn btn--primary"
          :disabled="gameState.isDealing"
        >
          Новая игра
        </button>
        <button
          @click="dealCards"
          class="btn btn--secondary"
          :disabled="!canDeal || gameState.isDealing"
        >
          Раздать карты
        </button>
        <button
          v-if="canDetermineWinner && !gameState.showResults"
          @click="determineWinner"
          class="btn btn--success"
        >
          Определить победителя
        </button>
      </div>
    </div>

    <div class="table-content">
      <!-- Колода -->
      <div class="deck-section">
        <div class="deck">
          <div class="deck__card deck__card--back"></div>
          <div class="deck__count">{{ gameState.remainingCards }} карт</div>
        </div>
      </div>

      <!-- Игроки -->
      <div class="players-section">
        <div
          v-for="player in gameState.players.filter(p => p.isActive)"
          :key="player.id"
          class="player"
          :class="{
            'player--active': player.isActive,
            'player--winner': isWinner(player.id),
          }"
        >
          <div class="player__info">
            <h3 class="player__name">{{ player.name }}</h3>
            <div class="player__cards">
              <PokerCard
                v-for="(card, cardIndex) in player.cards"
                :key="cardIndex"
                :card="card"
                size="medium"
              />
            </div>
            <!-- Показываем комбинацию игрока -->
            <div
              v-if="gameState.showResults && getPlayerHand(player.id)"
              class="player__hand"
            >
              <div class="hand__name">
                {{ getPlayerHand(player.id)?.hand.name }}
              </div>
              <div class="hand__cards">
                <PokerCard
                  v-for="card in getPlayerHand(player.id)?.hand.cards.slice(
                    0,
                    5
                  )"
                  :key="`${card.rank}-${card.suit}`"
                  :card="card"
                  size="small"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Общие карты (флоп, терн, ривер) -->
      <div class="community-cards">
        <h3 class="community-cards__title">Общие карты</h3>
        <div class="community-cards__container">
          <PokerCard
            v-for="(card, index) in gameState.communityCards"
            :key="index"
            :card="card"
            size="large"
            :is-community="true"
          />
        </div>
      </div>
    </div>

    <!-- Live Equity Display -->
    <EquityDisplay />

    <!-- Результаты игры -->
    <GameResults
      v-if="gameState.showResults"
      :player-hands="gameState.playerHands"
      :winners="gameState.winners"
    />

    <!-- Статистика -->
    <div class="game-stats">
      <div class="stats__item">
        <span class="stats__label">Раунд:</span>
        <span class="stats__value">{{ gameState.currentRound }}</span>
      </div>
      <div class="stats__item">
        <span class="stats__label">Карт в колоде:</span>
        <span class="stats__value">{{ gameState.remainingCards }}</span>
      </div>
      <div v-if="gameState.showResults" class="stats__item">
        <span class="stats__label">Победителей:</span>
        <span class="stats__value">{{ gameState.winners.length }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, watch } from 'vue'
  import { usePokerStore } from '~/stores/poker'
  import type { PlayerHand } from '~/utils/pokerHands'

  const pokerStore = usePokerStore()

  // Получаем методы из store
  const {
    canDeal,
    canDetermineWinner,
    startNewGame,
    dealCards,
    determineWinner,
    updateEquity,
    shouldUpdateEquity,
  } = pokerStore

  // Получаем состояние напрямую для реактивности
  const gameState = pokerStore.gameState

  // Проверка, является ли игрок победителем
  const isWinner = (playerId: number): boolean => {
    return gameState.winners.some(winner => winner.playerId === playerId)
  }

  // Получение комбинации игрока
  const getPlayerHand = (playerId: number): PlayerHand | undefined => {
    return gameState.playerHands.find(hand => hand.playerId === playerId)
  }

  // Автоматическое обновление equity при изменении карт
  watch(
    () => [
      gameState.players.map(p => p.cards),
      gameState.communityCards,
      gameState.currentRound,
    ],
    async () => {
      if (shouldUpdateEquity) {
        await updateEquity()
      }
    },
    { deep: true }
  )

  // Инициализация при загрузке компонента
  onMounted(() => {
    // Если колода пустая, создаем новую игру
    if (gameState.deck.length === 0) {
      startNewGame()
    }
  })
</script>

<style scoped>
  .poker-table {
    min-height: 100vh;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255, 255, 255, 0.1);
    padding: 1.5rem;
    border-radius: 1rem;
    backdrop-filter: blur(10px);
  }

  .table-title {
    color: white;
    margin: 0;
    font-size: 2.5rem;
    font-weight: bold;
  }

  .game-controls {
    display: flex;
    gap: 1rem;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .btn--primary {
    background: #4caf50;
    color: white;
  }

  .btn--primary:hover:not(:disabled) {
    background: #45a049;
    transform: translateY(-2px);
  }

  .btn--secondary {
    background: #2196f3;
    color: white;
  }

  .btn--secondary:hover:not(:disabled) {
    background: #1976d2;
    transform: translateY(-2px);
  }

  .btn--success {
    background: #ff9800;
    color: white;
  }

  .btn--success:hover:not(:disabled) {
    background: #f57c00;
    transform: translateY(-2px);
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .table-content {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;
    gap: 2rem;
    align-items: start;
  }

  .deck-section {
    display: flex;
    justify-content: center;
  }

  .deck {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .deck__card {
    width: 80px;
    height: 120px;
    border-radius: 0.5rem;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  .deck__card--back {
    background: linear-gradient(45deg, #1a1a1a, #333);
    border: 2px solid gold;
  }

  .deck__count {
    color: white;
    font-weight: 600;
    text-align: center;
  }

  .players-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .player {
    background: rgba(255, 255, 255, 0.1);
    padding: 1.5rem;
    border-radius: 1rem;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
  }

  .player--active {
    border: 2px solid #4caf50;
    box-shadow: 0 0 20px rgba(76, 175, 80, 0.3);
  }

  .player--winner {
    border: 3px solid #ffd700;
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
    background: rgba(255, 215, 0, 0.1);
  }

  .player__name {
    color: white;
    margin: 0 0 1rem 0;
    font-size: 1.2rem;
  }

  .player__cards {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    margin-bottom: 1rem;
  }

  .player__hand {
    text-align: center;
    margin-top: 1rem;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
  }

  .hand__name {
    color: #ffd700;
    font-weight: bold;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }

  .hand__cards {
    display: flex;
    gap: 0.25rem;
    justify-content: center;
  }

  .community-cards {
    background: rgba(255, 255, 255, 0.1);
    padding: 1.5rem;
    border-radius: 1rem;
    backdrop-filter: blur(10px);
  }

  .community-cards__title {
    color: white;
    margin: 0 0 1rem 0;
    text-align: center;
    font-size: 1.3rem;
  }

  .community-cards__container {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .game-stats {
    display: flex;
    justify-content: center;
    gap: 2rem;
    background: rgba(255, 255, 255, 0.1);
    padding: 1rem;
    border-radius: 1rem;
    backdrop-filter: blur(10px);
  }

  .stats__item {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .stats__label {
    color: #ccc;
    font-weight: 600;
  }

  .stats__value {
    color: white;
    font-weight: bold;
    font-size: 1.1rem;
  }

  @media (max-width: 768px) {
    .table-content {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .players-section {
      grid-template-columns: 1fr;
    }

    .table-header {
      flex-direction: column;
      gap: 1rem;
    }

    .game-controls {
      flex-direction: column;
      width: 100%;
    }
  }
</style>
