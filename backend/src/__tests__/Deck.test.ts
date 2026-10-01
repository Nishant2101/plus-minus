import { buildDeck, shuffleDeck, validateDeck } from '../games/core/Deck';
import { Card, Suit, Rank } from '@plus-minus/shared';

describe('Deck', () => {
  describe('buildDeck', () => {
    it('builds exactly 52 cards', () => {
      const deck = buildDeck();
      expect(deck).toHaveLength(52);
    });

    it('has all four suits', () => {
      const deck = buildDeck();
      const suits = new Set(deck.map((c) => c.suit));
      expect(suits).toContain('SPADES');
      expect(suits).toContain('HEARTS');
      expect(suits).toContain('DIAMONDS');
      expect(suits).toContain('CLUBS');
      expect(suits.size).toBe(4);
    });

    it('has 13 cards per suit', () => {
      const deck = buildDeck();
      const suits: Suit[] = ['SPADES', 'HEARTS', 'DIAMONDS', 'CLUBS'];
      for (const suit of suits) {
        expect(deck.filter((c) => c.suit === suit)).toHaveLength(13);
      }
    });

    it('has all 13 ranks in each suit', () => {
      const deck = buildDeck();
      const ranks: Rank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
      for (const suit of ['SPADES', 'HEARTS', 'DIAMONDS', 'CLUBS'] as Suit[]) {
        for (const rank of ranks) {
          expect(deck.some((c) => c.rank === rank && c.suit === suit)).toBe(true);
        }
      }
    });

    it('has no duplicate cards', () => {
      const deck = buildDeck();
      const ids = new Set(deck.map((c) => c.id));
      expect(ids.size).toBe(52);
    });
  });

  describe('shuffleDeck', () => {
    it('returns 52 cards', () => {
      const deck = buildDeck();
      const shuffled = shuffleDeck(deck);
      expect(shuffled).toHaveLength(52);
    });

    it('does not mutate the original deck', () => {
      const deck = buildDeck();
      const originalFirst = deck[0].id;
      shuffleDeck(deck);
      expect(deck[0].id).toBe(originalFirst);
    });

    it('contains the same cards after shuffling', () => {
      const deck = buildDeck();
      const shuffled = shuffleDeck(deck);
      const originalIds = new Set(deck.map((c) => c.id));
      const shuffledIds = new Set(shuffled.map((c) => c.id));
      expect(shuffledIds.size).toBe(52);
      for (const id of originalIds) {
        expect(shuffledIds.has(id)).toBe(true);
      }
    });

    it('actually shuffles (not in same order)', () => {
      const deck = buildDeck();
      let differentOrder = false;
      for (let attempt = 0; attempt < 10; attempt++) {
        const shuffled = shuffleDeck(deck);
        if (shuffled.some((c, i) => c.id !== deck[i].id)) {
          differentOrder = true;
          break;
        }
      }
      expect(differentOrder).toBe(true);
    });
  });

  describe('validateDeck', () => {
    it('validates a correct deck', () => {
      const deck = buildDeck();
      const result = validateDeck(deck);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('catches wrong number of cards', () => {
      const deck = buildDeck().slice(0, 51);
      const result = validateDeck(deck);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('51'))).toBe(true);
    });

    it('catches duplicate cards', () => {
      const deck = buildDeck();
      deck[1] = { ...deck[0] }; // duplicate
      const result = validateDeck(deck);
      expect(result.valid).toBe(false);
    });
  });
});
