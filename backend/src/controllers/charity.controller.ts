import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import prisma from '../config/db';

// Public: Get all charities with search & filter
export async function getCharities(req: Request, res: Response) {
  try {
    const { search, featured } = req.query;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    if (featured !== undefined) {
      whereClause.featured = featured === 'true';
    }

    const charities = await prisma.charity.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });

    res.json(charities);
  } catch (error) {
    console.error('Error getting charities:', error);
    res.status(500).json({ error: 'Failed to retrieve charities' });
  }
}

// Public: Get charity by ID
export async function getCharityById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const charity = await prisma.charity.findUnique({
      where: { id },
    });

    if (!charity) {
      return res.status(404).json({ error: 'Charity not found' });
    }

    res.json(charity);
  } catch (error) {
    console.error('Error getting charity details:', error);
    res.status(500).json({ error: 'Failed to retrieve charity details' });
  }
}

// User: Select charity
export async function selectCharity(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { charityId } = req.body;

    // Verify charity exists
    if (charityId) {
      const charity = await prisma.charity.findUnique({
        where: { id: charityId },
      });
      if (!charity) {
        return res.status(404).json({ error: 'Selected charity not found' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { selectedCharityId: charityId || null },
      include: { selectedCharity: true },
    });

    res.json({
      message: 'Charity preference updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error selecting charity:', error);
    res.status(500).json({ error: 'Failed to update charity preference' });
  }
}

// User: Update contribution percentage (minimum 10%)
export async function updateDonationPercentage(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { donationPercentage } = req.body;
    const percentage = parseInt(donationPercentage, 10);

    if (isNaN(percentage) || percentage < 10 || percentage > 100) {
      return res.status(400).json({ error: 'Donation percentage must be between 10% and 100%' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { donationPercentage: percentage },
    });

    res.json({
      message: 'Donation percentage updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating donation percentage:', error);
    res.status(500).json({ error: 'Failed to update donation percentage' });
  }
}

// Admin: Create charity
export async function createCharity(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, description, image, website, featured } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }

    const charity = await prisma.charity.create({
      data: {
        name,
        description,
        image: image || undefined,
        website: website || null,
        featured: !!featured,
      },
    });

    res.status(201).json({
      message: 'Charity created successfully',
      charity,
    });
  } catch (error) {
    console.error('Error creating charity:', error);
    res.status(500).json({ error: 'Failed to create charity' });
  }
}

// Admin: Update charity
export async function updateCharity(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, image, website, featured } = req.body;

    const charity = await prisma.charity.findUnique({
      where: { id },
    });

    if (!charity) {
      return res.status(404).json({ error: 'Charity not found' });
    }

    const updatedCharity = await prisma.charity.update({
      where: { id },
      data: {
        name: name !== undefined ? name : charity.name,
        description: description !== undefined ? description : charity.description,
        image: image !== undefined ? image : charity.image,
        website: website !== undefined ? website : charity.website,
        featured: featured !== undefined ? !!featured : charity.featured,
      },
    });

    res.json({
      message: 'Charity updated successfully',
      charity: updatedCharity,
    });
  } catch (error) {
    console.error('Error updating charity:', error);
    res.status(500).json({ error: 'Failed to update charity' });
  }
}

// Admin: Delete charity
export async function deleteCharity(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const charity = await prisma.charity.findUnique({
      where: { id },
    });

    if (!charity) {
      return res.status(404).json({ error: 'Charity not found' });
    }

    // Set users selected charity to null before deleting the charity
    await prisma.user.updateMany({
      where: { selectedCharityId: id },
      data: { selectedCharityId: null },
    });

    await prisma.charity.delete({
      where: { id },
    });

    res.json({ message: 'Charity deleted successfully' });
  } catch (error) {
    console.error('Error deleting charity:', error);
    res.status(500).json({ error: 'Failed to delete charity' });
  }
}
