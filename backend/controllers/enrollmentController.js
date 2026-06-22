import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import Lecture from '../models/Lecture.js';
import { checkAndAwardAchievements } from '../utils/achievementService.js';

/**
 * Enroll the current user (student) in a course.
 * POST /courses/:courseId/enroll
 */
export const enrollInCourse = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can enroll in courses.' });
    }

    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }
    if (course.status !== 'published' || !course.isPublished) {
      return res.status(400).json({ success: false, message: 'Course is not available for enrollment.' });
    }

    const alreadyEnrolled = (course.enrolledStudents || []).some((id) => id.toString() === userId);
    if (alreadyEnrolled) {
      return res.status(400).json({ success: false, message: 'You are already enrolled in this course.' });
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
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Enrollment failed.',
    });
  }
};
