import prisma from '../config/db';
import { calculatePrizePool } from './prizePool.service';

/**
 * Generates 5 unique random or algorithmic draw numbers between 1 and 45.
 */
export async function generateDrawNumbers(mode: 'RANDOM' | 'MOST_FREQUENT' | 'LEAST_FREQUENT'): Promise<number[]> {
  if (mode === 'RANDOM') {
    const numbers: Set<number> = new Set();
    while (numbers.size < 5) {
      const num = Math.floor(Math.random() * 45) + 1;
      numbers.add(num);
    }
    return Array.from(numbers).sort((a, b) => a - b);
  }

  // Statistical modes (MOST_FREQUENT or LEAST_FREQUENT)
  // Fetch all scores
  const allScores = await prisma.score.findMany({
    select: { score: true },
  });

  const frequencies: { [key: number]: number } = {};
  for (let i = 1; i <= 45; i++) {
    frequencies[i] = 0;
  }

  allScores.forEach((s) => {
    if (frequencies[s.score] !== undefined) {
      frequencies[s.score]++;
    }
  });

  const sortedNumbers = Object.keys(frequencies)
    .map((numStr) => ({
      num: parseInt(numStr, 10),
      count: frequencies[parseInt(numStr, 10)],
    }));

  if (mode === 'MOST_FREQUENT') {
    // Sort descending by count, then randomly for ties
    sortedNumbers.sort((a, b) => b.count - a.count || Math.random() - 0.5);
  } else {
    // Sort ascending by count, then randomly for ties
    sortedNumbers.sort((a, b) => a.count - b.count || Math.random() - 0.5);
  }

  // Take the first 5 numbers
  return sortedNumbers.slice(0, 5).map((x) => x.num).sort((a, b) => a - b);
}

/**
 * Runs a simulation of a draw for a specific month and year without writing to the database.
 */
export async function simulateDraw(month: number, year: number, drawNumbers: number[]) {
  // 1. Fetch active subscribers
  const subscribers = await prisma.user.findMany({
    where: {
      subscriptions: {
        some: {
          status: 'ACTIVE',
        },
      },
    },
    include: {
      scores: {
        orderBy: [
          { scoreDate: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 5,
      },
    },
  });

  // 2. Fetch prize pool breakdown
  const pool = await calculatePrizePool(month, year);

  const match5Winners: any[] = [];
  const match4Winners: any[] = [];
  const match3Winners: any[] = [];

  // 3. Match user scores with draw numbers
  for (const sub of subscribers) {
    const userScores = sub.scores.map((s) => s.score);
    // Find intersection
    const matches = userScores.filter((score) => drawNumbers.includes(score));
    const matchCount = matches.length;

    const winnerInfo = {
      userId: sub.id,
      fullName: sub.fullName,
      email: sub.email,
      scores: userScores,
      matches,
      matchCount,
    };

    if (matchCount === 5) {
      match5Winners.push(winnerInfo);
    } else if (matchCount === 4) {
      match4Winners.push(winnerInfo);
    } else if (matchCount === 3) {
      match3Winners.push(winnerInfo);
    }
  }

  // 4. Calculate individual prize payouts
  const prize5 = match5Winners.length > 0 ? pool.finalMatch5Pool / match5Winners.length : 0;
  const prize4 = match4Winners.length > 0 ? pool.match4Pool / match4Winners.length : 0;
  const prize3 = match3Winners.length > 0 ? pool.match3Pool / match3Winners.length : 0;

  return {
    drawNumbers,
    month,
    year,
    prizePool: pool,
    stats: {
      totalParticipants: subscribers.length,
      match5Count: match5Winners.length,
      match4Count: match4Winners.length,
      match3Count: match3Winners.length,
    },
    payouts: {
      match5PrizeEach: prize5,
      match4PrizeEach: prize4,
      match3PrizeEach: prize3,
    },
    winners: [
      ...match5Winners.map((w) => ({ ...w, prizeAmount: prize5 })),
      ...match4Winners.map((w) => ({ ...w, prizeAmount: prize4 })),
      ...match3Winners.map((w) => ({ ...w, prizeAmount: prize3 })),
    ],
  };
}

/**
 * Executes a draw, creates the database record, and writes winners to the Winner table.
 */
export async function executeAndSaveDraw(month: number, year: number, drawNumbers: number[], published: boolean = false) {
  // Check if a draw already exists for this month/year
  const existingDraw = await prisma.draw.findFirst({
    where: { month, year },
  });

  if (existingDraw) {
    throw new Error(`Draw already exists for ${month}/${year}`);
  }

  // Run the simulation to get the winners list
  const sim = await simulateDraw(month, year, drawNumbers);

  // Determine the draw type based on the highest match category achieved in this draw
  let drawType: 'THREE_MATCH' | 'FOUR_MATCH' | 'FIVE_MATCH' = 'FIVE_MATCH';
  if (sim.stats.match5Count > 0) {
    drawType = 'FIVE_MATCH';
  } else if (sim.stats.match4Count > 0) {
    drawType = 'FOUR_MATCH';
  } else if (sim.stats.match3Count > 0) {
    drawType = 'THREE_MATCH';
  }

  // Create the draw
  const draw = await prisma.draw.create({
    data: {
      month,
      year,
      drawNumbers,
      published,
      drawType,
    },
  });

  // Create winner records for users with 3, 4, or 5 matches
  const winnerData = sim.winners.map((w) => ({
    userId: w.userId,
    drawId: draw.id,
    matchCount: w.matchCount,
    prizeAmount: w.prizeAmount,
    status: 'PENDING' as const,
  }));

  if (winnerData.length > 0) {
    await prisma.winner.createMany({
      data: winnerData,
    });
  }

  // Fetch created draw with winners
  const savedDraw = await prisma.draw.findUnique({
    where: { id: draw.id },
    include: {
      winners: {
        include: {
          user: {
            select: { fullName: true, email: true },
          },
        },
      },
    },
  });

  return savedDraw;
}
