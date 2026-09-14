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
    { name: 'Sustainability', slug: 'sustainability', description: 'Core sustainability principles and practice', icon: 'leaf' },
    { name: 'Clean Energy', slug: 'clean-energy', description: 'Solar, wind, and renewable energy systems', icon: 'zap' },
    { name: 'Environmental Science', slug: 'environmental-science', description: 'Ecology, climate, and environmental impact', icon: 'globe' },
    { name: 'Green Technology', slug: 'green-technology', description: 'Emerging technology for a sustainable future', icon: 'cpu' },
    { name: 'Business Sustainability', slug: 'business-sustainability', description: 'ESG, circular economy, and sustainable business', icon: 'briefcase' },
  ];

  const inserted = await Category.insertMany(defaultCategories);
  const subcategoriesBySlug = {
    sustainability: [
      { name: 'Sustainable Development Goals', slug: 'sdgs' },
      { name: 'Circular Economy', slug: 'circular-economy' },
      { name: 'Sustainable Agriculture', slug: 'sustainable-agriculture' },
    ],
    'clean-energy': [
      { name: 'Solar Power', slug: 'solar-power' },
      { name: 'Wind Energy', slug: 'wind-energy' },
      { name: 'Energy Storage', slug: 'energy-storage' },
    ],
    'environmental-science': [
      { name: 'Climate Science & Policy', slug: 'climate-science-policy' },
      { name: 'Environmental Impact Assessment', slug: 'environmental-impact-assessment' },
      { name: 'Conservation', slug: 'conservation' },
    ],
    'green-technology': [
      { name: 'Carbon Capture', slug: 'carbon-capture' },
      { name: 'Smart Grids', slug: 'smart-grids' },
      { name: 'Green Innovation', slug: 'green-innovation' },
    ],
    'business-sustainability': [
      { name: 'ESG Reporting', slug: 'esg-reporting' },
      { name: 'Corporate Sustainability Leadership', slug: 'corporate-sustainability-leadership' },
      { name: 'Sustainable Supply Chains', slug: 'sustainable-supply-chains' },
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
