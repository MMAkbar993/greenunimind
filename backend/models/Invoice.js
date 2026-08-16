import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      required: true,
      unique: true,
    },
    invoiceNumber: { type: String, required: true, unique: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'usd' },
    status: {
      type: String,
      enum: ['paid', 'pending', 'failed', 'refunded'],
      default: 'pending',
    },
    emailSentCount: { type: Number, default: 0 },
    lastEmailSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

invoiceSchema.index({ student: 1 });
invoiceSchema.index({ teacher: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
