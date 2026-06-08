import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { uploadToCloudinary } from '../services/cloudinary.service';
import prisma from '../config/db';

// User: Get my winnings
export async function getMyWinnings(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const winnings = await prisma.winner.findMany({
      where: { userId },
      include: {
        draw: {
          select: {
            month: true,
            year: true,
            drawNumbers: true,
            published: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(winnings);
  } catch (error) {
    console.error('Error getting user winnings:', error);
    res.status(500).json({ error: 'Failed to retrieve winnings' });
  }
}

// User: Upload winner proof slip
export async function uploadWinnerProof(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params; // Winner record ID
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No proof image uploaded' });
    }

    const winnerRecord = await prisma.winner.findUnique({
      where: { id },
    });

    if (!winnerRecord) {
      return res.status(404).json({ error: 'Winning record not found' });
    }

    if (winnerRecord.userId !== userId) {
      return res.status(403).json({ error: 'Access denied: You do not own this record' });
    }

    // Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(file.buffer);

    // Update winner record status to PENDING and save image URL
    const updatedWinner = await prisma.winner.update({
      where: { id },
      data: {
        proofImage: imageUrl,
        status: 'PENDING',
      },
    });

    res.json({
      message: 'Proof image uploaded successfully and is pending admin review',
      winner: updatedWinner,
    });
  } catch (error) {
    console.error('Error uploading winning proof:', error);
    res.status(500).json({ error: 'Failed to upload winning proof' });
  }
}

// Admin: Get all winners for audit
export async function getAllWinners(req: AuthenticatedRequest, res: Response) {
  try {
    const { status } = req.query;

    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }

    const winners = await prisma.winner.findMany({
      where: whereClause,
      include: {
        user: {
          select: { fullName: true, email: true },
        },
        draw: {
          select: { month: true, year: true, drawNumbers: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(winners);
  } catch (error) {
    console.error('Error getting all winners:', error);
    res.status(500).json({ error: 'Failed to retrieve winners' });
  }
}

// Admin: Approve proof
export async function approveWinner(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const winner = await prisma.winner.findUnique({
      where: { id },
    });

    if (!winner) {
      return res.status(404).json({ error: 'Winner record not found' });
    }

    const updatedWinner = await prisma.winner.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    res.json({
      message: 'Winner proof approved successfully',
      winner: updatedWinner,
    });
  } catch (error) {
    console.error('Error approving winner:', error);
    res.status(500).json({ error: 'Failed to approve winner' });
  }
}

// Admin: Reject proof
export async function rejectWinner(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body; // In a real app we might log the reason

    const winner = await prisma.winner.findUnique({
      where: { id },
    });

    if (!winner) {
      return res.status(404).json({ error: 'Winner record not found' });
    }

    const updatedWinner = await prisma.winner.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    res.json({
      message: 'Winner proof rejected',
      winner: updatedWinner,
    });
  } catch (error) {
    console.error('Error rejecting winner:', error);
    res.status(500).json({ error: 'Failed to reject winner' });
  }
}

// Admin: Mark as paid
export async function payWinner(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const winner = await prisma.winner.findUnique({
      where: { id },
    });

    if (!winner) {
      return res.status(404).json({ error: 'Winner record not found' });
    }

    if (winner.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Winner must be APPROVED before marking as PAID' });
    }

    const updatedWinner = await prisma.winner.update({
      where: { id },
      data: { status: 'PAID' },
    });

    res.json({
      message: 'Winner marked as paid',
      winner: updatedWinner,
    });
  } catch (error) {
    console.error('Error marking winner as paid:', error);
    res.status(500).json({ error: 'Failed to mark winner as paid' });
  }
}
