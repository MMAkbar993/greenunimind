import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import Lecture from '../models/Lecture.js';
import { checkAndAwardAchievements } from '../utils/achievementService.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../middleware/asyncHandler.js';

/**
 * Enroll the current user (student) in a course.
 * POST /courses/:courseId/enroll
 */
export const enrollInCourse = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();
  if (req.user.role !== 'student') {
    throw new AppError('Only students can enroll in courses.', 403);
  }

  const { courseId } = req.params;
  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError('Course not found.', 404);
  }
  if (course.status !== 'published' || !course.isPublished) {
    throw new AppError('Course is not available for enrollment.', 400);
  }

  const alreadyEnrolled = (course.enrolledStudents || []).some((id) => id.toString() === userId);
  if (alreadyEnrolled) {
    throw new AppError('You are already enrolled in this course.', 400);
  }

  const totalLectures = await Lecture.countDocuments({ courseId: course._id });
  const totalDuration = await Lecture.aggregate([
    { $match: { courseId: course._id } },
    { $group: { _id: null, total: { $sum: '$duration' } } },
  ]).then((r) => (r[0]?.total ?? 0));

  await Progress.create({
    user: userId,
    course: courseId,
    completedLectures: [],
    progress: 0,
    totalLectures,
    totalDuration,
    watchedDuration: 0,
    lectureProgress: [],
    certificateGenerated: false,
    enrolledAt: new Date(),
  });

  course.enrolledStudents = course.enrolledStudents || [];
  course.enrolledStudents.push(req.user._id);
  course.totalEnrollment = course.enrolledStudents.length;
  await course.save();

  checkAndAwardAchievements(userId).catch(() => {});

  res.status(201).json({
    success: true,
    data: { message: 'Enrolled successfully.', courseId },
  });
});
