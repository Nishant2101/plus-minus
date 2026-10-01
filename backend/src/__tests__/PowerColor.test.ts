import { canDeclareSuit, getSuitPoints } from '../games/core/PowerColor';
import { makeCard } from '../games/core/Deck';
import { Card } from '@plus-minus/shared';

const MIN_POWER_POINTS = 4;

describe('PowerColor', () => {
  const hand: Card[] = [
    makeCard('A', 'HEARTS'),   // 4 pts
    makeCard('9', 'HEARTS'),   // 0 pts
    makeCard('4', 'CLUBS'),    // 0 pts
    makeCard('K', 'DIAMONDS'), // 3 pts
    makeCard('2', 'SPADES'),   // 0 pts
  ];

  describe('getSuitPoints', () => {
    it('calculates correct suit points', () => {
      expect(getSuitPoints(hand, 'HEARTS')).toBe(4); // A=4
      expect(getSuitPoints(hand, 'CLUBS')).toBe(0);
      expect(getSuitPoints(hand, 'DIAMONDS')).toBe(3);
      expect(getSuitPoints(hand, 'SPADES')).toBe(0);
    });
  });

  describe('canDeclareSuit', () => {
    it('allows declaring HEARTS (exactly 4 points)', () => {
      const result = canDeclareSuit(hand, 'HEARTS', MIN_POWER_POINTS);
      expect(result.eligible).toBe(true);
      expect(result.points).toBe(4);
    });

    it('rejects CLUBS (suit present but less than 4 points)', () => {
      const result = canDeclareSuit(hand, 'CLUBS', MIN_POWER_POINTS);
      expect(result.eligible).toBe(false);
      expect(result.points).toBe(0);
    });

    it('rejects DIAMONDS (3 points — below minimum)', () => {
      const result = canDeclareSuit(hand, 'DIAMONDS', MIN_POWER_POINTS);
      expect(result.eligible).toBe(false);
      expect(result.points).toBe(3);
    });

    it('rejects SPADES (0 points)', () => {
      const result = canDeclareSuit(hand, 'SPADES', MIN_POWER_POINTS);
      expect(result.eligible).toBe(false);
      expect(result.points).toBe(0);
    });

    it('rejects a suit not in hand', () => {
      const handNoClubs: Card[] = [
        makeCard('A', 'HEARTS'),
        makeCard('K', 'HEARTS'),
        makeCard('Q', 'HEARTS'),
        makeCard('J', 'HEARTS'),
        makeCard('2', 'SPADES'),
      ];
      const result = canDeclareSuit(handNoClubs, 'CLUBS', MIN_POWER_POINTS);
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('No CLUBS');
    });

    it('allows exactly 4 points', () => {
      const hand4: Card[] = [
        makeCard('A', 'SPADES'), // 4 pts
        makeCard('2', 'HEARTS'),
        makeCard('2', 'DIAMONDS'),
        makeCard('2', 'CLUBS'),
        makeCard('3', 'CLUBS'),
      ];
      const result = canDeclareSuit(hand4, 'SPADES', MIN_POWER_POINTS);
      expect(result.eligible).toBe(true);
      expect(result.points).toBe(4);
    });
  });
});
