import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '', trim: true },
    response: {
      text: { type: String },
      respondedAt: { type: Date },
    },
    helpfulBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reportedBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: String,
        reportedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// One review per student per course - resubmitting edits it in place.
reviewSchema.index({ student: 1, course: 1 }, { unique: true });
reviewSchema.index({ teacher: 1 });
reviewSchema.index({ course: 1 });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
