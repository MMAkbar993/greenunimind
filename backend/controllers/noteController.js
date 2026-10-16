import Note from '../models/Note.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../middleware/asyncHandler.js';

/**
 * Create or update the current student's note for a lecture (one note per
 * student per lecture).
 * POST /api/notes/:studentId
 */
export const createOrUpdateNote = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  if (req.user._id.toString() !== studentId) {
    throw new AppError('Access denied.', 403);
  }

  const { lectureId, content, isRichText, tags } = req.body;
  if (!lectureId) {
    throw new AppError('lectureId is required.', 400);
  }

  const note = await Note.findOneAndUpdate(
    { studentId, lectureId },
    {
      $set: {
        content: content ?? '',
        ...(isRichText !== undefined && { isRichText }),
        ...(tags !== undefined && { tags }),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(201).json({ success: true, data: note });
});

/**
 * GET /api/notes/:lectureId/:studentId
 */
export const getNoteByLectureAndStudent = asyncHandler(async (req, res) => {
  const { lectureId, studentId } = req.params;
  if (req.user._id.toString() !== studentId) {
    throw new AppError('Access denied.', 403);
  }

  const note = await Note.findOne({ studentId, lectureId }).lean();
  res.json({ success: true, data: note || null });
});

/**
 * DELETE /api/notes/:id
 */
export const deleteNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) {
    throw new AppError('Note not found.', 404);
  }
  if (note.studentId.toString() !== req.user._id.toString()) {
    throw new AppError('Access denied.', 403);
  }

  await note.deleteOne();
  res.json({ success: true, data: { message: 'Note deleted.' } });
});

/**
 * GET /api/notes/shared/:lectureId
 */
export const getSharedNotes = asyncHandler(async (req, res) => {
  const { lectureId } = req.params;
  const notes = await Note.find({ lectureId, isShared: true }).lean();
  res.json({ success: true, data: notes });
});

/**
 * POST /api/notes/share/:noteId
 */
export const shareNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.noteId);
  if (!note) {
    throw new AppError('Note not found.', 404);
  }
  if (note.studentId.toString() !== req.user._id.toString()) {
    throw new AppError('Access denied.', 403);
  }

  const { studentIds } = req.body;
  note.isShared = true;
  note.sharedWith = Array.isArray(studentIds) ? studentIds : [];
  await note.save();

  res.json({ success: true, data: note });
});
