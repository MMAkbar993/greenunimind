import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import User from '../models/User.js';
import Course from '../models/Course.js';

const DEFAULT_TEACHER = {
  name: { firstName: 'Green', lastName: 'Uni Mind' },
  email: 'instructor@greenunimind.com',
  password: 'ChangeMe123!',
  role: 'teacher',
  isEmailVerified: true,
};

const DEFAULT_COURSES = [
  {
    title: 'Introduction to Sustainable Development',
    subtitle: 'Understand the fundamentals of sustainability',
    description:
      'Learn the core principles of sustainable development, the UN SDGs, and how they apply to everyday life and business.',
    category: 'Sustainability',
    courseLevel: 'Beginner',
    coursePrice: 0,
    isFree: 'true',
    courseThumbnail: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800',
  },
  {
    title: 'Renewable Energy Systems',
    subtitle: 'Solar, wind, and clean energy fundamentals',
    description:
      'Explore how solar, wind, and other renewable energy systems work, and how they are reshaping the global energy landscape.',
    category: 'Clean Energy',
    courseLevel: 'Medium',
    coursePrice: 49,
    courseThumbnail: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800',
  },
  {
    title: 'Environmental Impact Assessment Basics',
    subtitle: 'Assess and reduce environmental impact',
    description:
      'A practical guide to conducting environmental impact assessments for projects and business operations.',
    category: 'Environmental Science',
    courseLevel: 'Medium',
    coursePrice: 79,
    courseThumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
  },
  {
    title: 'Corporate ESG Strategy',
    subtitle: 'Build ESG programs that last',
    description:
      'Learn how to design, implement, and report on Environmental, Social, and Governance (ESG) strategies within organizations.',
    category: 'Business Sustainability',
    courseLevel: 'Advance',
    coursePrice: 99,
    courseThumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
  },
  {
    title: 'Circular Economy Fundamentals',
    subtitle: 'Design out waste, keep resources in use',
    description:
      'Discover the principles of the circular economy and how businesses are redesigning products and supply chains to eliminate waste.',
    category: 'Sustainability',
    courseLevel: 'Beginner',
    coursePrice: 39,
    courseThumbnail: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800',
  },
  {
    title: 'Green Technology Innovation',
    subtitle: 'Cutting-edge tools for a sustainable future',
    description:
      'Survey emerging green technologies, from carbon capture to smart grids, and how innovators bring them to market.',
    category: 'Green Technology',
    courseLevel: 'Advance',
    coursePrice: 89,
    courseThumbnail: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800',
  },
];

const run = async () => {
  await connectDB();

  let teacher = await User.findOne({ email: DEFAULT_TEACHER.email });
  if (!teacher) {
    teacher = await User.create(DEFAULT_TEACHER);
    console.log(`Created default teacher: ${teacher.email}`);
  } else {
    console.log(`Using existing teacher: ${teacher.email}`);
  }

  let created = 0;
  for (const courseData of DEFAULT_COURSES) {
    const exists = await Course.findOne({ title: courseData.title });
    if (exists) {
      console.log(`Skipping existing course: ${courseData.title}`);
      continue;
    }
    await Course.create({
      ...courseData,
      creator: teacher._id,
      isPublished: true,
      status: 'published',
    });
    created += 1;
    console.log(`Created course: ${courseData.title}`);
  }

  console.log(`Done. ${created} course(s) created.`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
