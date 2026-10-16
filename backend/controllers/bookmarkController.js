import Bookmark from '../models/Bookmark.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../middleware/asyncHandler.js';

/**
 * POST /api/bookmarks/:studentId
 */
export const createBookmark = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  if (req.user._id.toString() !== studentId) {
    throw new AppError('Access denied.', 403);
  }

  const { title, timestamp, lectureId, category, tags, notes } = req.body;
  if (!lectureId || !title?.trim()) {
    throw new AppError('lectureId and title are required.', 400);
  }

  const bookmark = await Bookmark.create({
    studentId,
    lectureId,
    title: title.trim(),
    timestamp: timestamp || 0,
    category: category || 'Uncategorized',
    tags: tags || [],
    notes: notes || '',
  });

  res.status(201).json({ success: true, data: bookmark });
});

/**
 * GET /api/bookmarks/:lectureId/:studentId
 */
export const getBookmarksByLectureAndStudent = asyncHandler(async (req, res) => {
  const { lectureId, studentId } = req.params;
  if (req.user._id.toString() !== studentId) {
    throw new AppError('Access denied.', 403);
  }

  const bookmarks = await Bookmark.find({ studentId, lectureId })
    .sort({ timestamp: 1 })
    .lean();
  res.json({ success: true, data: bookmarks });
});

/**
 * PATCH /api/bookmarks/:id
 */
export const updateBookmark = asyncHandler(async (req, res) => {
  const bookmark = await Bookmark.findById(req.params.id);
  if (!bookmark) {
    throw new AppError('Bookmark not found.', 404);
  }
  if (bookmark.studentId.toString() !== req.user._id.toString()) {
    throw new AppError('Access denied.', 403);
  }

  const { title, category, tags, notes, timestamp } = req.body;
  if (title !== undefined) bookmark.title = title;
  if (category !== undefined) bookmark.category = category;
  if (tags !== undefined) bookmark.tags = tags;
  if (notes !== undefined) bookmark.notes = notes;
  if (timestamp !== undefined) bookmark.timestamp = timestamp;
  await bookmark.save();

  res.json({ success: true, data: bookmark });
});

/**
 * DELETE /api/bookmarks/:id
 */
export const deleteBookmark = asyncHandler(async (req, res) => {
  const bookmark = await Bookmark.findById(req.params.id);
  if (!bookmark) {
    throw new AppError('Bookmark not found.', 404);
  }
  if (bookmark.studentId.toString() !== req.user._id.toString()) {
    throw new AppError('Access denied.', 403);
  }

  await bookmark.deleteOne();
  res.json({ success: true, data: { message: 'Bookmark deleted.' } });
});

/**
 * GET /api/bookmarks/shared/:lectureId
 */
export const getSharedBookmarks = asyncHandler(async (req, res) => {
  const { lectureId } = req.params;
  const bookmarks = await Bookmark.find({ lectureId, isShared: true }).lean();
  res.json({ success: true, data: bookmarks });
});

/**
 * POST /api/bookmarks/share/:bookmarkId
 */
export const shareBookmark = asyncHandler(async (req, res) => {
  const bookmark = await Bookmark.findById(req.params.bookmarkId);
  if (!bookmark) {
    throw new AppError('Bookmark not found.', 404);
  }
  if (bookmark.studentId.toString() !== req.user._id.toString()) {
    throw new AppError('Access denied.', 403);
  }

  const { studentIds } = req.body;
  bookmark.isShared = true;
  bookmark.sharedWith = Array.isArray(studentIds) ? studentIds : [];
  await bookmark.save();

  res.json({ success: true, data: bookmark });
});

/**
 * GET /api/bookmarks/category/:studentId/:category
 */
export const getBookmarksByCategory = asyncHandler(async (req, res) => {
  const { studentId, category } = req.params;
  if (req.user._id.toString() !== studentId) {
    throw new AppError('Access denied.', 403);
  }

  const bookmarks = await Bookmark.find({ studentId, category })
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: bookmarks });
});

/**
 * POST /api/bookmarks/tags/:studentId
 */
export const getBookmarksByTags = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  if (req.user._id.toString() !== studentId) {
    throw new AppError('Access denied.', 403);
  }

  const { tags } = req.body;
  if (!Array.isArray(tags) || tags.length === 0) {
    return res.json({ success: true, data: [] });
  }

  const bookmarks = await Bookmark.find({ studentId, tags: { $in: tags } })
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: bookmarks });
});
