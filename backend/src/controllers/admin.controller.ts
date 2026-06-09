import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import prisma from '../config/db';

// Admin: Get Analytics Dashboard data
export async function getAnalytics(req: AuthenticatedRequest, res: Response) {
  try {
    // 1. Total counts
    const totalUsers = await prisma.user.count();

    const activeSubscriptions = await prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      include: {
        user: {
          select: { donationPercentage: true },
        },
      },
    });

    const activeSubscribersCount = activeSubscriptions.length;

    // Total revenue from active subscriptions
    const totalActiveSubRevenue = activeSubscriptions.reduce((sum, sub) => sum + sub.amount, 0);

    // Total players pool is 50% of the active subscription revenue
    const totalPrizePool = totalActiveSubRevenue * 0.5;

    // Total donations is the sum of (subscription amount * donationPercentage / 100)
    // Wait, the rest goes to platform overhead. Let's make it user's donationPercentage * subscription amount
    // Let's assume the user selected donation percentage is applied on their active subscription amount.
    const totalDonations = activeSubscriptions.reduce((sum, sub) => {
      const pct = sub.user?.donationPercentage || 10;
      return sum + (sub.amount * (pct / 100));
    }, 0);

    const drawStatistics = await prisma.draw.count();

    // 2. Charts Data
    // Group monthly revenue (simplified for demo and basic SQL counts)
    const subscriptions = await prisma.subscription.findMany({
      orderBy: { createdAt: 'asc' },
    });

    const monthlyRevenueMap: { [key: string]: number } = {};
    const subscriptionGrowthMap: { [key: string]: number } = {};
    const donationTrendsMap: { [key: string]: number } = {};

    subscriptions.forEach((sub) => {
      const date = new Date(sub.createdAt);
      const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });

      // Revenue
      monthlyRevenueMap[monthYear] = (monthlyRevenueMap[monthYear] || 0) + sub.amount;

      // Count
      subscriptionGrowthMap[monthYear] = (subscriptionGrowthMap[monthYear] || 0) + 1;

      // Donations (approximate using 10% default or similar)
      donationTrendsMap[monthYear] = (donationTrendsMap[monthYear] || 0) + (sub.amount * 0.1);
    });

    const monthlyRevenue = Object.keys(monthlyRevenueMap).map((key) => ({
      name: key,
      revenue: monthlyRevenueMap[key],
    }));

    const subscriptionGrowth = Object.keys(subscriptionGrowthMap).map((key) => ({
      name: key,
      count: subscriptionGrowthMap[key],
    }));

    const donationTrends = Object.keys(donationTrendsMap).map((key) => ({
      name: key,
      donations: donationTrendsMap[key],
    }));

    res.json({
      cards: {
        totalUsers,
        activeSubscribers: activeSubscribersCount,
        totalPrizePool,
        totalDonations,
        drawStatistics,
      },
      charts: {
        monthlyRevenue,
        subscriptionGrowth,
        donationTrends,
      },
    });
  } catch (error) {
    console.error('Error getting admin analytics:', error);
    res.status(500).json({ error: 'Failed to retrieve analytics data' });
  }
}

// Admin: CRUD Users - Get All
export async function getUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const users = await prisma.user.findMany({
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        selectedCharity: {
          select: { name: true },
        },
        scores: {
          orderBy: [
            { scoreDate: 'desc' },
            { createdAt: 'desc' },
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch (error) {
    console.error('Error getting users list:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
}

// Admin: CRUD Users - Update Role / Details
export async function updateUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { role, fullName, donationPercentage } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        role: role !== undefined ? role : user.role,
        fullName: fullName !== undefined ? fullName : user.fullName,
        donationPercentage: donationPercentage !== undefined ? parseInt(donationPercentage, 10) : user.donationPercentage,
      },
    });

    res.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
}

// Admin: CRUD Users - Delete
export async function deleteUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.id === req.user?.id) {
      return res.status(400).json({ error: 'You cannot delete your own admin account' });
    }

    // Cascade deletes or cleanup related tables manually:
    await prisma.score.deleteMany({ where: { userId: id } });
    await prisma.subscription.deleteMany({ where: { userId: id } });
    await prisma.winner.deleteMany({ where: { userId: id } });

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
}

// Admin: Add score on behalf of a user
export async function adminAddUserScore(req: AuthenticatedRequest, res: Response) {
  try {
    const { userId } = req.params;
    const { score, scoreDate } = req.body;

    const parsedScore = parseInt(score, 10);
    if (isNaN(parsedScore) || parsedScore < 1 || parsedScore > 45) {
      return res.status(400).json({ error: 'Score must be an integer between 1 and 45' });
    }

    const parsedDate = new Date(scoreDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid score date' });
    }

    // Add score
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
        where: { id: { in: excessIds } },
      });
    }

    res.status(201).json({
      message: 'Score card added successfully by admin',
      score: newScore,
    });
  } catch (error) {
    console.error('Error admin adding score:', error);
    res.status(500).json({ error: 'Failed to add user score card' });
  }
}

// Admin: Edit specific score card
export async function adminUpdateUserScore(req: AuthenticatedRequest, res: Response) {
  try {
    const { scoreId } = req.params;
    const { score, scoreDate } = req.body;

    const scoreCard = await prisma.score.findUnique({
      where: { id: scoreId },
    });

    if (!scoreCard) {
      return res.status(404).json({ error: 'Score card not found' });
    }

    const parsedScore = parseInt(score, 10);
    if (isNaN(parsedScore) || parsedScore < 1 || parsedScore > 45) {
      return res.status(400).json({ error: 'Score must be an integer between 1 and 45' });
    }

    const parsedDate = new Date(scoreDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid score date' });
    }

    const updatedScore = await prisma.score.update({
      where: { id: scoreId },
      data: {
        score: parsedScore,
        scoreDate: parsedDate,
      },
    });

    res.json({
      message: 'Score card updated successfully by admin',
      score: updatedScore,
    });
  } catch (error) {
    console.error('Error admin updating score:', error);
    res.status(500).json({ error: 'Failed to update user score card' });
  }
}

// Admin: Delete specific score card
export async function adminDeleteUserScore(req: AuthenticatedRequest, res: Response) {
  try {
    const { scoreId } = req.params;

    const scoreCard = await prisma.score.findUnique({
      where: { id: scoreId },
    });

    if (!scoreCard) {
      return res.status(404).json({ error: 'Score card not found' });
    }

    await prisma.score.delete({
      where: { id: scoreId },
    });

    res.json({ message: 'Score card deleted successfully by admin' });
  } catch (error) {
    console.error('Error admin deleting score:', error);
    res.status(500).json({ error: 'Failed to delete score card' });
  }
}

// Admin: Override user subscription details
export async function adminUpdateUserSubscription(req: AuthenticatedRequest, res: Response) {
  try {
    const { userId } = req.params;
    const { plan, status, amount, endDate } = req.body;

    if (plan !== 'MONTHLY' && plan !== 'YEARLY') {
      return res.status(400).json({ error: 'Subscription plan must be MONTHLY or YEARLY' });
    }

    if (status !== 'ACTIVE' && status !== 'EXPIRED' && status !== 'CANCELLED') {
      return res.status(400).json({ error: 'Subscription status must be ACTIVE, EXPIRED, or CANCELLED' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({ error: 'Amount must be a non-negative number' });
    }

    const parsedEndDate = new Date(endDate);
    if (isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({ error: 'Invalid subscription end date' });
    }

    // Find any existing active/expired/cancelled subscription for user
    const existingSub = await prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    let subscription;
    if (existingSub) {
      subscription = await prisma.subscription.update({
        where: { id: existingSub.id },
        data: {
          plan,
          status,
          amount: parsedAmount,
          endDate: parsedEndDate,
        },
      });
    } else {
      // Create new override subscription
      subscription = await prisma.subscription.create({
        data: {
          userId,
          plan,
          status,
          amount: parsedAmount,
          stripeCustomerId: 'cus_admin_override',
          stripeSubscriptionId: 'sub_admin_override_' + Math.random().toString(36).substring(7),
          startDate: new Date(),
          endDate: parsedEndDate,
        },
      });
    }

    res.json({
      message: 'User subscription overridden successfully by admin',
      subscription,
    });
  } catch (error) {
    console.error('Error admin overriding subscription:', error);
    res.status(500).json({ error: 'Failed to override user subscription parameters' });
  }
}
