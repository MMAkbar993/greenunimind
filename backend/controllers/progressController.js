import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Lecture from '../models/Lecture.js';
import Progress from '../models/Progress.js';
import User from '../models/User.js';
import { generateCertificatePDF } from '../utils/certificateGenerator.js';

/**
 * Get enrolled courses with progress for a student.
 * GET /students/:studentId/enrolled-courses-progress
 */
export const getEnrolledCoursesProgress = async (req, res) => {
  try {
    const { studentId } = req.params;
    const currentUserId = req.user._id.toString();
    if (currentUserId !== studentId && req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const progressList = await Progress.find({ user: studentId })
      .populate('course', 'title subtitle description courseThumbnail courseLevel creator')
      .sort({ lastAccessed: -1 })
      .lean();

    const data = progressList
      .filter((p) => p.course)
      .map((p) => ({
        _id: p.course._id,
        courseId: p.course._id.toString(),
        title: p.course.title,
        subtitle: p.course.subtitle,
        description: p.course.description,
        courseThumbnail: p.course.courseThumbnail,
        courseLevel: p.course.courseLevel,
        progress: p.progress,
        completedLectures: p.completedLectures || [],
        totalLectures: p.totalLectures,
        totalDuration: p.totalDuration,
        watchedDuration: p.watchedDuration,
        certificateGenerated: p.certificateGenerated,
        enrolledAt: p.enrolledAt,
        lastAccessed: p.lastAccessed,
      }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch enrolled courses.',
    });
  }
};

/**
 * Get progress for one course.
 * GET /students/:studentId/course-progress/:courseId
 */
export const getCourseProgress = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;
    const currentUserId = req.user._id.toString();
    if (currentUserId !== studentId && req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const progress = await Progress.findOne({ user: studentId, course: courseId }).lean();
    if (!progress) {
      return res.status(404).json({ success: false, message: 'No progress found for this course.' });
    }

    const percentage = progress.totalLectures
      ? Math.round((progress.completedLectures.length / progress.totalLectures) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        ...progress,
        percentage,
        completedLectures: progress.completedLectures || [],
        totalLectures: progress.totalLectures,
        progress: percentage,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch course progress.',
    });
  }
};

/**
 * Mark a lecture as complete and update progress.
 * POST /students/:studentId/mark-lecture-complete
 * Body: { courseId, lectureId }
 */
export const markLectureComplete = async (req, res) => {
  try {
    const { studentId } = req.params;
    const currentUserId = req.user._id.toString();
    if (currentUserId !== studentId) {
      return res.status(403).json({ success: false, message: 'You can only update your own progress.' });
    }

    const { courseId, lectureId } = req.body || {};
    if (!courseId || !lectureId) {
      return res.status(400).json({ success: false, message: 'courseId and lectureId are required.' });
    }

    const progress = await Progress.findOne({ user: studentId, course: courseId });
    if (!progress) {
      return res.status(404).json({ success: false, message: 'Enrollment not found.' });
    }

    const lectureIdStr = lectureId.toString();
    const alreadyCompleted = (progress.completedLectures || []).some((id) => id.toString() === lectureIdStr);
    if (!alreadyCompleted) {
      progress.completedLectures = progress.completedLectures || [];
      progress.completedLectures.push(lectureId);
    }

    const lecture = await Lecture.findById(lectureId).select('duration').lean();
    const duration = lecture?.duration ?? 0;
    const existingEntry = (progress.lectureProgress || []).find(
      (lp) => lp.lectureId.toString() === lectureIdStr
    );
    if (!existingEntry) {
      progress.lectureProgress = progress.lectureProgress || [];
      progress.lectureProgress.push({
        lectureId,
        courseId,
        currentTime: duration,
        duration,
        completionPercentage: 100,
        isCompleted: true,
        watchTime: duration,
        lastUpdated: new Date(),
      });
    } else {
      const idx = progress.lectureProgress.findIndex((lp) => lp.lectureId.toString() === lectureIdStr);
      progress.lectureProgress[idx].isCompleted = true;
      progress.lectureProgress[idx].completionPercentage = 100;
      progress.lectureProgress[idx].currentTime = duration;
      progress.lectureProgress[idx].watchTime = duration;
      progress.lectureProgress[idx].lastUpdated = new Date();
    }

    progress.watchedDuration = (progress.lectureProgress || []).reduce((sum, lp) => sum + (lp.watchTime || 0), 0);
    progress.progress =
      progress.totalLectures > 0
        ? Math.round((progress.completedLectures.length / progress.totalLectures) * 100)
        : 0;
    progress.lastAccessed = new Date();
    progress.certificateGenerated = progress.progress >= 100 ? progress.certificateGenerated : false;
    await progress.save();

    const { checkAndAwardAchievements } = await import('../utils/achievementService.js');
    checkAndAwardAchievements(studentId).catch(() => {});

    res.json({
      success: true,
      data: {
        completedLectures: progress.completedLectures,
        progress: progress.progress,
        totalLectures: progress.totalLectures,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to update progress.',
    });
  }
};

/**
 * Generate certificate (mark as generated when course 100% complete).
 * POST /students/:studentId/generate-certificate/:courseId
 */
export const generateCertificate = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;
    const currentUserId = req.user._id.toString();
    if (currentUserId !== studentId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const progress = await Progress.findOne({ user: studentId, course: courseId });
    if (!progress) {
      return res.status(404).json({ success: false, message: 'Enrollment not found.' });
    }
    if (progress.progress < 100) {
      return res.status(400).json({ success: false, message: 'Complete all lectures to generate a certificate.' });
    }

    const user = await User.findById(studentId).lean();
    const course = await Course.findById(courseId).lean();

    if (!user || !course) {
      return res.status(404).json({ success: false, message: 'User or course not found.' });
    }

    const studentName = `${user.name.firstName} ${user.name.middleName ? user.name.middleName + ' ' : ''}${user.name.lastName}`;
    const certificateId = `GUM-${courseId.toString().slice(-6).toUpperCase()}-${studentId.toString().slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    progress.certificateGenerated = true;
    await progress.save();

    const { checkAndAwardAchievements } = await import('../utils/achievementService.js');
    checkAndAwardAchievements(studentId).catch(() => {});

    const pdfBuffer = await generateCertificatePDF({
      studentName,
      courseName: course.title,
      completionDate: new Date(),
      certificateId,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="GreenUniMind-Certificate-${course.title.replace(/[^a-zA-Z0-9]/g, '-')}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to generate certificate.',
    });
  }
};
