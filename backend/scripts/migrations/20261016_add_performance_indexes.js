// Migration: add compound indexes for the app's actual hot read paths, found
// by reading every controller's queries (see the PR/commit message for the
// full query inventory). Each index below is named after the query it
// speeds up — nothing speculative was added.
//
// MongoDB detail that matters here: since server 4.2, createIndex() already
// builds "online" — it does not hold an exclusive lock for the duration of
// the build, so there is no separate CONCURRENTLY-style flag to pass (that's
// the Postgres-specific part of the request; this script's createIndex calls
// are the direct Mongo equivalent). This cluster is well past 4.2.
//
// Usage (from backend/, with a working .env / MONGODB_URI):
//   node scripts/migrations/20261016_add_performance_indexes.js
//   node scripts/migrations/20261016_add_performance_indexes.js --drop-superseded
//
// Without --drop-superseded, the old single/short-prefix indexes that these
// new compound indexes make redundant are left in place — review the printed
// list and drop them yourself (or re-run with the flag) once you've confirmed
// nothing else still needs the shorter index.
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../../config/database.js';
import Course from '../../models/Course.js';
import Progress from '../../models/Progress.js';
import Review from '../../models/Review.js';
import Note from '../../models/Note.js';
import Bookmark from '../../models/Bookmark.js';

// { model, spec, name, reason, supersedes }
const NEW_INDEXES = [
  {
    model: Course,
    spec: { isPublished: 1, status: 1, updatedAt: -1 },
    name: 'isPublished_1_status_1_updatedAt_-1',
    reason: 'GET /courses/published-courses — filter + sort, currently sorts in memory after the filter match',
    supersedes: ['isPublished_1_status_1'],
  },
  {
    model: Course,
    spec: { isPublished: 1, status: 1, totalEnrollment: -1, updatedAt: -1 },
    name: 'isPublished_1_status_1_totalEnrollment_-1_updatedAt_-1',
    reason: 'GET /courses/popular-courses — filter + multi-key sort',
    supersedes: [],
  },
  {
    model: Course,
    spec: { creator: 1, updatedAt: -1 },
    name: 'creator_1_updatedAt_-1',
    reason: 'GET /courses/creator/:teacherId — Teacher "My Courses" list',
    supersedes: ['creator_1'],
  },
  {
    model: Progress,
    spec: { user: 1, lastAccessed: -1 },
    name: 'user_1_lastAccessed_-1',
    reason: 'Student dashboard "My Courses" list, sorted by last accessed',
    supersedes: [],
  },
  {
    model: Review,
    spec: { course: 1, createdAt: -1 },
    name: 'course_1_createdAt_-1',
    reason: 'Public course page review list',
    supersedes: ['course_1'],
  },
  {
    model: Review,
    spec: { teacher: 1, createdAt: -1 },
    name: 'teacher_1_createdAt_-1',
    reason: 'Teacher reviews dashboard, default (date) sort',
    supersedes: ['teacher_1'],
  },
  {
    model: Review,
    spec: { teacher: 1, rating: -1 },
    name: 'teacher_1_rating_-1',
    reason: 'Teacher reviews dashboard, sort-by-rating option',
    supersedes: [],
  },
  {
    model: Note,
    spec: { lectureId: 1, isShared: 1 },
    name: 'lectureId_1_isShared_1',
    reason: '"Shared notes on this lecture" — previously had NO supporting index at all',
    supersedes: [],
  },
  {
    model: Bookmark,
    spec: { lectureId: 1, isShared: 1 },
    name: 'lectureId_1_isShared_1',
    reason: '"Shared bookmarks on this lecture" — previously had NO supporting index at all',
    supersedes: [],
  },
];

const run = async () => {
  const dropSuperseded = process.argv.includes('--drop-superseded');
  await connectDB();

  for (const { model, spec, name, reason } of NEW_INDEXES) {
    console.log(`\n${model.collection.collectionName}.createIndex(${JSON.stringify(spec)})`);
    console.log(`  reason: ${reason}`);
    await model.collection.createIndex(spec, { name, background: true });
    console.log(`  done: ${name}`);
  }

  console.log('\nIndexes that are now redundant prefixes of the ones above:');
  const supersededNames = new Set();
  for (const { model, supersedes } of NEW_INDEXES) {
    for (const old of supersedes) supersededNames.add(`${model.collection.collectionName}.${old}`);
  }
  for (const qualified of supersededNames) console.log(`  - ${qualified}`);

  if (dropSuperseded) {
    for (const { model, supersedes } of NEW_INDEXES) {
      for (const old of supersedes) {
        try {
          await model.collection.dropIndex(old);
          console.log(`Dropped ${model.collection.collectionName}.${old}`);
        } catch (e) {
          console.log(`Could not drop ${model.collection.collectionName}.${old}: ${e.message}`);
        }
      }
    }
  } else if (supersededNames.size) {
    console.log('\nRe-run with --drop-superseded to remove them, after confirming nothing else needs the shorter index.');
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
