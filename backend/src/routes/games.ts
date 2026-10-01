import { Router, Request, Response } from 'express';
import { GameHistoryModel } from '../models/GameHistory';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/games/history - Get current user's game history
router.get('/history', authenticate, async (req: Request, res: Response) => {
  try {
    const history = await GameHistoryModel.find({
      'players.userId': req.user!.userId,
    })
      .sort({ completedAt: -1 })
      .limit(20)
      .lean();

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// GET /api/games/:roomCode - Get specific game details
router.get('/:roomCode', async (req: Request, res: Response) => {
  try {
    const game = await GameHistoryModel.findOne({
      roomCode: req.params.roomCode,
    }).lean();

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json(game);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

export default router;
