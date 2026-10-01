import { Card, Suit, Rank } from '@plus-minus/shared';
import { RANKS } from './Deck';

// ============================================================
// CARD POINT VALUES
// TODO: Confirm exact Plus Minus card point values with game owner
// These are placeholder values — must be confirmed before production
// ============================================================
export const CARD_POINT_VALUES: Record<Rank, number> = {
  A: 4,
  K: 3,
  Q: 2,
  J: 1,
  '10': 0,
  '9': 0,
  '8': 0,
  '7': 0,
  '6': 0,
  '5': 0,
  '4': 0,
  '3': 0,
  '2': 0,
};

/**
 * Returns the point value of a card.
 * TODO: Confirm exact Plus Minus card point values with game owner
 */
export function getCardPoints(card: Card): number {
  return CARD_POINT_VALUES[card.rank];
}

/**
 * Returns the rank index for comparison (higher index = stronger card within suit).
 * A is highest (index 0), 2 is lowest (index 12).
 * TODO: Confirm exact Plus Minus rank ordering with game owner
 */
export function getRankIndex(rank: Rank): number {
  return RANKS.indexOf(rank); // 0=A (highest), 12=2 (lowest)
}

/**
 * Returns the strength of a card for trick-winning purposes.
 *
 * Rules (TODO: confirm with game owner):
 * 1. Power Color cards beat non-Power Color cards.
 * 2. Among Power Color cards, higher rank wins.
 * 3. Among non-Power Color cards following the lead suit, higher rank wins.
 * 4. Off-suit non-Power cards have no trick-winning strength.
 *
 * Returns a numeric strength: higher number = stronger card.
 * Power Color cards get base 1000, lead-suit cards get base 100, others get 0.
 */
export function getCardStrength(
  card: Card,
  leadSuit: Suit,
  powerColor: Suit,
): number {
  const rankStrength = RANKS.length - getRankIndex(card.rank); // 13 for A, 1 for 2

  if (card.suit === powerColor) {
    // Power Color (trump) cards are strongest
    return 1000 + rankStrength;
  }

  if (card.suit === leadSuit) {
    // Lead suit cards are second strongest
    return 100 + rankStrength;
  }

  // Off-suit, non-power cards cannot win
  return rankStrength; // they still need relative comparison for same-suit
}

/**
 * Determines the winning card (and thus winning player) in a completed trick.
 * TODO: Confirm trick-winner rules with game owner
 */
export function determineTrickWinner(
  playedCards: Array<{ playerId: string; card: Card }>,
  leadSuit: Suit,
  powerColor: Suit,
): string {
  if (playedCards.length === 0) {
    throw new Error('Cannot determine winner of empty trick');
  }

  let winner = playedCards[0];
  let highestStrength = getCardStrength(playedCards[0].card, leadSuit, powerColor);

  for (let i = 1; i < playedCards.length; i++) {
    const strength = getCardStrength(playedCards[i].card, leadSuit, powerColor);

    // A card can only "beat" the current leader if it's in the same category
    // (power vs power, lead vs lead) — off-suit cards can never win
    if (canBeat(playedCards[i].card, winner.card, leadSuit, powerColor)) {
      winner = playedCards[i];
      highestStrength = strength;
    }
  }

  return winner.playerId;
}

/**
 * Returns true if `challenger` beats `current` card in the trick.
 * TODO: Confirm exact trick-winning rules with game owner
 */
export function canBeat(
  challenger: Card,
  current: Card,
  leadSuit: Suit,
  powerColor: Suit,
): boolean {
  const challengerIsPower = challenger.suit === powerColor;
  const currentIsPower = current.suit === powerColor;
  const challengerIsLead = challenger.suit === leadSuit;
  const currentIsLead = current.suit === leadSuit;

  // Power beats non-power
  if (challengerIsPower && !currentIsPower) return true;
  if (!challengerIsPower && currentIsPower) return false;

  // Both power: compare ranks
  if (challengerIsPower && currentIsPower) {
    return getRankIndex(challenger.rank) < getRankIndex(current.rank);
  }

  // Lead beats off-suit
  if (challengerIsLead && !currentIsLead) return true;
  if (!challengerIsLead && currentIsLead) return false;

  // Same category: compare ranks
  return getRankIndex(challenger.rank) < getRankIndex(current.rank);
}
