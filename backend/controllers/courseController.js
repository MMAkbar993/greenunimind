import Course from '../models/Course.js';
import Lecture from '../models/Lecture.js';
import { uploadCourseThumbnail, deleteCourseThumbnail } from '../utils/cloudinary.js';

function parseCourseBody(req) {
  if (req.body.data) {
    try {
      return typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
    } catch (e) {
      return null;
    }
  }
  return req.body;
}

// Accepts an array, a JSON-stringified array, or newline/comma-separated text
// (the teacher-facing form sends one textarea per list) and returns a clean
// array of non-empty strings.
function normalizeStringList(value) {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    let items = value;
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) items = parsed;
    } catch (e) {
      items = value.split(/\r?\n|,/);
    }
    if (typeof items === 'string') items = items.split(/\r?\n|,/);
    return items.map((v) => String(v).trim()).filter(Boolean);
  }
  return [];
}

// Fields that let someone actually watch/read a lecture. These are stripped out
// unless the viewer is enrolled, is the course creator, or the lecture is
// flagged isPreviewFree — otherwise the public course-details endpoints were
// handing out playable video URLs for paid lectures to anyone who asked.
const LECTURE_MEDIA_FIELDS = ['videoUrl', 'videoResolutions', 'hlsUrl', 'audioUrl', 'articleContent', 'pdfUrl'];

async function attachLectures(courses, viewerId) {
  const list = Array.isArray(courses) ? courses : [courses];
  const ids = list.map((c) => c._id);
  const lectures = await Lecture.find({ courseId: { $in: ids } }).sort({ order: 1 }).lean();
  const byCourse = {};
  for (const lec of lectures) {
    const cid = lec.courseId.toString();
    if (!byCourse[cid]) byCourse[cid] = [];
    byCourse[cid].push(lec);
  }
  return list.map((c) => {
    const plain = c.toObject ? c.toObject() : c;
    const isCreator = viewerId && plain.creator && plain.creator.toString() === viewerId.toString();
    const isEnrolled = viewerId && Array.isArray(plain.enrolledStudents) &&
      plain.enrolledStudents.some((id) => id.toString() === viewerId.toString());
    const unlockedForViewer = isCreator || isEnrolled;

    const lecturesForViewer = (byCourse[c._id.toString()] || []).map((lec) => {
      if (unlockedForViewer || lec.isPreviewFree) return lec;
      const redacted = { ...lec };
      for (const field of LECTURE_MEDIA_FIELDS) delete redacted[field];
      return redacted;
    });

    return { ...plain, lectures: lecturesForViewer };
  });
}

export const createCourse = async (req, res) => {
  try {
    const teacherId = req.params.teacherId;
    if (req.user._id.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: 'You can only create courses as yourself.' });
    }

    const body = parseCourseBody(req) || req.body || {};
    const title = body.title ?? req.body?.title;
    const subtitle = body.subtitle ?? req.body?.subtitle ?? '';
    const description = body.description ?? req.body?.description ?? '';
    const category = body.category ?? body.categoryId ?? req.body?.category ?? req.body?.categoryId;
    const subcategory = body.subcategory ?? body.subcategoryId ?? req.body?.subcategory ?? req.body?.subcategoryId ?? '';
    const courseLevel = body.courseLevel ?? req.body?.courseLevel ?? 'Beginner';
    const coursePrice = Number(body.coursePrice ?? req.body?.coursePrice ?? 0);
    const isFree = (body.isFree ?? req.body?.isFree ?? 'false').toString();
    const status = body.status ?? req.body?.status ?? 'draft';
    const isPublished = status === 'published';
    const learningObjectives = normalizeStringList(body.learningObjectives ?? req.body?.learningObjectives);
    const prerequisites = (body.prerequisites ?? req.body?.prerequisites ?? '').toString();
    const targetAudience = (body.targetAudience ?? req.body?.targetAudience ?? '').toString();

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, description and category are required.',
      });
    }

    let courseThumbnail = null;
    let courseThumbnailPublicId = null;
    const file = req.file || (req.files && req.files.file ? req.files.file[0] : null) || null;
    if (file && file.buffer) {
      const uploaded = await uploadCourseThumbnail(file.buffer, file.originalname);
      courseThumbnail = uploaded.url;
      courseThumbnailPublicId = uploaded.publicId;
    }

    const course = await Course.create({
      title,
      subtitle,
      description,
      category: category.toString().trim(),
      subcategory: subcategory ? subcategory.toString().trim() : '',
      courseLevel,
      coursePrice,
      courseThumbnail,
      courseThumbnailPublicId,
      creator: teacherId,
      isPublished,
      status,
      isFree,
      learningObjectives,
      prerequisites,
      targetAudience,
    });

    const withLectures = await attachLectures([course], teacherId);
    res.status(201).json({
      success: true,
      data: withLectures[0],
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to create course.',
    });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).lean();
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }
    const isPublished = course.isPublished && course.status === 'published';
    const isCreator = req.user && course.creator.toString() === req.user._id.toString();
    if (!isPublished && !isCreator) {
      return res.status(403).json({ success: false, message: 'Course is not available.' });
    }
    const withLectures = await attachLectures([course], req.user?._id);
    res.json({ success: true, data: withLectures[0] });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch course.',
    });
  }
};

export const getCreatorCourses = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const courses = await Course.find({ creator: teacherId }).sort({ updatedAt: -1 }).lean();
    const withLectures = await attachLectures(courses, req.user._id);
    res.json({ success: true, data: withLectures });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch courses.',
    });
  }
};

export const getPublishedCourses = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const skip = (page - 1) * limit;
    const courses = await Course.find({ isPublished: true, status: 'published' })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    const withLectures = await attachLectures(courses);
    res.json({ success: true, data: withLectures });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch courses.',
    });
  }
};

export const getPopularCourses = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const courses = await Course.find({ isPublished: true, status: 'published' })
      .sort({ totalEnrollment: -1, updatedAt: -1 })
      .limit(limit)
      .lean();
    const withLectures = await attachLectures(courses);
    res.json({ success: true, data: withLectures });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch courses.',
    });
  }
};

export const searchCourses = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json({ success: true, data: [] });
    }
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const courses = await Course.find({
      isPublished: true,
      status: 'published',
      $or: [
        { title: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
        { subtitle: new RegExp(q, 'i') },
      ],
    })
      .limit(limit)
      .lean();
    const withLectures = await attachLectures(courses);
    res.json({ success: true, data: withLectures });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to search courses.',
    });
  }
};

export const editCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }
    if (course.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own course.' });
    }

    const body = parseCourseBody(req) || req.body;
    const updates = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.subtitle !== undefined) updates.subtitle = body.subtitle;
    if (body.description !== undefined) updates.description = body.description;
    if (body.category !== undefined || body.categoryId !== undefined) updates.category = (body.category ?? body.categoryId ?? course.category).toString().trim();
    if (body.subcategory !== undefined || body.subcategoryId !== undefined) updates.subcategory = (body.subcategory ?? body.subcategoryId ?? course.subcategory ?? '').toString().trim();
    if (body.courseLevel !== undefined) updates.courseLevel = body.courseLevel;
    if (body.coursePrice !== undefined) updates.coursePrice = Number(body.coursePrice);
    if (body.isFree !== undefined) updates.isFree = body.isFree.toString();
    if (body.status !== undefined) {
      updates.status = body.status;
      updates.isPublished = body.status === 'published';
    }
    if (body.learningObjectives !== undefined) updates.learningObjectives = normalizeStringList(body.learningObjectives);
    if (body.prerequisites !== undefined) updates.prerequisites = body.prerequisites.toString();
    if (body.targetAudience !== undefined) updates.targetAudience = body.targetAudience.toString();

    const thumbFile = req.file || (req.files && req.files.file ? req.files.file[0] : null) || null;
    if (thumbFile && thumbFile.buffer) {
      const uploaded = await uploadCourseThumbnail(thumbFile.buffer, thumbFile.originalname);
      updates.courseThumbnail = uploaded.url;
      updates.courseThumbnailPublicId = uploaded.publicId;

      if (course.courseThumbnailPublicId) {
        await deleteCourseThumbnail(course.courseThumbnailPublicId);
      }
    }

    Object.assign(course, updates);
    await course.save();

    const withLectures = await attachLectures([course], req.user._id);
    res.json({ success: true, data: withLectures[0] });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to update course.',
    });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }
    if (course.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own course.' });
    }
    if (course.courseThumbnailPublicId) {
      await deleteCourseThumbnail(course.courseThumbnailPublicId);
    }
    await Lecture.deleteMany({ courseId: course._id });
    await course.deleteOne();
    res.json({ success: true, data: { message: 'Course deleted.' } });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to delete course.',
    });
  }
};
