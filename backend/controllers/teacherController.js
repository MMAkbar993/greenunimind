import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import User from '../models/User.js';

/**
 * Public roster of educators who have at least one published course, with
 * real aggregated stats. Used by the homepage "Top Educators" section and
 * the /educators page — previously both were hardcoded sample data.
 * GET /teachers/public
 */
export const getPublicTeachers = async (req, res) => {
  try {
    const stats = await Course.aggregate([
      { $match: { isPublished: true, status: 'published' } },
      {
        $group: {
          _id: '$creator',
          totalCourses: { $sum: 1 },
          totalStudents: { $sum: { $size: { $ifNull: ['$enrolledStudents', []] } } },
          totalReviews: { $sum: { $ifNull: ['$totalReviews', 0] } },
          ratingWeightedSum: {
            $sum: { $multiply: [{ $ifNull: ['$averageRating', 0] }, { $ifNull: ['$totalReviews', 0] }] },
          },
        },
      },
    ]);

    const teacherIds = stats.map((s) => s._id).filter(Boolean);
    const users = await User.find({ _id: { $in: teacherIds }, role: 'teacher', isActive: true })
      .select('name email profileImg bio specialization')
      .lean();
    const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

    const data = stats
      .filter((s) => s._id && userMap[s._id.toString()])
      .map((s) => {
        const u = userMap[s._id.toString()];
        const averageRating = s.totalReviews > 0 ? s.ratingWeightedSum / s.totalReviews : 0;
        return {
          _id: u._id,
          name: u.name,
          profileImg: u.profileImg || null,
          bio: u.bio || '',
          specialization: u.specialization || '',
          totalCourses: s.totalCourses,
          totalStudents: s.totalStudents,
          totalReviews: s.totalReviews,
          averageRating: Math.round(averageRating * 10) / 10,
        };
      })
      .sort((a, b) => b.totalStudents - a.totalStudents);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch educators.',
    });
  }
};

/**
 * Get all students enrolled in any of the teacher's courses, with progress per course.
 * GET /teachers/:teacherId/enrolled-students
 */
export const getEnrolledStudents = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const currentUserId = req.user._id.toString();
    // Only the teacher themselves may view their own roster - this was
    // previously `&&`, which let ANY authenticated teacher view ANY other
    // teacher's enrolled students (isMe OR isAnyTeacher, not isMe AND isTeacher).
    if (currentUserId !== teacherId || req.user.role !== 'teacher') {
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
