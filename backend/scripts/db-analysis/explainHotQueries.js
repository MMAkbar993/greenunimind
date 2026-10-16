// Read-only diagnostic: runs .explain("executionStats") on this app's actual
// hot read queries, and reports real per-index usage counts via $indexStats.
// Makes NO writes of any kind — safe to run against production.
//
// Usage (from backend/, with a working .env / MONGODB_URI):
//   node scripts/db-analysis/explainHotQueries.js
//
// Run this BEFORE and AFTER applying migrations/20261016_add_performance_indexes.js
// to see the before/after plan for each query (COLLSCAN -> IXSCAN, docs
// examined vs returned).
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../../config/database.js';
import Course from '../../models/Course.js';
import Lecture from '../../models/Lecture.js';
import Progress from '../../models/Progress.js';
import Review from '../../models/Review.js';
import Note from '../../models/Note.js';
import Bookmark from '../../models/Bookmark.js';
import Question from '../../models/Question.js';

const line = () => console.log('-'.repeat(70));

// Summarize a Mongo explain() output in plain words, instead of dumping the
// raw (large, deeply nested) plan.
function summarize(label, explainResult) {
  const stats = explainResult.executionStats;
  const stage = explainResult.queryPlanner.winningPlan.inputStage || explainResult.queryPlanner.winningPlan;
  const stageNames = [];
  (function walk(s) {
    if (!s) return;
    stageNames.push(s.stage);
    if (s.inputStage) walk(s.inputStage);
    if (s.inputStages) s.inputStages.forEach(walk);
  })(explainResult.queryPlanner.winningPlan);

  const usesCollscan = stageNames.includes('COLLSCAN');
  const usesSort = stageNames.includes('SORT');
  const indexUsed = stageNames.includes('IXSCAN');

  console.log(`\n${label}`);
  console.log(
    usesCollscan
      ? '  -> FULL COLLECTION SCAN (no usable index for this filter)'
      : indexUsed
        ? '  -> Uses an index (no full scan)'
        : '  -> (no documents / trivial plan)'
  );
  if (usesSort) console.log('  -> Sort could NOT be satisfied by the index — extra in-memory SORT stage');
  console.log(`  -> docs examined: ${stats.totalDocsExamined}, docs returned: ${stats.nReturned}, time: ${stats.executionTimeMillis}ms`);
}

const run = async () => {
  await connectDB();
  line();
  console.log('HOT QUERY EXPLAIN PLANS');
  line();

  summarize(
    '1. Published courses list (GET /courses/published-courses)',
    await Course.find({ isPublished: true, status: 'published' })
      .sort({ updatedAt: -1 })
      .limit(50)
      .explain('executionStats')
  );

  summarize(
    '2. Popular courses (GET /courses/popular-courses)',
    await Course.find({ isPublished: true, status: 'published' })
      .sort({ totalEnrollment: -1, updatedAt: -1 })
      .limit(10)
      .explain('executionStats')
  );

  const anyTeacher = await Course.findOne().select('creator').lean();
  if (anyTeacher) {
    summarize(
      '3. Teacher "My Courses" (GET /courses/creator/:teacherId)',
      await Course.find({ creator: anyTeacher.creator }).sort({ updatedAt: -1 }).explain('executionStats')
    );
  }

  const anyCourse = await Course.findOne().select('_id').lean();
  if (anyCourse) {
    summarize(
      '4. Lectures for a course (used on course details / lecture pages)',
      await Lecture.find({ courseId: anyCourse._id }).sort({ order: 1 }).explain('executionStats')
    );
    summarize(
      '5. Course reviews list (public course page)',
      await Review.find({ course: anyCourse._id }).sort({ createdAt: -1 }).explain('executionStats')
    );
  }

  const anyUser = await Progress.findOne().select('user').lean();
  if (anyUser) {
    summarize(
      '6. Student dashboard "My Courses" (Progress by user)',
      await Progress.find({ user: anyUser.user }).sort({ lastAccessed: -1 }).explain('executionStats')
    );
  }

  const anyTeacherReview = await Review.findOne().select('teacher').lean();
  if (anyTeacherReview) {
    summarize(
      '7. Teacher reviews dashboard, default sort',
      await Review.find({ teacher: anyTeacherReview.teacher }).sort({ createdAt: -1 }).explain('executionStats')
    );
  }

  const anyLecture = await Lecture.findOne().select('_id').lean();
  if (anyLecture) {
    summarize(
      '8. Shared notes on a lecture',
      await Note.find({ lectureId: anyLecture._id, isShared: true }).explain('executionStats')
    );
    summarize(
      '9. Shared bookmarks on a lecture',
      await Bookmark.find({ lectureId: anyLecture._id, isShared: true }).explain('executionStats')
    );
  }

  line();
  console.log('REAL INDEX USAGE ($indexStats) — per collection, since last server restart');
  line();
  for (const Model of [Course, Lecture, Progress, Review, Note, Bookmark, Question]) {
    const usage = await Model.collection.aggregate([{ $indexStats: {} }]).toArray();
    console.log(`\n${Model.collection.collectionName}:`);
    for (const idx of usage) {
      console.log(`  ${JSON.stringify(idx.key)} — used ${idx.accesses.ops} times since ${idx.accesses.since.toISOString()}`);
    }
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((error) => {
  console.error('Explain run failed:', error);
  process.exit(1);
});
