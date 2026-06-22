import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
    },
    subtitle: { type: String, trim: true, default: '' },
    description: {
      type: String,
      required: [true, 'Course description is required'],
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    subcategory: { type: String, trim: true, default: '' },
    courseLevel: {
      type: String,
      required: [true, 'Course level is required'],
      enum: { values: ['Beginner', 'Medium', 'Advance'], message: 'Level must be Beginner, Medium or Advance' },
    },
    coursePrice: {
      type: Number,
      required: [true, 'Course price is required'],
      min: 0,
      default: 0,
    },
    courseThumbnail: { type: String, default: null },
    courseThumbnailPublicId: { type: String, default: null },
    enrolledStudents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    totalEnrollment: { type: Number, default: 0 },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator (teacher) is required'],
    },
    isPublished: {
      type: Boolean,
      required: [true, 'isPublished is required'],
      default: false,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: { values: ['draft', 'published', 'archived'], message: 'Status must be draft, published or archived' },
      default: 'draft',
    },
    isFree: { type: String, default: 'false' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

courseSchema.index({ creator: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ isPublished: 1, status: 1 });

const Course = mongoose.model('Course', courseSchema);
export default Course;
