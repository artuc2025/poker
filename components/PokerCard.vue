<template>
  <div
    class="poker-card"
    :class="[
      `poker-card--${card ? 'visible' : 'hidden'}`,
      `poker-card--${size}`,
      { 'poker-card--community': isCommunity },
    ]"
  >
    <div v-if="card" class="poker-card__content">
      <div class="poker-card__rank">{{ card.rank }}</div>
      <div class="poker-card__suit">{{ card.suit }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { Card } from '~/stores/poker'

  interface Props {
    card: Card | null
    size?: 'small' | 'medium' | 'large'
    isCommunity?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    size: 'medium',
    isCommunity: false,
  })
</script>

<style scoped>
  .poker-card {
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .poker-card--visible {
    background: white;
    color: #333;
    animation: cardDeal 0.3s ease-out;
  }

  .poker-card--hidden {
    background: linear-gradient(45deg, #1a1a1a, #333);
    border: 1px solid gold;
  }

  .poker-card--small {
    width: 50px;
    height: 75px;
    font-size: 1rem;
  }

  .poker-card--medium {
    width: 60px;
    height: 90px;
    font-size: 1.2rem;
  }

  .poker-card--large {
    width: 80px;
    height: 120px;
    font-size: 1.5rem;
  }

  .poker-card--community {
    width: 70px;
    height: 105px;
    font-size: 1.4rem;
  }

  .poker-card__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .poker-card__rank {
    font-size: 1.2em;
    font-weight: bold;
  }

  .poker-card__suit {
    font-size: 1em;
  }

  /* Анимация появления карт */
  @keyframes cardDeal {
    from {
      transform: translateY(-20px) scale(0.8);
      opacity: 0;
    }
    to {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }
</style>
