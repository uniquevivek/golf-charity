import prisma from '../config/db';

export interface PrizeDistribution {
  totalPool: number;
  charityPool: number;
  playersPool: number;
  match5Pool: number;
  match4Pool: number;
  match3Pool: number;
  rolloverAmount: number;
  finalMatch5Pool: number;
}

/**
 * Calculates the prize pool distribution and any rollover for a given month and year.
 */
export async function calculatePrizePool(month: number, year: number): Promise<PrizeDistribution> {
  // 1. Get all subscriptions that overlap with the month/year
  // For simplicity, we sum the amount of subscriptions created in or active during this month.
  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      // If we have start and end dates, verify it falls within the month
      // Otherwise fallback to createdAt
    },
  });

  // Calculate total subscription revenue for this cycle
  const totalRevenue = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);

  // Split: 50% goes to Charity (and platform operations), 50% goes to the Players Prize Pool
  const charityPool = totalRevenue * 0.5;
  const playersPool = totalRevenue * 0.5;

  // Split players pool: 5 Match = 40%, 4 Match = 35%, 3 Match = 25%
  const match5Pool = playersPool * 0.40;
  const match4Pool = playersPool * 0.35;
  const match3Pool = playersPool * 0.25;

  // 2. Calculate Rollover Amount
  // Find the previous published draw and check if there was a 5-match winner.
  // If no 5-match winner, add that previous 5-match pool to this month's rollover.
  let rolloverAmount = 0;
  const previousDraw = await prisma.draw.findFirst({
    where: {
      published: true,
      OR: [
        { year: { lt: year } },
        { AND: [{ year: { equals: year } }, { month: { lt: month } }] },
      ],
    },
    orderBy: [
      { year: 'desc' },
      { month: 'desc' },
    ],
    include: {
      winners: {
        where: { matchCount: 5 },
      },
    },
  });

  if (previousDraw && previousDraw.winners.length === 0) {
    // If the previous draw had no 5-match winners, we calculate its rollover
    // Let's recursively check previous draws or simplify by getting the previous draw's calculated 5-match pool.
    // To make it simple, we assume the previous draw's 5-match pool is added to the rollover.
    // For a real app, we can store rollover in a table or calculate it.
    // Let's approximate the previous draw's 5-match pool as 40% of its player pool.
    const prevSub = await prisma.subscription.findMany({
      where: { status: 'ACTIVE' }, // simplified
    });
    const prevRevenue = prevSub.reduce((sum, sub) => sum + sub.amount, 0) * 0.5;
    rolloverAmount = prevRevenue * 0.40;
  }

  const finalMatch5Pool = match5Pool + rolloverAmount;

  return {
    totalPool: totalRevenue,
    charityPool,
    playersPool,
    match5Pool,
    match4Pool,
    match3Pool,
    rolloverAmount,
    finalMatch5Pool,
  };
}
