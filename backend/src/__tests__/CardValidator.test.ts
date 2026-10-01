import { getLegalCards, isCardLegal } from '../games/core/CardValidator';
import { makeCard } from '../games/core/Deck';
import { Card } from '@plus-minus/shared';

describe('CardValidator - getLegalCards', () => {
  describe('Leading a trick', () => {
    it('allows any card when leading', () => {
      const hand: Card[] = [
        makeCard('A', 'HEARTS'),
        makeCard('K', 'SPADES'),
        makeCard('Q', 'CLUBS'),
      ];
      const legal = getLegalCards(hand, [], 'HEARTS');
      expect(legal).toHaveLength(3);
    });
  });

  describe('Following suit', () => {
    it('must follow lead suit when possible', () => {
      const hand: Card[] = [
        makeCard('A', 'HEARTS'),
        makeCard('K', 'SPADES'), // off-suit
        makeCard('Q', 'CLUBS'),  // off-suit
      ];
      const trick = [{ playerId: 'p1', card: makeCard('9', 'HEARTS') }];
      const legal = getLegalCards(hand, trick, 'DIAMONDS');
      // Must play HEARTS (A_HEARTS beats 9)
      expect(legal.every((c) => c.suit === 'HEARTS')).toBe(true);
    });

    it('can play any card if no lead suit in hand', () => {
      const hand: Card[] = [
        makeCard('A', 'SPADES'),
        makeCard('K', 'CLUBS'),
        makeCard('Q', 'DIAMONDS'),
      ];
      const trick = [{ playerId: 'p1', card: makeCard('9', 'HEARTS') }];
      const legal = getLegalCards(hand, trick, 'SPADES');
      expect(legal).toHaveLength(3); // any card allowed
    });
  });

  describe('Higher-card rule', () => {
    it('must play higher card if available in lead suit', () => {
      const hand: Card[] = [
        makeCard('A', 'HEARTS'), // can beat 9♥
        makeCard('2', 'HEARTS'), // cannot beat 9♥
        makeCard('K', 'SPADES'),
      ];
      const trick = [{ playerId: 'p1', card: makeCard('9', 'HEARTS') }];
      const legal = getLegalCards(hand, trick, 'DIAMONDS');
      // Only A♥ can beat, so must play A♥
      expect(legal).toHaveLength(1);
      expect(legal[0].rank).toBe('A');
      expect(legal[0].suit).toBe('HEARTS');
    });

    it('can play any lead-suit card if cannot beat', () => {
      const hand: Card[] = [
        makeCard('8', 'HEARTS'), // cannot beat A♥
        makeCard('2', 'HEARTS'), // cannot beat A♥
        makeCard('K', 'SPADES'),
      ];
      const trick = [{ playerId: 'p1', card: makeCard('A', 'HEARTS') }];
      const legal = getLegalCards(hand, trick, 'DIAMONDS');
      // Cannot beat — any HEARTS card allowed
      expect(legal).toHaveLength(2);
      expect(legal.every((c) => c.suit === 'HEARTS')).toBe(true);
    });
  });

  describe('Power Color rules', () => {
    it('power color card beats non-power lead suit', () => {
      const hand: Card[] = [
        makeCard('2', 'DIAMONDS'), // power color (trump)
        makeCard('8', 'HEARTS'),   // lead suit but cannot beat A♥
      ];
      const trick = [{ playerId: 'p1', card: makeCard('A', 'HEARTS') }];
      const legal = getLegalCards(hand, trick, 'DIAMONDS');
      // Has HEARTS but cannot beat → can play any HEARTS
      // Since we have HEARTS suit, must play HEARTS
      expect(legal.every((c) => c.suit === 'HEARTS')).toBe(true);
    });
  });

  describe('isCardLegal', () => {
    it('identifies legal cards', () => {
      const hand: Card[] = [makeCard('A', 'HEARTS'), makeCard('K', 'SPADES')];
      const trick = [{ playerId: 'p1', card: makeCard('9', 'HEARTS') }];
      const legal = getLegalCards(hand, trick, 'DIAMONDS');
      expect(isCardLegal(makeCard('A', 'HEARTS'), legal)).toBe(true);
      expect(isCardLegal(makeCard('K', 'SPADES'), legal)).toBe(false);
    });
  });
});
