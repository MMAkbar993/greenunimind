import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
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
    content: { type: String, default: '' },
    isRichText: { type: Boolean, default: false },
    tags: [{ type: String }],
    isShared: { type: Boolean, default: false },
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// One note per student per lecture; createOrUpdateNote upserts on this pair.
noteSchema.index({ studentId: 1, lectureId: 1 }, { unique: true });

const Note = mongoose.model('Note', noteSchema);
export default Note;
