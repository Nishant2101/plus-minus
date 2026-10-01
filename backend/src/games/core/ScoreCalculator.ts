import { PlayerRoundScore, PlayerBid, Trick } from '@plus-minus/shared';

// ============================================================
// SCORING
// TODO: Confirm exact Plus Minus scoring formula with game owner
// ============================================================

/**
 * Calculates the round score for a player.
 *
 * Rules (TODO: confirm with game owner):
 * - If actual tricks >= declared: award actual tricks won as positive score
 * - If actual tricks < declared: subtract declared amount from total (negative)
 *
 * Current formula:
 *   success: +actual (number of tricks won)
 *   failure: -declared (lose what you promised)
 *
 * TODO: Confirm whether bonus points, exact multipliers, or other
 * formulas are used in Plus Minus scoring.
 */
export function calculateRoundScore(declared: number, actual: number): number {
  if (actual >= declared) {
    // Success: earn points equal to tricks won
    // TODO: Confirm exact success scoring formula
    return actual;
  } else {
    // Failure: lose your declared amount
    // TODO: Confirm exact failure penalty formula
    return -declared;
  }
}

/**
 * Calculates all players' round scores and updates their totals.
 */
export function calculateAllRoundScores(
  bids: PlayerBid[],
  tricksWonByPlayer: Map<string, number>,
  previousTotals: Map<string, number>,
): PlayerRoundScore[] {
  return bids.map((bid) => {
    const actual = tricksWonByPlayer.get(bid.playerId) ?? 0;
    const roundScore = calculateRoundScore(bid.declaredPoints, actual);
    const previousTotal = previousTotals.get(bid.playerId) ?? 0;

    return {
      playerId: bid.playerId,
      declared: bid.declaredPoints,
      actual,
      roundScore,
      totalScore: previousTotal + roundScore,
    };
  });
}

/**
 * Counts tricks won by each player from completed tricks.
 */
export function countTricksWon(tricks: Trick[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const trick of tricks) {
    if (trick.winnerId) {
      counts.set(trick.winnerId, (counts.get(trick.winnerId) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * Determines if the game-ending condition has been reached.
 * TODO: Confirm exact game-ending rule with game owner
 * Current rule: game ends when any player reaches or exceeds the target score
 * AND the current round is complete.
 */
export function isGameOver(
  scores: Map<string, number>,
  targetScore: number,
): boolean {
  for (const score of scores.values()) {
    if (score >= targetScore) return true;
  }
  return false;
}

/**
 * Determines the game winner after game-over condition.
 * TODO: Confirm tiebreaker rules with game owner
 * Current rule: player with the highest score wins.
 */
export function determineGameWinner(scores: Map<string, number>): string {
  let winnerId = '';
  let highestScore = -Infinity;

  for (const [playerId, score] of scores.entries()) {
    if (score > highestScore) {
      highestScore = score;
      winnerId = playerId;
    }
  }

  return winnerId;
}
