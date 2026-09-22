import dotenv from 'dotenv';
dotenv.config();

import { connectDB, disconnectDB } from './config/db.js';
import { Movie } from './models/Movie.js';
import { Theater } from './models/Theater.js';
import { Show } from './models/Show.js';
import { Booking } from './models/Booking.js';

export async function seedDatabase() {
  console.log('[Seed] Starting database seed...');
  await Movie.deleteMany({});
  await Theater.deleteMany({});
  await Show.deleteMany({});
  await Booking.deleteMany({});

  // 1. Create Movies
  const movies = await Movie.create([
    {
      title: 'Oppenheimer',
      slug: 'oppenheimer',
      description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
      durationMins: 180,
      genre: ['Biography', 'Drama', 'History'],
      language: 'English',
      censorRating: 'UA',
      posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop',
      bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
      releaseDate: new Date('2023-07-21'),
      isActive: true
    },
    {
      title: 'Dune: Part Two',
      slug: 'dune-part-two',
      description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
      durationMins: 166,
      genre: ['Action', 'Adventure', 'Sci-Fi'],
      language: 'English',
      censorRating: 'UA',
      posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
      bannerUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
      releaseDate: new Date('2024-03-01'),
      isActive: true
    },
    {
      title: 'Interstellar',
      slug: 'interstellar',
      description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
      durationMins: 169,
      genre: ['Adventure', 'Drama', 'Sci-Fi'],
      language: 'English',
      censorRating: 'UA',
      posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
      bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
      releaseDate: new Date('2014-11-07'),
      isActive: true
    }
  ]);

  // 2. Create Theater with Screen and Tiers
  // Recliner: Rows A & B (8 seats each = 16 seats)
  // Prime: Rows C, D, E, F (8 seats each = 32 seats)
  // Classic: Rows G, H, I (8 seats each = 24 seats)
  // Total Capacity = 72 seats
  const screen1Tiers = [
    {
      tierType: 'RECLINER',
      defaultPrice: 450,
      rows: [
        { rowId: 'A', seatsPerRow: 8, seatNumbers: [1, 2, 3, 4, 5, 6, 7, 8] },
        { rowId: 'B', seatsPerRow: 8, seatNumbers: [1, 2, 3, 4, 5, 6, 7, 8] }
      ]
    },
    {
      tierType: 'PRIME',
      defaultPrice: 280,
      rows: [
        { rowId: 'C', seatsPerRow: 8, seatNumbers: [1, 2, 3, 4, 5, 6, 7, 8] },
        { rowId: 'D', seatsPerRow: 8, seatNumbers: [1, 2, 3, 4, 5, 6, 7, 8] },
        { rowId: 'E', seatsPerRow: 8, seatNumbers: [1, 2, 3, 4, 5, 6, 7, 8] },
        { rowId: 'F', seatsPerRow: 8, seatNumbers: [1, 2, 3, 4, 5, 6, 7, 8] }
      ]
    },
    {
      tierType: 'CLASSIC',
      defaultPrice: 180,
      rows: [
        { rowId: 'G', seatsPerRow: 8, seatNumbers: [1, 2, 3, 4, 5, 6, 7, 8] },
        { rowId: 'H', seatsPerRow: 8, seatNumbers: [1, 2, 3, 4, 5, 6, 7, 8] },
        { rowId: 'I', seatsPerRow: 8, seatNumbers: [1, 2, 3, 4, 5, 6, 7, 8] }
      ]
    }
  ];

  const theater = await Theater.create({
    name: 'PVR Superplex',
    city: 'Mumbai',
    address: 'Phoenix Palladium, Lower Parel, Mumbai, Maharashtra 400013',
    screens: [
      {
        screenNumber: 1,
        name: 'Audi 1 (IMAX 2D)',
        format: 'IMAX_2D',
        totalCapacity: 72,
        tiers: screen1Tiers
      },
      {
        screenNumber: 2,
        name: 'Audi 2 (4DX)',
        format: '4DX',
        totalCapacity: 72,
        tiers: screen1Tiers
      },
      {
        screenNumber: 3,
        name: 'Screen 3 (IMAX 2D)',
        format: 'IMAX_2D',
        totalCapacity: 72,
        tiers: screen1Tiers
      }
    ]
  });

  // 3. Create Shows
  const today = new Date();
  const show1Time = new Date(today);
  show1Time.setHours(19, 30, 0, 0); // 7:30 PM

  const show2Time = new Date(today);
  show2Time.setHours(16, 15, 0, 0); // 4:15 PM

  const show3Time = new Date(today);
  show3Time.setHours(22, 0, 0, 0); // 10:00 PM

  const shows = await Show.create([
    {
      movie: movies[0]._id, // Oppenheimer
      theater: theater._id,
      screenNumber: 3,
      startTime: show1Time,
      endTime: new Date(show1Time.getTime() + 180 * 60000),
      customTierPricing: {
        RECLINER: 450,
        PRIME: 280,
        CLASSIC: 180
      },
      bookedSeats: [],
      status: 'SCHEDULED'
    },
    {
      movie: movies[1]._id, // Dune: Part Two
      theater: theater._id,
      screenNumber: 1,
      startTime: show2Time,
      endTime: new Date(show2Time.getTime() + 166 * 60000),
      customTierPricing: {
        RECLINER: 450,
        PRIME: 280,
        CLASSIC: 180
      },
      bookedSeats: [],
      status: 'SCHEDULED'
    },
    {
      movie: movies[2]._id, // Interstellar
      theater: theater._id,
      screenNumber: 2,
      startTime: show3Time,
      endTime: new Date(show3Time.getTime() + 169 * 60000),
      customTierPricing: {
        RECLINER: 420,
        PRIME: 260,
        CLASSIC: 160
      },
      bookedSeats: [],
      status: 'SCHEDULED'
    }
  ]);

  console.log(`[Seed] Seeded ${movies.length} movies, 1 theater (3 screens), and ${shows.length} shows!`);
  return { movies, theater, shows };
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase();
      await disconnectDB();
      process.exit(0);
    } catch (e) {
      console.error('[Seed] Error seeding database:', e);
      process.exit(1);
    }
  })();
}
