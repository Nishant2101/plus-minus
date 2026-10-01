import { Card, Suit } from '@plus-minus/shared';
import { getRankIndex, canBeat } from './CardRanking';

/**
 * Determines which cards in a player's hand are legal to play.
 *
 * Rules (TODO: confirm exact higher-card rule with game owner):
 * 1. If the player is leading (no cards in trick), any card is legal.
 * 2. If the trick has a lead suit:
 *    a. If the player has cards of the lead suit, they MUST play lead suit.
 *    b. Among lead-suit cards, if any can beat the current highest card, player MUST play one that beats.
 *    c. If no lead-suit card can beat, player may play any lead-suit card.
 *    d. If player has no lead-suit cards, they may play any card (including power color).
 *
 * The "must play higher" rule applies within the lead suit when the player CAN beat the current leader.
 *
 * @param playerHand - All cards in the player's hand
 * @param currentTrickCards - Cards played so far in this trick
 * @param powerColor - The declared Power Color (trump suit)
 * @returns Array of legal cards to play
 */
export function getLegalCards(
  playerHand: Card[],
  currentTrickCards: Array<{ playerId: string; card: Card }>,
  powerColor: Suit,
): Card[] {
  // Player is leading — any card is legal
  if (currentTrickCards.length === 0) {
    return [...playerHand];
  }

  const leadCard = currentTrickCards[0].card;
  const leadSuit = leadCard.suit;

  // Find cards of the lead suit in hand
  const leadSuitCards = playerHand.filter((c) => c.suit === leadSuit);

  // Player has no lead-suit cards — can play anything
  if (leadSuitCards.length === 0) {
    return [...playerHand];
  }

  // Player has lead-suit cards — must play lead suit
  // Find the current winning card
  const currentWinner = getCurrentWinner(currentTrickCards, leadSuit, powerColor);

  // Find lead-suit cards that can beat the current winner
  const beatingCards = leadSuitCards.filter((c) =>
    canBeat(c, currentWinner.card, leadSuit, powerColor),
  );

  // If player CAN beat, they MUST play a card that beats
  // TODO: Confirm this "must beat" rule with game owner
  if (beatingCards.length > 0) {
    return beatingCards;
  }

  // Cannot beat — can play any lead-suit card
  return leadSuitCards;
}

/**
 * Returns the currently winning played card in a trick.
 */
function getCurrentWinner(
  playedCards: Array<{ playerId: string; card: Card }>,
  leadSuit: Suit,
  powerColor: Suit,
): { playerId: string; card: Card } {
  let winner = playedCards[0];

  for (let i = 1; i < playedCards.length; i++) {
    if (canBeat(playedCards[i].card, winner.card, leadSuit, powerColor)) {
      winner = playedCards[i];
    }
  }

  return winner;
}

/**
 * Checks if a specific card is in the legal cards list.
 */
export function isCardLegal(
  card: Card,
  legalCards: Card[],
): boolean {
  return legalCards.some((c) => c.id === card.id);
}
