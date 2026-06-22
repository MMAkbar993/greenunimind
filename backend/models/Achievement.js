import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: 'trophy',
    },
    category: {
      type: String,
      enum: ['learning', 'completion', 'engagement', 'milestone', 'special'],
      default: 'learning',
    },
    points: {
      type: Number,
      default: 0,
      min: 0,
    },
    requirement: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Achievement = mongoose.model('Achievement', achievementSchema);
export default Achievement;
