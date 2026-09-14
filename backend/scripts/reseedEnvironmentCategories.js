// One-off migration: replace the generic Udemy-style categories (Business,
// Design, Development, Lifestyle, Marketing) that got auto-seeded into an
// empty categories collection with real environment/sustainability ones.
//
// Usage (from backend/, with a working .env / MONGODB_URI):
//   node scripts/reseedEnvironmentCategories.js
//   node scripts/reseedEnvironmentCategories.js --unpublish-unmatched
//
// Without --unpublish-unmatched, published courses whose `category` text
// doesn't match any new category are only listed, not touched — review them
// and re-categorize or unpublish by hand from the teacher dashboard.
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';
import Course from '../models/Course.js';

const CATEGORIES = [
  { name: 'Sustainability', slug: 'sustainability', description: 'Core sustainability principles and practice', icon: 'leaf' },
  { name: 'Clean Energy', slug: 'clean-energy', description: 'Solar, wind, and renewable energy systems', icon: 'zap' },
  { name: 'Environmental Science', slug: 'environmental-science', description: 'Ecology, climate, and environmental impact', icon: 'globe' },
  { name: 'Green Technology', slug: 'green-technology', description: 'Emerging technology for a sustainable future', icon: 'cpu' },
  { name: 'Business Sustainability', slug: 'business-sustainability', description: 'ESG, circular economy, and sustainable business', icon: 'briefcase' },
];

const SUBCATEGORIES_BY_SLUG = {
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

const run = async () => {
  const unpublishUnmatched = process.argv.includes('--unpublish-unmatched');

  await connectDB();

  const oldCategories = await Category.find().lean();
  console.log(`Found ${oldCategories.length} existing categor${oldCategories.length === 1 ? 'y' : 'ies'}:`,
    oldCategories.map((c) => c.name).join(', ') || '(none)');

  await Subcategory.deleteMany({});
  await Category.deleteMany({});
  console.log('Cleared old categories and subcategories.');

  const inserted = await Category.insertMany(CATEGORIES);
  const subcategoryDocs = [];
  for (const cat of inserted) {
    for (const sub of SUBCATEGORIES_BY_SLUG[cat.slug] || []) {
      subcategoryDocs.push({ categoryId: cat._id, name: sub.name, slug: sub.slug, description: '', isActive: true });
    }
  }
  await Subcategory.insertMany(subcategoryDocs);
  console.log(`Inserted ${inserted.length} categories and ${subcategoryDocs.length} subcategories.`);

  const newNames = CATEGORIES.map((c) => c.name.toLowerCase());
  const courses = await Course.find({ isPublished: true, status: 'published' }).select('_id title category').lean();
  const unmatched = courses.filter((c) => !newNames.includes((c.category || '').toLowerCase()));

  if (unmatched.length) {
    console.log(`\n${unmatched.length} published course(s) don't match any new category:`);
    for (const c of unmatched) console.log(`  - "${c.title}" (category: "${c.category}", id: ${c._id})`);

    if (unpublishUnmatched) {
      const ids = unmatched.map((c) => c._id);
      await Course.updateMany({ _id: { $in: ids } }, { $set: { isPublished: false, status: 'draft' } });
      console.log(`Unpublished ${ids.length} unmatched course(s). Re-categorize and republish from the teacher dashboard.`);
    } else {
      console.log('Re-run with --unpublish-unmatched to pull these off the live site automatically, or fix their category by hand.');
    }
  } else {
    console.log('\nAll published courses already match one of the new categories.');
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
