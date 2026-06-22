import mongoose from 'mongoose';

const lectureProgressSchema = new mongoose.Schema(
  {
    lectureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lecture', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    currentTime: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
    isCompleted: { type: Boolean, default: false },
    watchTime: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { _id: false }
);

const progressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
    },
    completedLectures: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lecture',
    }],
    progress: {
      type: Number,
      required: [true, 'Progress percentage is required'],
      min: 0,
      max: 100,
      default: 0,
    },
    totalLectures: { type: Number, required: true, default: 0 },
    totalDuration: { type: Number, default: 0 },
    watchedDuration: { type: Number, default: 0 },
    lastAccessed: { type: Date, default: Date.now },
    lectureProgress: [lectureProgressSchema],
    certificateGenerated: { type: Boolean, default: false },
    enrolledAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

progressSchema.index({ user: 1, course: 1 }, { unique: true });
progressSchema.index({ user: 1 });
progressSchema.index({ course: 1 });

const Progress = mongoose.model('Progress', progressSchema);
export default Progress;
