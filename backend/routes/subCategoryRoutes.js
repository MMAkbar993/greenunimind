import express from 'express';
import Subcategory from '../models/Subcategory.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.get('/category/:categoryId', async (req, res) => {
  try {
    const subcategories = await Subcategory.find({
      categoryId: req.params.categoryId,
      isActive: true,
    }).sort({ name: 1 }).lean();
    res.json({ success: true, data: subcategories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:subcategoryId/courses', async (req, res) => {
  try {
    const sub = await Subcategory.findById(req.params.subcategoryId).lean();
    if (!sub) return res.status(404).json({ success: false, message: 'Subcategory not found.' });
    const Course = (await import('../models/Course.js')).default;
    const courses = await Course.find({
      subcategory: { $regex: new RegExp(sub.name, 'i') },
      isPublished: true,
      status: 'published',
    }).lean();
    res.json({ success: true, data: courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/create-subCategory', protect, restrictTo('teacher'), async (req, res) => {
  try {
    const { categoryId, name, description } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const subcategory = await Subcategory.create({ categoryId, name, slug, description });
    res.status(201).json({ success: true, data: subcategory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/:id', protect, restrictTo('teacher'), async (req, res) => {
  try {
    const subcategory = await Subcategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!subcategory) return res.status(404).json({ success: false, message: 'Subcategory not found.' });
    res.json({ success: true, data: subcategory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', protect, restrictTo('teacher'), async (req, res) => {
  try {
    await Subcategory.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: { message: 'Subcategory deleted.' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
