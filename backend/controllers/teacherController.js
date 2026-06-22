import Course from '../models/Course.js';
import Progress from '../models/Progress.js';

/**
 * Get all students enrolled in any of the teacher's courses, with progress per course.
 * GET /teachers/:teacherId/enrolled-students
 */
export const getEnrolledStudents = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const currentUserId = req.user._id.toString();
    if (currentUserId !== teacherId && req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const courses = await Course.find({ creator: teacherId }).select('_id title').lean();
    const courseIds = courses.map((c) => c._id);
    const courseMap = Object.fromEntries(courses.map((c) => [c._id.toString(), c]));

    const progressList = await Progress.find({ course: { $in: courseIds } })
      .populate('user', 'name email profileImg')
      .lean();

    const byUser = {};
    for (const p of progressList) {
      const uid = p.user._id.toString();
      if (!byUser[uid]) {
        byUser[uid] = {
          _id: p.user._id,
          name: p.user.name,
          email: p.user.email,
          profileImg: p.user.profileImg,
          enrolledCourses: [],
        };
      }
      const course = courseMap[p.course.toString()];
      byUser[uid].enrolledCourses.push({
        courseId: p.course.toString(),
        title: course?.title ?? '',
        progress: p.progress ?? 0,
        completedLectures: (p.completedLectures || []).length,
        totalLectures: p.totalLectures ?? 0,
        enrolledAt: p.enrolledAt,
      });
    }

    const data = Object.values(byUser);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch enrolled students.',
    });
  }
};
