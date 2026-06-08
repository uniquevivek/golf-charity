import prisma from './config/db';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('Testing connection to PostgreSQL database...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ':****@'));

  try {
    const users = await prisma.user.findMany();
    console.log('Successfully connected to database!');
    console.log(`Found ${users.length} users in the database:`, users);
    
    const charities = await prisma.charity.findMany();
    console.log(`Found ${charities.length} charities in the database.`);
  } catch (error) {
    console.error('Database connection or query failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
