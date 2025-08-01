<template>
  <div class="player-manager">
    <div class="manager__header">
      <h3 class="manager__title">Управление игроками</h3>
      <div class="manager__controls">
        <label class="manager__label">
          Количество игроков:
          <select
            v-model="selectedPlayerCount"
            class="manager__select"
            :disabled="
              gameState.isDealing || gameState.currentRound !== 'Префлоп'
            "
          >
            <option
              v-for="count in availablePlayerCounts"
              :key="count"
              :value="count"
            >
              {{ count }}
            </option>
          </select>
        </label>
        <button
          @click="updatePlayers"
          class="btn btn--primary"
          :disabled="
            gameState.isDealing || gameState.currentRound !== 'Префлоп'
          "
        >
          Применить
        </button>
      </div>
    </div>

    <div class="players__list">
      <div
        v-for="(player, index) in gameState.players"
        :key="player.id"
        class="player-item"
        :class="{ 'player-item--active': player.isActive }"
      >
        <div class="player-item__info">
          <span class="player-item__name">{{ player.name }}</span>
        </div>
        <div class="player-item__controls">
          <button
            @click="togglePlayer(index)"
            class="btn btn--small"
            :class="player.isActive ? 'btn--danger' : 'btn--success'"
            :disabled="
              gameState.isDealing || gameState.currentRound !== 'Префлоп'
            "
          >
            {{ player.isActive ? 'Отключить' : 'Включить' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { usePokerStore } from '~/stores/poker'

  const pokerStore = usePokerStore()
  const gameState = pokerStore.gameState

  // Доступное количество игроков (от 2 до 9)
  const availablePlayerCounts = [2, 3, 4, 5, 6, 7, 8, 9]

  // Выбранное количество игроков
  const selectedPlayerCount = ref(gameState.players.length)

  // Обновление количества игроков
  const updatePlayers = () => {
    const newCount = selectedPlayerCount.value
    const currentCount = gameState.players.length

    if (newCount === currentCount) return

    if (newCount > currentCount) {
      // Добавляем игроков
      for (let i = currentCount + 1; i <= newCount; i++) {
        gameState.players.push({
          id: i,
          name: `Игрок ${i}`,
          cards: [null, null],
          isActive: true,
        })
      }
    } else {
      // Удаляем игроков (оставляем только активных)
      const activePlayers = gameState.players.filter(player => player.isActive)
      gameState.players = activePlayers.slice(0, newCount)

      // Если нужно больше игроков, добавляем
      while (gameState.players.length < newCount) {
        const newId = gameState.players.length + 1
        gameState.players.push({
          id: newId,
          name: `Игрок ${newId}`,
          cards: [null, null],
          isActive: true,
        })
      }
    }

    // Обновляем количество карт в колоде
    const activePlayers = gameState.players.filter(player => player.isActive)
    gameState.remainingCards = 52 - activePlayers.length * 2
  }

  // Переключение активности игрока
  const togglePlayer = (index: number) => {
    const player = gameState.players[index]
    player.isActive = !player.isActive

    // Если игрок отключен, очищаем его карты
    if (!player.isActive) {
      player.cards = [null, null]
    }

    // Обновляем количество карт в колоде
    const activePlayers = gameState.players.filter(p => p.isActive)
    gameState.remainingCards = 52 - activePlayers.length * 2
  }
</script>

<style scoped>
  .player-manager {
    background: rgba(255, 255, 255, 0.1);
    padding: 1.5rem;
    border-radius: 1rem;
    backdrop-filter: blur(10px);
    margin-bottom: 1rem;
  }

  .manager__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .manager__title {
    color: white;
    margin: 0;
    font-size: 1.2rem;
  }

  .manager__controls {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .manager__label {
    color: white;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .manager__select {
    padding: 0.5rem;
    border-radius: 0.25rem;
    border: 1px solid #ccc;
    background: white;
    font-size: 1rem;
  }

  .players__list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .player-item {
    background: rgba(255, 255, 255, 0.05);
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
  }

  .player-item--active {
    border-color: #4caf50;
    background: rgba(76, 175, 80, 0.1);
  }

  .player-item__info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .player-item__name {
    color: white;
    font-weight: 600;
  }

  .player-item__controls {
    display: flex;
    justify-content: center;
  }

  .btn--small {
    padding: 0.25rem 0.75rem;
    font-size: 0.8rem;
  }

  .btn--danger {
    background: #f44336;
    color: white;
  }

  .btn--danger:hover:not(:disabled) {
    background: #d32f2f;
  }

  @media (max-width: 768px) {
    .manager__header {
      flex-direction: column;
      gap: 1rem;
    }

    .manager__controls {
      flex-direction: column;
      width: 100%;
    }

    .players__list {
      grid-template-columns: 1fr;
    }
  }
</style>
