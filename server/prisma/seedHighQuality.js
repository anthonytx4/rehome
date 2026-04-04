import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({ where: { email: 'admin@rehome.world' } });
  if (!admin) {
    throw new Error('Admin user not found. Please seed the admin first.');
  }

  console.log('🌱 SEEDING HIGH-QUALITY MARKETPLACE LISTINGS...');

  await prisma.listing.createMany({
    data: [
      // PETS
      {
        userId: admin.id,
        title: 'Show Quality Golden Retriever Puppy',
        petName: 'Cooper',
        species: 'Dog',
        breed: 'Golden Retriever',
        category: 'pets',
        age: '8 Weeks',
        gender: 'Male',
        size: 'Medium',
        location: 'Nashville, TN',
        price: 1400,
        description: 'Breathtaking 8-week-old Golden Retriever puppy from a championship-pedigree line. Fully socialized, crate trained at a basic level, and comes with a pristine health record and first round of vaccinations. This puppy has a remarkably calm temperament and incredible cream-colored thick coat. We prioritize families looking for a lifelong devoted companion.',
        images: JSON.stringify(['/seed/golden_retriever.png']),
        status: 'available',
      },
      {
        userId: admin.id,
        title: 'Majestic Silver Maine Coon Cat',
        petName: 'Luna',
        species: 'Cat',
        breed: 'Maine Coon',
        category: 'pets',
        age: '2 Years',
        gender: 'Female',
        size: 'Large',
        location: 'Portland, OR',
        price: 1800,
        description: 'Regal silver Maine Coon with striking golden eyes and a massive, luxurious coat. Extremely affectionate "gentle giant" personality, typical of the breed. She is fully vaccinated, spayed, and microchipped. Perfect for a spacious indoor home where she can be part of the daily family activity.',
        images: JSON.stringify(['/seed/maine_coon.png']),
        status: 'available',
      },
      {
        userId: admin.id,
        title: 'Hand-Raised African Grey Parrot',
        petName: 'Echo',
        species: 'Bird',
        breed: 'African Grey',
        category: 'pets',
        age: '5 Years',
        gender: 'Female',
        size: 'Medium',
        location: 'Miami, FL',
        price: 2500,
        description: 'Incredibly intelligent and articulate 5-year-old African Grey parrot. Hand-raised and highly socialized with a vocabulary of over 100 words. Echo responds well to complex commands and is accustomed to a varied organic diet. Seeking an experienced owner who can provide the mental stimulation this species requires.',
        images: JSON.stringify(['/seed/african_grey.png']),
        status: 'available',
      },
      // LIVESTOCK
      {
        userId: admin.id,
        title: 'High-Output Jersey Dairy Cow',
        petName: 'Daisy',
        species: 'Cattle',
        breed: 'Jersey',
        category: 'livestock',
        age: '3 Years',
        gender: 'Female',
        size: 'Extra Large',
        location: 'Madison, WI',
        price: 3200,
        description: 'Elite 3-year-old Jersey cow in peak lactation. Producing high butterfat milk perfect for artisanal cheese or creamery operations. She has a docile temperament, lead trained, and comes with a 4-generation pedigree. Recently vet-certified healthy and ready for integration into your herd.',
        images: JSON.stringify(['/seed/jersey_cow.png']),
        status: 'available',
      },
      {
        userId: admin.id,
        title: 'Show-Grade Boer Breeding Buck',
        petName: 'Thor',
        species: 'Goat',
        breed: 'Boer',
        category: 'livestock',
        age: '18 Months',
        gender: 'Male',
        size: 'Large',
        location: 'Austin, TX',
        price: 950,
        description: 'Substantial 18-month-old Boer goat with a pure white body and traditional deep mahogany head. Excellent conformation and sturdy build, ideal for a breeding program looking to improve meat yield and aesthetic standards. Quiet temperament and easily handled.',
        images: JSON.stringify(['/seed/boer_goat.png']),
        status: 'available',
      },
      {
        userId: admin.id,
        title: 'Premium Fiber-Grade White Alpaca',
        petName: 'Casper',
        species: 'Alpaca',
        breed: 'Huacaya',
        category: 'livestock',
        age: '4 Years',
        gender: 'Male',
        size: 'Large',
        location: 'Boulder, CO',
        price: 2200,
        description: 'Extraordinary white Huacaya alpaca with exceptionally soft, dense fiber. Casper has a calm, curious disposition and is used to lead-walking for shows. He has been shorn once a year with top-tier micron counts recorded. A perfect addition to a specialty fiber farm.',
        images: JSON.stringify(['/seed/alpaca.png']),
        status: 'available',
      },
      // SUPPLIES
      {
        userId: admin.id,
        title: 'Next-Gen Smart AI Pet Feeder',
        petName: 'SmartFeeder Pro',
        species: 'Utility',
        breed: 'Universal',
        category: 'supplies',
        age: 'New',
        gender: 'N/A',
        size: 'Medium',
        location: 'Rehome Depot (Shipping)',
        price: 149,
        description: 'State-of-the-art automatic feeder with 1080p camera and two-way audio. Schedule precise portions via your smartphone and use AI face-recognition to ensure the right pet is eating. High-capacity 4L tank and dishwasher-safe stainless steel tray for maximum hygiene.',
        images: JSON.stringify(['/seed/smart_feeder.png']),
        status: 'available',
      },
      {
        userId: admin.id,
        title: 'Victorian Ornate Wrought Iron Cage',
        petName: 'Royal Aviary',
        species: 'Habitat',
        breed: 'Large Birds',
        category: 'supplies',
        age: 'New',
        gender: 'N/A',
        size: 'X-Large',
        location: 'Rehome Depot (Shipping)',
        price: 450,
        description: 'Luxury bird cage on a pedestal base, featuring intricate scrollwork and a durable white powder-coated finish. Spacious design suitable for Cockatoos or Amazons, including natural wood perches, stainless steel food bowls, and a pull-out cleaning tray.',
        images: JSON.stringify(['/seed/bird_cage.png']),
        status: 'available',
      },
      {
        userId: admin.id,
        title: 'Orthopedic Luxe Memory Foam Bed',
        petName: 'CloudRest',
        species: 'Bedding',
        breed: 'Large Breeds',
        category: 'supplies',
        age: 'New',
        gender: 'N/A',
        size: 'Large',
        location: 'Rehome Depot (Shipping)',
        price: 120,
        description: 'Premium cooling memory foam dog bed designed for senior pets or heavy breeds. Features a machine-washable waterproof liner and an ultra-soft non-slip outer cover. Provides maximum relief for joints and orthopedic support for long-standing comfort.',
        images: JSON.stringify(['/seed/dog_bed.png']),
        status: 'available',
      }
    ]
  });

  console.log('✨ 9 HIGH-QUALITY LISTINGS SEEDED SUCCESSFULLY.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
