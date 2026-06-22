import Course from '../models/Course.js';
import Lecture from '../models/Lecture.js';
import Progress from '../models/Progress.js';

export const createLecture = async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }
    if (course.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only add lectures to your own course.' });
    }

    const body = req.body || {};
    const lectureTitle = body.lectureTitle || body.title;
    if (!lectureTitle) {
      return res.status(400).json({ success: false, message: 'Lecture title is required.' });
    }

    const maxOrder = await Lecture.findOne({ courseId }).sort({ order: -1 }).select('order').lean();
    const order = (maxOrder?.order ?? -1) + 1;

    const lecture = await Lecture.create({
      lectureTitle,
      instruction: body.instruction ?? '',
      videoUrl: body.videoUrl ?? null,
      videoResolutions: body.videoResolutions ?? [],
      hlsUrl: body.hlsUrl ?? null,
      audioUrl: body.audioUrl ?? null,
      articleContent: body.articleContent ?? null,
      pdfUrl: body.pdfUrl ?? null,
      duration: body.duration ?? 0,
      isPreviewFree: !!body.isPreviewFree,
      courseId,
      order,
      thumbnailUrl: body.thumbnailUrl ?? null,
    });

    res.status(201).json({
      success: true,
      data: lecture.toObject ? lecture.toObject() : lecture,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to create lecture.',
    });
  }
};

export const getLecturesByCourseId = async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId).select('creator enrolledStudents').lean();
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }
    const isCreator = course.creator.toString() === req.user._id.toString();
    const isEnrolled = (course.enrolledStudents || []).some(
      (id) => id.toString() === req.user._id.toString()
    );
    if (!isCreator && !isEnrolled) {
      return res.status(403).json({ success: false, message: 'You do not have access to this course lectures.' });
    }

    const lectures = await Lecture.find({ courseId }).sort({ order: 1 }).lean();
    res.json({ success: true, data: lectures });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch lectures.',
    });
  }
};

export const getLectureById = async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id).lean();
    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Lecture not found.' });
    }
    const course = await Course.findById(lecture.courseId).select('creator enrolledStudents').lean();
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
    const isCreator = course.creator.toString() === req.user._id.toString();
    const isEnrolled = (course.enrolledStudents || []).some(
      (id) => id.toString() === req.user._id.toString()
    );
    if (!isCreator && !isEnrolled) {
      return res.status(403).json({ success: false, message: 'You do not have access to this lecture.' });
    }

    res.json({ success: true, data: lecture });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch lecture.',
    });
  }
};

export const updateLectureOrder = async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }
    if (course.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only reorder lectures in your own course.' });
    }

    const { lectures: orderUpdates } = req.body || {};
    if (!Array.isArray(orderUpdates)) {
      return res.status(400).json({ success: false, message: 'Body must include lectures array with { lectureId, order }.' });
    }

    for (const item of orderUpdates) {
      if (item.lectureId && typeof item.order === 'number') {
        await Lecture.updateOne(
          { _id: item.lectureId, courseId },
          { $set: { order: item.order } }
        );
      }
    }

    const updated = await Lecture.find({ courseId }).sort({ order: 1 }).lean();
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to update order.',
    });
  }
};

export const updateLecture = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }
    if (course.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only update lectures in your own course.' });
    }

    const lecture = await Lecture.findOne({ _id: lectureId, courseId });
    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Lecture not found.' });
    }

    const body = req.body || {};
    const allowed = [
      'lectureTitle', 'instruction', 'videoUrl', 'videoResolutions', 'hlsUrl',
      'audioUrl', 'articleContent', 'pdfUrl', 'duration', 'isPreviewFree', 'thumbnailUrl',
    ];
    for (const key of allowed) {
      if (body[key] !== undefined) {
        lecture[key] = body[key];
      }
    }
    await lecture.save();

    res.json({
      success: true,
      data: lecture.toObject ? lecture.toObject() : lecture,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to update lecture.',
    });
  }
};

export const getLectureProgress = async (req, res) => {
  try {
    const { id: lectureId } = req.params;
    const userId = req.user._id;

    const lecture = await Lecture.findById(lectureId).select('courseId').lean();
    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Lecture not found.' });
    }

    const progress = await Progress.findOne({ user: userId, course: lecture.courseId }).lean();
    if (!progress) {
      return res.json({
        success: true,
        data: { currentTime: 0, duration: 0, completionPercentage: 0, isCompleted: false, watchTime: 0 },
      });
    }

    const lp = (progress.lectureProgress || []).find(
      (p) => p.lectureId.toString() === lectureId
    );

    res.json({
      success: true,
      data: lp || { currentTime: 0, duration: 0, completionPercentage: 0, isCompleted: false, watchTime: 0 },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to get progress.' });
  }
};

export const updateLectureProgress = async (req, res) => {
  try {
    const { id: lectureId } = req.params;
    const userId = req.user._id;
    const { currentTime, duration, completionPercentage, isCompleted, watchTime, lastUpdated } = req.body;

    const lecture = await Lecture.findById(lectureId).select('courseId duration').lean();
    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Lecture not found.' });
    }

    const courseId = lecture.courseId;
    let progress = await Progress.findOne({ user: userId, course: courseId });
    if (!progress) {
      return res.status(404).json({ success: false, message: 'Enrollment not found. Please enroll first.' });
    }

    const lectureIdStr = lectureId.toString();
    const existingIdx = (progress.lectureProgress || []).findIndex(
      (lp) => lp.lectureId.toString() === lectureIdStr
    );

    const entry = {
      lectureId,
      courseId,
      currentTime: currentTime ?? 0,
      duration: duration ?? lecture.duration ?? 0,
      completionPercentage: completionPercentage ?? 0,
      isCompleted: isCompleted ?? false,
      watchTime: watchTime ?? 0,
      lastUpdated: lastUpdated ? new Date(lastUpdated) : new Date(),
    };

    if (existingIdx >= 0) {
      const existing = progress.lectureProgress[existingIdx];
      entry.watchTime = Math.max(entry.watchTime, existing.watchTime || 0);
      entry.completionPercentage = Math.max(entry.completionPercentage, existing.completionPercentage || 0);
      entry.isCompleted = entry.isCompleted || existing.isCompleted;
      progress.lectureProgress[existingIdx] = entry;
    } else {
      progress.lectureProgress = progress.lectureProgress || [];
      progress.lectureProgress.push(entry);
    }

    if (entry.isCompleted) {
      const alreadyCompleted = (progress.completedLectures || []).some(
        (id) => id.toString() === lectureIdStr
      );
      if (!alreadyCompleted) {
        progress.completedLectures = progress.completedLectures || [];
        progress.completedLectures.push(lectureId);
      }
    }

    progress.watchedDuration = (progress.lectureProgress || []).reduce(
      (sum, lp) => sum + (lp.watchTime || 0), 0
    );
    progress.progress = progress.totalLectures > 0
      ? Math.round((progress.completedLectures.length / progress.totalLectures) * 100)
      : 0;
    progress.lastAccessed = new Date();
    await progress.save();

    if (entry.isCompleted) {
      import('../utils/achievementService.js')
        .then(({ checkAndAwardAchievements }) => checkAndAwardAchievements(userId))
        .catch(() => {});
    }

    res.json({
      success: true,
      data: {
        lectureProgress: entry,
        courseProgress: progress.progress,
        completedLectures: progress.completedLectures,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update progress.' });
  }
};

export const deleteLecture = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }
    if (course.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete lectures from your own course.' });
    }

    const lecture = await Lecture.findOne({ _id: lectureId, courseId });
    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Lecture not found.' });
    }
    await lecture.deleteOne();

    const remaining = await Lecture.find({ courseId }).sort({ order: 1 });
    await Promise.all(
      remaining.map((lec, i) => lec.updateOne({ $set: { order: i } }))
    );

    res.json({ success: true, data: { message: 'Lecture deleted.' } });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to delete lecture.',
    });
  }
};
