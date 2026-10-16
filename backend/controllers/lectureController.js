import Course from '../models/Course.js';
import Lecture from '../models/Lecture.js';
import Progress from '../models/Progress.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../middleware/asyncHandler.js';

export const createLecture = asyncHandler(async (req, res) => {
  const courseId = req.params.id;
  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError('Course not found.', 404);
  }
  if (course.creator.toString() !== req.user._id.toString()) {
    throw new AppError('You can only add lectures to your own course.', 403);
  }

  const body = req.body || {};
  const lectureTitle = body.lectureTitle || body.title;
  if (!lectureTitle) {
    throw new AppError('Lecture title is required.', 400);
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
});

export const getLecturesByCourseId = asyncHandler(async (req, res) => {
  const courseId = req.params.id;
  const course = await Course.findById(courseId).select('creator enrolledStudents').lean();
  if (!course) {
    throw new AppError('Course not found.', 404);
  }
  const isCreator = course.creator.toString() === req.user._id.toString();
  const isEnrolled = (course.enrolledStudents || []).some(
    (id) => id.toString() === req.user._id.toString()
  );
  if (!isCreator && !isEnrolled) {
    throw new AppError('You do not have access to this course lectures.', 403);
  }

  const lectures = await Lecture.find({ courseId }).sort({ order: 1 }).lean();
  res.json({ success: true, data: lectures });
});

export const getLectureById = asyncHandler(async (req, res) => {
  const lecture = await Lecture.findById(req.params.id).lean();
  if (!lecture) {
    throw new AppError('Lecture not found.', 404);
  }
  const course = await Course.findById(lecture.courseId).select('creator enrolledStudents').lean();
  if (!course) throw new AppError('Course not found.', 404);
  const isCreator = course.creator.toString() === req.user._id.toString();
  const isEnrolled = (course.enrolledStudents || []).some(
    (id) => id.toString() === req.user._id.toString()
  );
  if (!isCreator && !isEnrolled) {
    throw new AppError('You do not have access to this lecture.', 403);
  }

  res.json({ success: true, data: lecture });
});

export const updateLectureOrder = asyncHandler(async (req, res) => {
  const courseId = req.params.id;
  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError('Course not found.', 404);
  }
  if (course.creator.toString() !== req.user._id.toString()) {
    throw new AppError('You can only reorder lectures in your own course.', 403);
  }

  const { lectures: orderUpdates } = req.body || {};
  if (!Array.isArray(orderUpdates)) {
    throw new AppError('Body must include lectures array with { lectureId, order }.', 400);
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
});

export const updateLecture = asyncHandler(async (req, res) => {
  const { courseId, lectureId } = req.params;
  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError('Course not found.', 404);
  }
  if (course.creator.toString() !== req.user._id.toString()) {
    throw new AppError('You can only update lectures in your own course.', 403);
  }

  const lecture = await Lecture.findOne({ _id: lectureId, courseId });
  if (!lecture) {
    throw new AppError('Lecture not found.', 404);
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
});

export const getLectureProgress = asyncHandler(async (req, res) => {
  const { id: lectureId } = req.params;
  const userId = req.user._id;

  const lecture = await Lecture.findById(lectureId).select('courseId').lean();
  if (!lecture) {
    throw new AppError('Lecture not found.', 404);
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
});

export const updateLectureProgress = asyncHandler(async (req, res) => {
  const { id: lectureId } = req.params;
  const userId = req.user._id;
  const { currentTime, duration, completionPercentage, isCompleted, watchTime, lastUpdated } = req.body;

  const lecture = await Lecture.findById(lectureId).select('courseId duration').lean();
  if (!lecture) {
    throw new AppError('Lecture not found.', 404);
  }

  const courseId = lecture.courseId;
  let progress = await Progress.findOne({ user: userId, course: courseId });
  if (!progress) {
    throw new AppError('Enrollment not found. Please enroll first.', 404);
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
});

export const deleteLecture = asyncHandler(async (req, res) => {
  const { courseId, lectureId } = req.params;
  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError('Course not found.', 404);
  }
  if (course.creator.toString() !== req.user._id.toString()) {
    throw new AppError('You can only delete lectures from your own course.', 403);
  }

  const lecture = await Lecture.findOne({ _id: lectureId, courseId });
  if (!lecture) {
    throw new AppError('Lecture not found.', 404);
  }
  await lecture.deleteOne();

  const remaining = await Lecture.find({ courseId }).sort({ order: 1 });
  await Promise.all(
    remaining.map((lec, i) => lec.updateOne({ $set: { order: i } }))
  );

  res.json({ success: true, data: { message: 'Lecture deleted.' } });
});
