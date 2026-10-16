// Rollback for 20261016_add_performance_indexes.js — drops the new indexes
// and recreates the short-prefix ones they superseded (only needed if you
// ran the up-migration with --drop-superseded; harmless no-op otherwise
// since createIndex on an already-existing equivalent index is a no-op).
//
// Usage:
//   node scripts/migrations/20261016_add_performance_indexes.down.js
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../../config/database.js';
import Course from '../../models/Course.js';
import Progress from '../../models/Progress.js';
import Review from '../../models/Review.js';
import Note from '../../models/Note.js';
import Bookmark from '../../models/Bookmark.js';

const NEW_INDEX_NAMES = [
  [Course, 'isPublished_1_status_1_updatedAt_-1'],
  [Course, 'isPublished_1_status_1_totalEnrollment_-1_updatedAt_-1'],
  [Course, 'creator_1_updatedAt_-1'],
  [Progress, 'user_1_lastAccessed_-1'],
  [Review, 'course_1_createdAt_-1'],
  [Review, 'teacher_1_createdAt_-1'],
  [Review, 'teacher_1_rating_-1'],
  [Note, 'lectureId_1_isShared_1'],
  [Bookmark, 'lectureId_1_isShared_1'],
];

// Restore the originals in case they were dropped with --drop-superseded.
const RESTORE_ORIGINALS = [
  [Course, { isPublished: 1, status: 1 }, 'isPublished_1_status_1'],
  [Course, { creator: 1 }, 'creator_1'],
  [Review, { course: 1 }, 'course_1'],
  [Review, { teacher: 1 }, 'teacher_1'],
];

const run = async () => {
  await connectDB();

  for (const [model, name] of NEW_INDEX_NAMES) {
    try {
      await model.collection.dropIndex(name);
      console.log(`Dropped ${model.collection.collectionName}.${name}`);
    } catch (e) {
      console.log(`Skip ${model.collection.collectionName}.${name}: ${e.message}`);
    }
  }

  for (const [model, spec, name] of RESTORE_ORIGINALS) {
    await model.collection.createIndex(spec, { name, background: true });
    console.log(`Restored ${model.collection.collectionName}.${name}`);
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((error) => {
  console.error('Rollback failed:', error);
  process.exit(1);
});
