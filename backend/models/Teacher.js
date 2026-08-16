import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
    },
    stripeAccountId: {
      type: String,
      default: null,
    },
    stripeEmail: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    payoutPreferences: {
      schedule: {
        type: String,
        enum: ['weekly', 'biweekly', 'monthly'],
        default: 'monthly',
      },
      minimumAmount: {
        type: Number,
        default: 0,
      },
    },
    invoicePreferences: {
      autoGenerate: {
        type: Boolean,
        default: true,
      },
      emailNotificationsEnabled: {
        type: Boolean,
        default: true,
      },
      businessName: {
        type: String,
        default: '',
      },
    },
    analyticsPreferences: {
      realtimeUpdatesEnabled: {
        type: Boolean,
        default: true,
      },
      weeklyEmailReports: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Teacher = mongoose.model('Teacher', teacherSchema);
export default Teacher;
