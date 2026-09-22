import mongoose from 'mongoose';

// Row configuration subdocument
const rowSchema = new mongoose.Schema(
  {
    rowId: {
      type: String,
      required: true,
      uppercase: true,
      trim: true // e.g., "A", "B", "C"
    },
    seatsPerRow: {
      type: Number,
      required: true,
      min: 1
    },
    // Array of seat numbers in this row, e.g., [1, 2, 3, 4, 5, 6, 7, 8]
    seatNumbers: {
      type: [Number],
      required: true
    }
  },
  { _id: false }
);

// Seating tier subdocument
const tierSchema = new mongoose.Schema(
  {
    tierType: {
      type: String,
      enum: ['RECLINER', 'PRIME', 'CLASSIC'],
      required: true
    },
    defaultPrice: {
      type: Number,
      required: true,
      min: 0
    },
    rows: {
      type: [rowSchema],
      required: true,
      validate: [rows => rows.length > 0, 'At least one row required per tier']
    }
  },
  { _id: false }
);

// Screen subdocument
const screenSchema = new mongoose.Schema(
  {
    screenNumber: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      default: 'Screen 1',
      trim: true
    },
    format: {
      type: String,
      enum: ['STANDARD', 'IMAX_2D', 'IMAX_3D', '4DX'],
      default: 'STANDARD'
    },
    totalCapacity: {
      type: Number,
      required: true,
      min: 1
    },
    tiers: {
      type: [tierSchema],
      required: true,
      validate: [t => t.length > 0, 'Screen must have at least one seating tier']
    }
  },
  { _id: true }
);

const theaterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Theater name is required'],
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    screens: {
      type: [screenSchema],
      required: true,
      validate: [s => s.length > 0, 'Theater must contain at least one screen']
    }
  },
  { timestamps: true }
);

export const Theater = mongoose.model('Theater', theaterSchema);
