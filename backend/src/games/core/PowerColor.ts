import { Card, Suit } from '@plus-minus/shared';
import { getCardPoints } from './CardRanking';
import { GameSettings } from '@plus-minus/shared';

// ============================================================
// POWER COLOR ELIGIBILITY
// TODO: Confirm exact Power Color eligibility rules with game owner
// ============================================================

/**
 * Returns the total point value of cards of a given suit in a hand.
 * TODO: Confirm point calculation for Power Color eligibility with game owner
 */
export function getSuitPoints(hand: Card[], suit: Suit): number {
  return hand
    .filter((c) => c.suit === suit)
    .reduce((sum, c) => sum + getCardPoints(c), 0);
}

/**
 * Checks if a player can declare a suit as Power Color from their initial 5 cards.
 *
 * Rules (TODO: confirm with game owner):
 * 1. Player must have at least one card of the suit.
 * 2. Total points of that suit must be >= minPowerPoints (default: 4).
 */
export function canDeclareSuit(
  hand: Card[],
  suit: Suit,
  minPowerPoints: number,
): { eligible: boolean; points: number; reason: string } {
  const cardsOfSuit = hand.filter((c) => c.suit === suit);

  if (cardsOfSuit.length === 0) {
    return {
      eligible: false,
      points: 0,
      reason: `No ${suit} cards in hand`,
    };
  }

  const points = getSuitPoints(hand, suit);
  if (points < minPowerPoints) {
    return {
      eligible: false,
      points,
      reason: `${suit} has ${points} points, need ${minPowerPoints}`,
    };
  }

  return {
    eligible: true,
    points,
    reason: `${suit} has ${points} points — eligible`,
  };
}

/**
 * Returns eligibility info for all four suits based on initial 5 cards.
 */
export function getAllSuitEligibilities(
  hand: Card[],
  settings: Pick<GameSettings, 'minPowerPoints'>,
): Array<{ suit: Suit; eligible: boolean; points: number; reason: string }> {
  const suits: Suit[] = ['SPADES', 'HEARTS', 'DIAMONDS', 'CLUBS'];
  return suits.map((suit) => ({
    suit,
    ...canDeclareSuit(hand, suit, settings.minPowerPoints),
  }));
}
