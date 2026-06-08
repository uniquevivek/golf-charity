import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import prisma from '../config/db';

// Get user scores (latest first)
export async function getScores(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const scores = await prisma.score.findMany({
      where: { userId },
      orderBy: [
        { scoreDate: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json(scores);
  } catch (error) {
    console.error('Error getting scores:', error);
    res.status(500).json({ error: 'Failed to retrieve scores' });
  }
}

// Add a score (validates 1-45, stores latest 5, deletes oldest if 6th added)
export async function addScore(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { score, scoreDate } = req.body;

    // Validate score is a number between 1 and 45
    const parsedScore = parseInt(score, 10);
    if (isNaN(parsedScore) || parsedScore < 1 || parsedScore > 45) {
      return res.status(400).json({ error: 'Score must be an integer between 1 and 45' });
    }

    // Validate scoreDate
    const parsedDate = new Date(scoreDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid score date' });
    }

    // Check if the user has an active subscription.
    // "Users without active subscription: Cannot access score system, Cannot enter draws"
    const activeSub = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });

    if (!activeSub) {
      return res.status(403).json({ error: 'Active subscription required to manage scores' });
    }

    // Add new score
    const newScore = await prisma.score.create({
      data: {
        userId,
        score: parsedScore,
        scoreDate: parsedDate,
      },
    });

    // Enforce 5-score limit
    const allScores = await prisma.score.findMany({
      where: { userId },
      orderBy: [
        { scoreDate: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    if (allScores.length > 5) {
      const excessScores = allScores.slice(5);
      const excessIds = excessScores.map((s) => s.id);
      
      await prisma.score.deleteMany({
        where: {
          id: { in: excessIds },
        },
      });
    }

    // Fetch final active scores to return
    const finalScores = await prisma.score.findMany({
      where: { userId },
      orderBy: [
        { scoreDate: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.status(210).json({
      message: 'Score added successfully',
      scores: finalScores,
    });
  } catch (error) {
    console.error('Error adding score:', error);
    res.status(500).json({ error: 'Failed to add score' });
  }
}

// Delete score by ID
export async function deleteScore(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;

    // Check ownership of score
    const score = await prisma.score.findUnique({
      where: { id },
    });

    if (!score) {
      return res.status(404).json({ error: 'Score not found' });
    }

    if (score.userId !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied: You do not own this score' });
    }

    await prisma.score.delete({
      where: { id },
    });

    res.json({ message: 'Score deleted successfully' });
  } catch (error) {
    console.error('Error deleting score:', error);
    res.status(500).json({ error: 'Failed to delete score' });
  }
}
