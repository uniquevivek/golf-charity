import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const charities = [
  {
    name: 'Green Fairways Foundation',
    description: 'Promoting youth development and public course conservation through golf-focused initiatives and coaching.',
    image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=600',
    website: 'https://greenfairways.org',
    featured: true,
  },
  {
    name: 'Cancer Care Alliance',
    description: 'Supporting cancer research, providing financial assistance for patient treatment, and organizing awareness programs.',
    image: 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?auto=format&fit=crop&q=80&w=600',
    website: 'https://cancercarealliance.org',
    featured: true,
  },
  {
    name: 'Save Our Oceans',
    description: 'Dedicated to preserving marine life, cleaning plastic waste from ocean waters, and protecting coral reefs worldwide.',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600',
    website: 'https://saveouroceans.org',
    featured: false,
  },
  {
    name: 'Children\'s Education Fund',
    description: 'Providing school supplies, clean facilities, and modern learning materials to underprivileged children in remote regions.',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600',
    website: 'https://childrensedufund.org',
    featured: true,
  },
  {
    name: 'Global Reforestation Project',
    description: 'Combating climate change by planting native trees, restoring damaged habitats, and empowering local communities.',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=600',
    website: 'https://reforestproject.org',
    featured: false,
  },
];

async function main() {
  console.log('Seeding charities...');
  for (const charity of charities) {
    await prisma.charity.upsert({
      where: { id: '' }, // We use upsert by finding or creating by name
      create: charity,
      update: charity,
    }).catch(async (e) => {
      // If id is not matchable, we just find by name and update, or create
      const existing = await prisma.charity.findFirst({ where: { name: charity.name } });
      if (existing) {
        await prisma.charity.update({ where: { id: existing.id }, data: charity });
      } else {
        await prisma.charity.create({ data: charity });
      }
    });
  }
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
