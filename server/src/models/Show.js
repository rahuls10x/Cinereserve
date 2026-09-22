import mongoose from 'mongoose';

// Record for permanently booked seats
const bookedSeatRecordSchema = new mongoose.Schema(
  {
    seatId: {
      type: String,
      required: true,
      trim: true // Composite ID, e.g., "A-4"
    },
    tier: {
      type: String,
      enum: ['RECLINER', 'PRIME', 'CLASSIC'],
      required: true
    },
    pricePaid: {
      type: Number,
      required: true
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    },
    bookedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const showSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
      index: true
    },
    theater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theater',
      required: true,
      index: true
    },
    screenNumber: {
      type: Number,
      required: true
    },
    startTime: {
      type: Date,
      required: true,
      index: true
    },
    endTime: {
      type: Date,
      required: true
    },
    // Optional custom prices for this specific show slot
    customTierPricing: {
      RECLINER: { type: Number, min: 0 },
      PRIME: { type: Number, min: 0 },
      CLASSIC: { type: Number, min: 0 }
    },
    // Array of permanently booked seats (persisted after payment confirmation)
    bookedSeats: [bookedSeatRecordSchema],
    status: {
      type: String,
      enum: ['SCHEDULED', 'HOUSEFULL', 'CANCELLED', 'COMPLETED'],
      default: 'SCHEDULED',
      index: true
    }
  },
  { timestamps: true }
);

// Compound index to quickly query showtimes by theater and date
showSchema.index({ theater: 1, startTime: 1, screenNumber: 1 });

// Helper virtual to calculate remaining seats based on theater capacity
showSchema.virtual('totalBookedCount').get(function () {
  return this.bookedSeats ? this.bookedSeats.length : 0;
});

export const Show = mongoose.model('Show', showSchema);
