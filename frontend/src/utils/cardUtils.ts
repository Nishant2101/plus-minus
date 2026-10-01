import { Suit, Rank, Card } from '@plus-minus/shared';

export function suitSymbol(suit: Suit): string {
  const map: Record<Suit, string> = {
    SPADES: '♠',
    HEARTS: '♥',
    DIAMONDS: '♦',
    CLUBS: '♣',
  };
  return map[suit];
}

export function suitName(suit: Suit): string {
  return suit.charAt(0) + suit.slice(1).toLowerCase();
}

export function isRedSuit(suit: Suit): boolean {
  return suit === 'HEARTS' || suit === 'DIAMONDS';
}

export function suitColorClass(suit: Suit): string {
  return isRedSuit(suit) ? 'text-red-500' : 'text-slate-800';
}

export function suitBgClass(suit: Suit): string {
  return isRedSuit(suit)
    ? 'bg-red-500/20 border-red-500/40 text-red-400'
    : 'bg-slate-500/20 border-slate-500/40 text-slate-300';
}

export function cardDisplayName(card: Card): string {
  return `${card.rank}${suitSymbol(card.suit)}`;
}

export function formatPhase(phase: string): string {
  const map: Record<string, string> = {
    WAITING_FOR_PLAYERS: 'Waiting for Players',
    DEAL_INITIAL_CARDS: 'Dealing Cards',
    POWER_DECLARATION: 'Power Color Declaration',
    DEAL_REMAINING_CARDS: 'Dealing Remaining Cards',
    POINT_DECLARATION: 'Point Declaration',
    PLAYING: 'Playing',
    TRICK_COMPLETE: 'Trick Complete',
    ROUND_COMPLETE: 'Round Complete',
    GAME_COMPLETE: 'Game Over',
  };
  return map[phase] ?? phase;
}

export function generateRoomLink(roomCode: string): string {
  return `${window.location.origin}/join/${roomCode}`;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

const SUIT_ORDER: Record<Suit, number> = {
  SPADES: 0,
  HEARTS: 1,
  CLUBS: 2,
  DIAMONDS: 3,
};

const RANK_VALUE: Record<Rank, number> = {
  'A': 14,
  'K': 13,
  'Q': 12,
  'J': 11,
  '10': 10,
  '9': 9,
  '8': 8,
  '7': 7,
  '6': 6,
  '5': 5,
  '4': 4,
  '3': 3,
  '2': 2,
};

/**
 * Arranges and sorts cards according to their suits/colors (Spades, Hearts, Clubs, Diamonds)
 * and then by rank high-to-low (A down to 2).
 */
export function sortHand(hand: Card[]): Card[] {
  return [...hand].sort((a, b) => {
    if (a.suit !== b.suit) {
      return SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
    }
    return (RANK_VALUE[b.rank] ?? 0) - (RANK_VALUE[a.rank] ?? 0);
  });
}

/**
 * Combines and groups cards by their suit.
 */
export function groupHandBySuit(hand: Card[]): Record<Suit, Card[]> {
  const sorted = sortHand(hand);
  const groups: Record<Suit, Card[]> = {
    SPADES: [],
    HEARTS: [],
    CLUBS: [],
    DIAMONDS: [],
  };

  for (const card of sorted) {
    groups[card.suit].push(card);
  }

  return groups;
}

