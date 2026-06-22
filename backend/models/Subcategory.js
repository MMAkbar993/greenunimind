import mongoose from 'mongoose';

const subcategorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    name: {
      type: String,
      required: [true, 'Subcategory name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String, trim: true, default: '' },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

subcategorySchema.index({ categoryId: 1 });
subcategorySchema.index({ slug: 1, categoryId: 1 }, { unique: true });

export default mongoose.model('Subcategory', subcategorySchema);
