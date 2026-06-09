import prisma from './config/db';
import dotenv from 'dotenv';

dotenv.config();

async function makeAdmin() {
  const email = process.argv[2];
  if (!email) {
    console.error('Please specify the user email: npm run make-admin <email>');
    process.exit(1);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`User with email "${email}" not found in database. Make sure you register the account on the frontend first so it syncs to the database.`);
      process.exit(1);
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });

    console.log(`Successfully promoted ${updatedUser.email} (${updatedUser.fullName}) to ADMIN!`);
  } catch (error) {
    console.error('Error promoting user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();
