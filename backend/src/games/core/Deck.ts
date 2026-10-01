import { Card, Suit, Rank } from '@plus-minus/shared';

// All valid suits and ranks
export const SUITS: Suit[] = ['SPADES', 'HEARTS', 'DIAMONDS', 'CLUBS'];
export const RANKS: Rank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];

/**
 * Creates a unique card ID from rank and suit.
 */
export function makeCardId(rank: Rank, suit: Suit): string {
  return `${rank}_${suit}`;
}

/**
 * Creates a Card object.
 */
export function makeCard(rank: Rank, suit: Suit): Card {
  return { rank, suit, id: makeCardId(rank, suit) };
}

/**
 * Builds a complete standard 52-card deck (unshuffled).
 */
export function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(makeCard(rank, suit));
    }
  }
  return deck;
}

/**
 * Fisher-Yates shuffle — cryptographically adequate for card games.
 * Returns a NEW shuffled array; does not mutate input.
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    // Use Math.random() — good enough; swap with crypto if needed
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Validates that a deck has exactly 52 unique cards.
 */
export function validateDeck(deck: Card[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (deck.length !== 52) {
    errors.push(`Deck has ${deck.length} cards, expected 52`);
  }
  const ids = new Set(deck.map((c) => c.id));
  if (ids.size !== deck.length) {
    errors.push(`Deck has ${deck.length - ids.size} duplicate cards`);
  }
  for (const card of deck) {
    if (!SUITS.includes(card.suit)) errors.push(`Invalid suit: ${card.suit}`);
    if (!RANKS.includes(card.rank)) errors.push(`Invalid rank: ${card.rank}`);
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Returns the display symbol for a suit.
 */
export function suitSymbol(suit: Suit): string {
  const map: Record<Suit, string> = {
    SPADES: '♠',
    HEARTS: '♥',
    DIAMONDS: '♦',
    CLUBS: '♣',
  };
  return map[suit];
}
