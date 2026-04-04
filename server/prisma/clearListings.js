import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🗑️ DELETING ALL MARKETPLACE LISTINGS...');
  const deleted = await prisma.listing.deleteMany({});
  console.log(`✅ DELETED ${deleted.count} LISTINGS SUCCESSFULLY.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
