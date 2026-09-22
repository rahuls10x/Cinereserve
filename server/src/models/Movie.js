import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true,
      maxlength: 120
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    durationMins: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      min: [1, 'Duration must be at least 1 minute']
    },
    genre: {
      type: [String],
      required: true,
      validate: [arr => arr.length > 0, 'At least one genre is required']
    },
    language: {
      type: String,
      required: true,
      trim: true
    },
    censorRating: {
      type: String,
      enum: ['U', 'UA', 'A', 'S'],
      default: 'UA'
    },
    posterUrl: {
      type: String,
      required: true,
      trim: true
    },
    bannerUrl: {
      type: String,
      trim: true
    },
    releaseDate: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

export const Movie = mongoose.model('Movie', movieSchema);
