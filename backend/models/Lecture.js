import mongoose from 'mongoose';

const videoResolutionSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    quality: { type: String, required: true },
    format: { type: String },
  },
  { _id: false }
);

const lectureSchema = new mongoose.Schema(
  {
    lectureTitle: {
      type: String,
      required: [true, 'Lecture title is required'],
      trim: true,
    },
    instruction: { type: String, default: '' },
    videoUrl: { type: String, default: null },
    videoResolutions: [videoResolutionSchema],
    hlsUrl: { type: String, default: null },
    audioUrl: { type: String, default: null },
    articleContent: { type: String, default: null },
    pdfUrl: { type: String, default: null },
    duration: { type: Number, default: 0 },
    isPreviewFree: {
      type: Boolean,
      required: [true, 'isPreviewFree is required'],
      default: false,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
    },
    order: {
      type: Number,
      required: [true, 'Order is required'],
      default: 0,
    },
    thumbnailUrl: { type: String, default: null },
    views: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

lectureSchema.index({ courseId: 1, order: 1 });

const Lecture = mongoose.model('Lecture', lectureSchema);
export default Lecture;
