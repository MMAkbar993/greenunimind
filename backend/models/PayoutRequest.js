import mongoose from 'mongoose';

const payoutRequestSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: 'usd' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'paid'],
      default: 'pending',
    },
    note: { type: String, default: '' },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

payoutRequestSchema.index({ teacher: 1, createdAt: -1 });

const PayoutRequest = mongoose.model('PayoutRequest', payoutRequestSchema);
export default PayoutRequest;
