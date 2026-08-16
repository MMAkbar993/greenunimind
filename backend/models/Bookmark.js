import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema(
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
    title: { type: String, required: true, trim: true },
    timestamp: { type: Number, default: 0 },
    category: { type: String, default: 'Uncategorized' },
    tags: [{ type: String }],
    notes: { type: String, default: '' },
    isShared: { type: Boolean, default: false },
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

bookmarkSchema.index({ studentId: 1, lectureId: 1 });
bookmarkSchema.index({ studentId: 1, category: 1 });
bookmarkSchema.index({ studentId: 1, tags: 1 });

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);
export default Bookmark;
