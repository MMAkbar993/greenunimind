import express from 'express';
import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// Seed default categories and subcategories if none exist
async function seedCategoriesIfEmpty() {
  const count = await Category.countDocuments();
  if (count > 0) return;

  const defaultCategories = [
    { name: 'Development', slug: 'development', description: 'Programming and software development', icon: 'code' },
    { name: 'Business', slug: 'business', description: 'Business and management', icon: 'briefcase' },
    { name: 'Design', slug: 'design', description: 'Design and creative', icon: 'palette' },
    { name: 'Marketing', slug: 'marketing', description: 'Marketing and growth', icon: 'trending-up' },
    { name: 'Lifestyle', slug: 'lifestyle', description: 'Health, productivity and lifestyle', icon: 'heart' },
  ];

  const inserted = await Category.insertMany(defaultCategories);
  const subcategoriesBySlug = {
    development: [
      { name: 'Web Development', slug: 'web-development' },
      { name: 'Mobile Development', slug: 'mobile-development' },
      { name: 'Data Science', slug: 'data-science' },
      { name: 'DevOps', slug: 'devops' },
    ],
    business: [
      { name: 'Entrepreneurship', slug: 'entrepreneurship' },
      { name: 'Finance', slug: 'finance' },
      { name: 'Leadership', slug: 'leadership' },
    ],
    design: [
      { name: 'UI/UX', slug: 'ui-ux' },
      { name: 'Graphic Design', slug: 'graphic-design' },
      { name: 'Video Editing', slug: 'video-editing' },
    ],
    marketing: [
      { name: 'Digital Marketing', slug: 'digital-marketing' },
      { name: 'SEO', slug: 'seo' },
      { name: 'Social Media', slug: 'social-media' },
    ],
    lifestyle: [
      { name: 'Personal Development', slug: 'personal-development' },
      { name: 'Health & Fitness', slug: 'health-fitness' },
      { name: 'Productivity', slug: 'productivity' },
    ],
  };

  const subcategoryDocs = [];
  for (const cat of inserted) {
    const subs = subcategoriesBySlug[cat.slug] || [];
    for (const sub of subs) {
      subcategoryDocs.push({
        categoryId: cat._id,
        name: sub.name,
        slug: sub.slug,
        description: '',
        isActive: true,
      });
    }
  }
  await Subcategory.insertMany(subcategoryDocs);
}

// Get all categories with their subcategories (nested)
router.get('/with-subcategories', async (req, res) => {
  try {
    await seedCategoriesIfEmpty();

    const categories = await Category.find({ isActive: true })
      .sort({ name: 1 })
      .lean();

    const subcategories = await Subcategory.find({ isActive: true }).lean();

    const subByCategory = {};
    for (const sub of subcategories) {
      const cid = sub.categoryId.toString();
      if (!subByCategory[cid]) subByCategory[cid] = [];
      subByCategory[cid].push({
        ...sub,
        _id: sub._id,
        categoryId: sub.categoryId.toString(),
        name: sub.name,
        slug: sub.slug,
        description: sub.description || '',
        isActive: sub.isActive,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
      });
    }

    const data = categories.map((cat) => ({
      ...cat,
      _id: cat._id,
      subcategories: subByCategory[cat._id.toString()] || [],
    }));

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to load categories.',
    });
  }
});

// Get plain categories list
router.get('/', async (req, res) => {
  try {
    await seedCategoriesIfEmpty();

    const categories = await Category.find({ isActive: true })
      .sort({ name: 1 })
      .lean();

    res.json({
      success: true,
      data: categories,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to load categories.',
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).lean();
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    res.json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:categoryId/courses', async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId).lean();
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    const Course = (await import('../models/Course.js')).default;
    const courses = await Course.find({
      category: { $regex: new RegExp(category.name, 'i') },
      isPublished: true,
      status: 'published',
    }).lean();
    res.json({ success: true, data: courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/create-category', protect, restrictTo('teacher'), async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const category = await Category.create({ name, slug, description, icon });
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/:id', protect, restrictTo('teacher'), async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    res.json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', protect, restrictTo('teacher'), async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: { message: 'Category deleted.' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
