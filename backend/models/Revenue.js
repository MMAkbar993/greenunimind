import mongoose from 'mongoose';

const revenueSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      required: true,
      enum: {
        values: ['ad', 'course', 'donation'],
        message: 'Source must be ad, course, or donation',
      },
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    description: { type: String, default: '' },
    metadata: {
      courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
      stripePaymentId: { type: String, default: null },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

revenueSchema.index({ source: 1 });
revenueSchema.index({ createdAt: 1 });

const Revenue = mongoose.model('Revenue', revenueSchema);
export default Revenue;
