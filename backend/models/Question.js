import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lectureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lecture',
      required: true,
    },
    question: { type: String, required: true, trim: true },
    timestamp: { type: Number, default: 0 },
    answered: { type: Boolean, default: false },
    answer: { type: String },
    answeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    answeredAt: { type: Date },
  },
  { timestamps: true }
);

questionSchema.index({ lectureId: 1 });
questionSchema.index({ studentId: 1, lectureId: 1 });

const Question = mongoose.model('Question', questionSchema);
export default Question;
