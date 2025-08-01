<template>
  <div class="game-results">
    <div class="results__header">
      <h2 class="results__title">Результаты игры</h2>
    </div>

    <div class="results__content">
      <!-- Победители -->
      <div class="winners-section">
        <h3 class="winners__title">
          {{ winners.length > 1 ? 'Победители' : 'Победитель' }}:
        </h3>
        <div class="winners__list">
          <div v-for="winner in winners" :key="winner.playerId" class="winner">
            <span class="winner__name">{{ winner.playerName }}</span>
            <span class="winner__hand">{{ winner.hand.name }}</span>
          </div>
        </div>
      </div>

      <!-- Комбинации всех игроков -->
      <div class="all-hands">
        <h3 class="all-hands__title">Комбинации всех игроков:</h3>
        <div class="hands__list">
          <div
            v-for="playerHand in playerHands"
            :key="playerHand.playerId"
            class="hand-item"
            :class="{ 'hand-item--winner': isWinner(playerHand.playerId) }"
          >
            <div class="hand-item__player">{{ playerHand.playerName }}</div>
            <div class="hand-item__combination">{{ playerHand.hand.name }}</div>
            <div class="hand-item__cards">
              <PokerCard
                v-for="card in playerHand.hand.cards.slice(0, 5)"
                :key="`${card.rank}-${card.suit}`"
                :card="card"
                size="small"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { PlayerHand } from '~/utils/pokerHands'

  interface Props {
    playerHands: PlayerHand[]
    winners: PlayerHand[]
  }

  const props = defineProps<Props>()

  // Проверка, является ли игрок победителем
  const isWinner = (playerId: number): boolean => {
    return props.winners.some(winner => winner.playerId === playerId)
  }
</script>

<style scoped>
  .game-results {
    background: rgba(255, 255, 255, 0.1);
    padding: 2rem;
    border-radius: 1rem;
    backdrop-filter: blur(10px);
    animation: fadeIn 0.5s ease-out;
  }

  .results__header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .results__title {
    color: #ffd700;
    margin: 0;
    font-size: 2rem;
    font-weight: bold;
  }

  .results__content {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 2rem;
  }

  .winners-section {
    background: rgba(255, 215, 0, 0.1);
    padding: 1.5rem;
    border-radius: 0.5rem;
    border: 2px solid #ffd700;
  }

  .winners__title {
    color: #ffd700;
    margin: 0 0 1rem 0;
    font-size: 1.2rem;
  }

  .winners__list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .winner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 0.25rem;
  }

  .winner__name {
    color: white;
    font-weight: bold;
  }

  .winner__hand {
    color: #ffd700;
    font-weight: bold;
  }

  .all-hands {
    background: rgba(255, 255, 255, 0.05);
    padding: 1.5rem;
    border-radius: 0.5rem;
  }

  .all-hands__title {
    color: white;
    margin: 0 0 1rem 0;
    font-size: 1.2rem;
  }

  .hands__list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .hand-item {
    display: grid;
    grid-template-columns: 1fr 1fr 2fr;
    gap: 1rem;
    align-items: center;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    transition: all 0.3s ease;
  }

  .hand-item--winner {
    background: rgba(255, 215, 0, 0.2);
    border: 2px solid #ffd700;
  }

  .hand-item__player {
    color: white;
    font-weight: bold;
  }

  .hand-item__combination {
    color: #ffd700;
    font-weight: bold;
    text-align: center;
  }

  .hand-item__cards {
    display: flex;
    gap: 0.25rem;
    justify-content: center;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    .results__content {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .hand-item {
      grid-template-columns: 1fr;
      gap: 0.5rem;
      text-align: center;
    }
  }
</style>
