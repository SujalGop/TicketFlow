// ---------------------------------------------------------------------------
// TicketFlow — Database Seed Script
// Seeds evaluator test accounts (Organizer & Attendee) and initial demo events.
// Usage: node seed.js
// ---------------------------------------------------------------------------
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Event = require('./models/Event');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ Error: MONGO_URI is not defined in environment variables.');
  process.exit(1);
}

const seedDatabase = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected successfully.');

    // 1. Seed or Update Test Users
    console.log('🌱 Seeding evaluator test users...');

    let organizer = await User.findOne({ email: 'organizer@test.com' });
    if (!organizer) {
      organizer = await User.create({
        name: 'Demo Organizer',
        email: 'organizer@test.com',
        password: 'password123',
        role: 'Organizer',
      });
      console.log('   ✅ Created Organizer: organizer@test.com / password123');
    } else {
      organizer.role = 'Organizer';
      organizer.password = 'password123';
      await organizer.save();
      console.log('   ℹ️  Organizer already exists (updated): organizer@test.com');
    }

    let attendee = await User.findOne({ email: 'attendee@test.com' });
    if (!attendee) {
      attendee = await User.create({
        name: 'Demo Attendee',
        email: 'attendee@test.com',
        password: 'password123',
        role: 'Attendee',
      });
      console.log('   ✅ Created Attendee: attendee@test.com / password123');
    } else {
      attendee.role = 'Attendee';
      attendee.password = 'password123';
      await attendee.save();
      console.log('   ℹ️  Attendee already exists (updated): attendee@test.com');
    }

    // 2. Seed Initial Demo Events if needed
    const eventCount = await Event.countDocuments();
    if (eventCount === 0) {
      console.log('🌱 Seeding demo events...');
      const sampleEvents = [
        {
          organizerId: organizer._id,
          title: 'Neon Horizon Music Festival 2026',
          description:
            'An electrifying multi-stage EDM festival featuring international headliners, immersive laser stages, and world-class sound design.',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          price: 1499,
          totalCapacity: 500,
          availableTickets: 500,
        },
        {
          organizerId: organizer._id,
          title: 'Global Tech Summit & Developer Conclave',
          description:
            'The premier conference for modern full-stack engineering, distributed systems, and AI agent architectures. Keynotes by leading industry pioneers.',
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          price: 999,
          totalCapacity: 300,
          availableTickets: 300,
        },
        {
          organizerId: organizer._id,
          title: 'Championship Finals: Cyber Arena 2026',
          description:
            'The ultimate esports championship showdown live at the metropolitan arena. Experience heart-pounding competitive gaming on panoramic stages.',
          date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
          price: 499,
          totalCapacity: 250,
          availableTickets: 250,
        },
      ];

      await Event.insertMany(sampleEvents);
      console.log(`   ✅ Inserted ${sampleEvents.length} demo events.`);
    } else {
      console.log(`   ℹ️  Database already contains ${eventCount} events. Skipping event seed.`);
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('---------------------------------------------------------');
    console.log('Evaluator Credentials:');
    console.log('  Organizer : organizer@test.com / password123');
    console.log('  Attendee  : attendee@test.com  / password123');
    console.log('---------------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
