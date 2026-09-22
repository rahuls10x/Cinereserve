import mongoose from 'mongoose';

const bookedSeatItemSchema = new mongoose.Schema(
  {
    seatId: {
      type: String,
      required: true // e.g., "A-4"
    },
    tier: {
      type: String,
      enum: ['RECLINER', 'PRIME', 'CLASSIC'],
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true // e.g., "CR-2026-981023"
    },
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: true,
      index: true
    },
    customer: {
      name: {
        type: String,
        required: true,
        trim: true
      },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
      },
      phone: {
        type: String,
        required: true,
        trim: true
      }
    },
    seats: {
      type: [bookedSeatItemSchema],
      required: true,
      validate: [s => s.length > 0, 'Booking must include at least one seat']
    },
    pricingBreakdown: {
      baseAmount: {
        type: Number,
        required: true,
        min: 0
      },
      convenienceFee: {
        type: Number,
        default: 30,
        min: 0
      },
      taxAmount: {
        type: Number,
        default: 0,
        min: 0
      },
      grandTotal: {
        type: Number,
        required: true,
        min: 0
      }
    },
    paymentDetails: {
      status: {
        type: String,
        enum: ['PENDING', 'SUCCESS', 'FAILED'],
        default: 'PENDING',
        index: true
      },
      transactionId: {
        type: String,
        sparse: true
      },
      gateway: {
        type: String,
        default: 'MOCK_ENGINE'
      },
      paidAt: {
        type: Date
      }
    },
    bookingStatus: {
      type: String,
      enum: ['ON_HOLD', 'CONFIRMED', 'CANCELLED', 'EXPIRED'],
      default: 'ON_HOLD',
      index: true
    },
    // Matches the active 5-minute hold token stored in Redis
    holdToken: {
      type: String,
      required: true,
      index: true
    },
    holdExpiresAt: {
      type: Date,
      required: true
    },
    qrCodeToken: {
      type: String
    }
  },
  { timestamps: true }
);

// Automatically generate QR Token and calculate taxes pre-validate
bookingSchema.pre('validate', function (next) {
  if (this.pricingBreakdown && typeof this.pricingBreakdown.baseAmount === 'number') {
    const fee = this.pricingBreakdown.convenienceFee ?? 30;
    const tax = Math.round(this.pricingBreakdown.baseAmount * 0.18);
    this.pricingBreakdown.taxAmount = tax;
    this.pricingBreakdown.grandTotal = this.pricingBreakdown.baseAmount + fee + tax;
  }
  if (!this.qrCodeToken && this.bookingReference) {
    this.qrCodeToken = `TICKET-${this.bookingReference}-${Date.now()}`;
  }
  next();
});

export const Booking = mongoose.model('Booking', bookingSchema);
