import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.review.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.message.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash('password123', 12);

  // Create users
  const sarah = await prisma.user.create({
    data: { name: 'Sarah Mitchell', email: 'sarah@example.com', password, location: 'Austin, TX', bio: 'Verified Golden Retriever breeder with 8 years of experience.', isVerifiedBreeder: true }
  });
  const james = await prisma.user.create({
    data: { name: 'James Cooper', email: 'james@example.com', password, location: 'Seattle, WA', bio: 'Cat lover and rescue volunteer.', isVerifiedBreeder: true }
  });
  const maria = await prisma.user.create({
    data: { name: 'Maria Santos', email: 'maria@example.com', password, location: 'Miami, FL', bio: 'Exotic bird specialist and avian vet tech.' }
  });
  const admin = await prisma.user.create({
    data: { name: 'Admin', email: 'admin@rehome.world', password, location: 'New York, NY', bio: 'Rehome Marketplace Administrator', isVerifiedBreeder: true }
  });

  // Create listings
  const listings = await Promise.all([
    prisma.listing.create({
      data: {
        title: 'Cooper — Golden Retriever', petName: 'Cooper', species: 'Dog', breed: 'Golden Retriever',
        age: '3 Months', gender: 'Male', size: 'Large', price: 450, location: 'Austin, TX',
        vaccinated: true, neutered: false,
        description: 'Cooper is a playful, healthy Golden Retriever puppy from champion bloodlines. He is up to date on all vaccinations, microchipped, and comes with AKC registration papers. Cooper loves water, fetch, and belly rubs. He has been raised in a family home with children and other dogs.',
        images: JSON.stringify(['/images/mock_dog_1775037305181.png']),
        userId: sarah.id
      }
    }),
    prisma.listing.create({
      data: {
        title: 'Luna — Calico Cat', petName: 'Luna', species: 'Cat', breed: 'Calico',
        age: '2 Years', gender: 'Female', size: 'Medium', price: 100, location: 'Seattle, WA',
        vaccinated: true, neutered: true,
        description: 'Luna is a sweet, affectionate calico cat looking for a forever home. She is spayed, vaccinated, and litter trained. Luna loves window-watching, gentle play, and curling up on laps. She does best in a calm home without young children.',
        images: JSON.stringify(['/images/mock_cat_1775037291038.png']),
        userId: james.id
      }
    }),
    prisma.listing.create({
      data: {
        title: 'Rio — Scarlet Macaw', petName: 'Rio', species: 'Bird', breed: 'Macaw',
        age: '5 Years', gender: 'Male', size: 'Large', price: 800, location: 'Miami, FL',
        vaccinated: true, neutered: false,
        description: 'Rio is a stunning Scarlet Macaw with vibrant plumage and a charming personality. He can speak about 30 words and loves to sing. Rio requires an experienced bird owner with a large enclosure. Health-checked and comes with CITES documentation.',
        images: JSON.stringify(['/images/mock_bird_1775037276059.png']),
        userId: maria.id
      }
    }),
    prisma.listing.create({
      data: {
        title: 'Bella — French Bulldog', petName: 'Bella', species: 'Dog', breed: 'French Bulldog',
        age: '1 Year', gender: 'Female', size: 'Small', price: 1200, location: 'Los Angeles, CA',
        vaccinated: true, neutered: true,
        description: 'Bella is a loving Frenchie with a playful personality. Great with kids and other pets. She is house trained, spayed, and current on all vaccines.',
        images: JSON.stringify(['/images/mock_dog_1775037305181.png']),
        userId: sarah.id
      }
    }),
    prisma.listing.create({
      data: {
        title: 'Milo — Maine Coon', petName: 'Milo', species: 'Cat', breed: 'Maine Coon',
        age: '6 Months', gender: 'Male', size: 'Large', price: 350, location: 'Portland, OR',
        vaccinated: true, neutered: false,
        description: 'Milo is a gentle giant in training! This Maine Coon kitten has the fluffiest coat and the sweetest temperament. He loves to play fetch and follows you around like a puppy.',
        images: JSON.stringify(['/images/mock_cat_1775037291038.png']),
        userId: james.id
      }
    }),
    prisma.listing.create({
      data: {
        title: 'Max — German Shepherd', petName: 'Max', species: 'Dog', breed: 'German Shepherd',
        age: '2 Years', gender: 'Male', size: 'Large', price: 0, location: 'Denver, CO',
        vaccinated: true, neutered: true,
        description: 'Max is a well-trained German Shepherd who needs a home with a yard. Free to a loving, experienced home. He is great with commands and loves long walks.',
        images: JSON.stringify(['/images/mock_dog_1775037305181.png']),
        userId: admin.id
      }
    }),
  ]);

  // Create reviews
  await prisma.review.createMany({
    data: [
      { rating: 5, comment: 'Sarah is an amazing breeder. Cooper was healthy and exactly as described!', reviewerId: james.id, sellerId: sarah.id },
      { rating: 5, comment: 'Wonderful experience, very responsive and caring.', reviewerId: maria.id, sellerId: sarah.id },
      { rating: 4, comment: 'Luna was a great cat, James was helpful throughout the process.', reviewerId: sarah.id, sellerId: james.id },
      { rating: 5, comment: 'Excellent communication and the bird was in perfect health.', reviewerId: james.id, sellerId: maria.id },
    ]
  });

  // Create some favorites
  await prisma.favorite.createMany({
    data: [
      { userId: james.id, listingId: listings[0].id },
      { userId: maria.id, listingId: listings[0].id },
      { userId: sarah.id, listingId: listings[1].id },
      { userId: admin.id, listingId: listings[2].id },
    ]
  });

  // Create messages
  await prisma.message.createMany({
    data: [
      { content: 'Hi Sarah! I am very interested in Cooper. Is he still available?', senderId: james.id, receiverId: sarah.id, listingId: listings[0].id },
      { content: 'Yes! Cooper is still available. Would you like to schedule a visit?', senderId: sarah.id, receiverId: james.id, listingId: listings[0].id },
      { content: 'That would be great! I am free this weekend.', senderId: james.id, receiverId: sarah.id, listingId: listings[0].id },
      { content: 'Hi, I would love to learn more about Rio!', senderId: sarah.id, receiverId: maria.id, listingId: listings[2].id },
    ]
  });

  console.log('✅ Seed complete!');
  console.log(`   Users: 4 (login with any email + password: password123)`);
  console.log(`   Listings: ${listings.length}`);
  console.log(`   Reviews: 4`);
  console.log(`   Favorites: 4`);
  console.log(`   Messages: 4`);

  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
