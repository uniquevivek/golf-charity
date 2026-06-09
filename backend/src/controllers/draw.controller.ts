import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import * as drawService from '../services/draw.service';
import prisma from '../config/db';

// Public: Get all published draws
export async function getPublishedDraws(req: Request, res: Response) {
  try {
    const draws = await prisma.draw.findMany({
      where: { published: true },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
      include: {
        winners: {
          select: { id: true, matchCount: true, prizeAmount: true },
        },
      },
    });
    res.json(draws);
  } catch (error) {
    console.error('Error fetching published draws:', error);
    res.status(500).json({ error: 'Failed to retrieve draws' });
  }
}

// Public/Auth: Get draw detail by ID
export async function getDrawById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const draw = await prisma.draw.findUnique({
      where: { id },
      include: {
        winners: {
          include: {
            user: {
              select: { fullName: true, email: true, avatar: true },
            },
          },
        },
      },
    });

    if (!draw) {
      return res.status(404).json({ error: 'Draw not found' });
    }

    // Check if published (if not admin, deny access)
    const authReq = req as AuthenticatedRequest;
    if (!draw.published && authReq.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied: Draw is not published' });
    }

    res.json(draw);
  } catch (error) {
    console.error('Error fetching draw details:', error);
    res.status(500).json({ error: 'Failed to retrieve draw details' });
  }
}

// Admin: Generate draw numbers preview
export async function generateDrawNumbers(req: AuthenticatedRequest, res: Response) {
  try {
    const { mode } = req.body; // RANDOM | MOST_FREQUENT | LEAST_FREQUENT
    if (mode !== 'RANDOM' && mode !== 'MOST_FREQUENT' && mode !== 'LEAST_FREQUENT') {
      return res.status(400).json({ error: 'Invalid mode specified. Use RANDOM, MOST_FREQUENT, or LEAST_FREQUENT.' });
    }

    const numbers = await drawService.generateDrawNumbers(mode);
    res.json({ mode, drawNumbers: numbers });
  } catch (error) {
    console.error('Error generating draw numbers:', error);
    res.status(500).json({ error: 'Failed to generate draw numbers' });
  }
}

// Admin: Simulate draw
export async function simulateDraw(req: AuthenticatedRequest, res: Response) {
  try {
    const { month, year, drawNumbers } = req.body;

    const parsedMonth = parseInt(month, 10);
    const parsedYear = parseInt(year, 10);

    if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      return res.status(400).json({ error: 'Month must be between 1 and 12' });
    }
    if (isNaN(parsedYear) || parsedYear < 2000) {
      return res.status(400).json({ error: 'Year must be a valid four-digit year' });
    }

    if (!Array.isArray(drawNumbers) || drawNumbers.length !== 5) {
      return res.status(400).json({ error: 'drawNumbers must be an array of 5 integers' });
    }

    const isAllValid = drawNumbers.every((n) => typeof n === 'number' && n >= 1 && n <= 45);
    if (!isAllValid) {
      return res.status(400).json({ error: 'Each draw number must be an integer between 1 and 45' });
    }

    const simulation = await drawService.simulateDraw(parsedMonth, parsedYear, drawNumbers);
    res.json(simulation);
  } catch (error) {
    console.error('Error simulating draw:', error);
    res.status(500).json({ error: 'Failed to simulate draw' });
  }
}

// Admin: Run / Execute draw (write to DB)
export async function executeDraw(req: AuthenticatedRequest, res: Response) {
  try {
    const { month, year, drawNumbers, published } = req.body;

    const parsedMonth = parseInt(month, 10);
    const parsedYear = parseInt(year, 10);

    if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      return res.status(400).json({ error: 'Month must be between 1 and 12' });
    }
    if (isNaN(parsedYear) || parsedYear < 2000) {
      return res.status(400).json({ error: 'Year must be a valid four-digit year' });
    }

    if (!Array.isArray(drawNumbers) || drawNumbers.length !== 5) {
      return res.status(400).json({ error: 'drawNumbers must be an array of 5 integers' });
    }

    const isAllValid = drawNumbers.every((n) => typeof n === 'number' && n >= 1 && n <= 45);
    if (!isAllValid) {
      return res.status(400).json({ error: 'Each draw number must be an integer between 1 and 45' });
    }

    // Check if draw already exists
    const existing = await prisma.draw.findFirst({
      where: { month: parsedMonth, year: parsedYear },
    });

    if (existing) {
      return res.status(400).json({ error: `A draw has already been executed for ${parsedMonth}/${parsedYear}` });
    }

    const savedDraw = await drawService.executeAndSaveDraw(parsedMonth, parsedYear, drawNumbers, !!published);
    res.status(201).json({
      message: 'Draw executed and recorded successfully',
      draw: savedDraw,
    });
  } catch (error: any) {
    console.error('Error executing draw:', error);
    res.status(500).json({ error: error.message || 'Failed to execute draw' });
  }
}

// Admin: Publish draw
export async function publishDraw(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const draw = await prisma.draw.findUnique({
      where: { id },
    });

    if (!draw) {
      return res.status(404).json({ error: 'Draw not found' });
    }

    const updatedDraw = await prisma.draw.update({
      where: { id },
      data: { published: true },
    });

    // Alert all active subscribers
    try {
      const activeUsers = await prisma.user.findMany({
        where: {
          subscriptions: {
            some: { status: 'ACTIVE' }
          }
        },
        select: { email: true }
      });
      const emails = activeUsers.map((u) => u.email);
      if (emails.length > 0) {
        const emailService = require('../services/email.service');
        emailService.sendDrawPublishedAlert(emails, {
          month: updatedDraw.month,
          year: updatedDraw.year,
          numbers: updatedDraw.drawNumbers
        }).catch((err: any) => console.error('Failed to send draw publish email alert:', err));
      }
    } catch (emailErr) {
      console.error('Error fetching subscribers for email alerts:', emailErr);
    }

    res.json({
      message: 'Draw published successfully',
      draw: updatedDraw,
    });
  } catch (error) {
    console.error('Error publishing draw:', error);
    res.status(500).json({ error: 'Failed to publish draw' });
  }
}
