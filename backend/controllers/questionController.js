import Question from '../models/Question.js';
import Course from '../models/Course.js';
import Lecture from '../models/Lecture.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../middleware/asyncHandler.js';

/**
 * All student questions across every course the teacher owns, for the
 * teacher's Q&A inbox.
 * GET /api/questions/teacher/:teacherId
 */
export const getQuestionsByTeacher = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;
  const currentUserId = req.user._id.toString();
  if (currentUserId !== teacherId || req.user.role !== 'teacher') {
    throw new AppError('Access denied.', 403);
  }

  const courses = await Course.find({ creator: teacherId }).select('_id title').lean();
  const courseIds = courses.map((c) => c._id);
  const courseMap = Object.fromEntries(courses.map((c) => [c._id.toString(), c]));

  const lectures = await Lecture.find({ courseId: { $in: courseIds } })
    .select('_id lectureTitle courseId')
    .lean();
  const lectureIds = lectures.map((l) => l._id);
  const lectureMap = Object.fromEntries(lectures.map((l) => [l._id.toString(), l]));

  const questions = await Question.find({ lectureId: { $in: lectureIds } })
    .populate('studentId', 'name email profileImg')
    .sort({ answered: 1, createdAt: -1 })
    .lean();

  const data = questions.map((q) => {
    const lecture = lectureMap[q.lectureId.toString()];
    const course = lecture ? courseMap[lecture.courseId.toString()] : undefined;
    return {
      _id: q._id,
      question: q.question,
      timestamp: q.timestamp,
      answered: q.answered,
      answer: q.answer,
      answeredAt: q.answeredAt,
      createdAt: q.createdAt,
      student: q.studentId,
      lectureId: q.lectureId,
      lectureTitle: lecture?.lectureTitle || 'Unknown lecture',
      courseId: lecture?.courseId,
      courseTitle: course?.title || 'Unknown course',
    };
  });

  res.json({
    success: true,
    data: {
      questions: data,
      unansweredCount: data.filter((q) => !q.answered).length,
    },
  });
});

/**
 * POST /api/questions/:studentId
 */
export const createQuestion = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  if (req.user._id.toString() !== studentId) {
    throw new AppError('Access denied.', 403);
  }

  const { lectureId, question, timestamp } = req.body;
  if (!lectureId || !question?.trim()) {
    throw new AppError('lectureId and question are required.', 400);
  }

  const newQuestion = await Question.create({
    studentId,
    lectureId,
    question: question.trim(),
    timestamp: timestamp || 0,
  });

  res.status(201).json({ success: true, data: newQuestion });
});

/**
 * GET /api/questions/:lectureId/:studentId
 */
export const getQuestionsByLectureAndStudent = asyncHandler(async (req, res) => {
  const { lectureId, studentId } = req.params;
  if (req.user._id.toString() !== studentId) {
    throw new AppError('Access denied.', 403);
  }

  const questions = await Question.find({ lectureId, studentId })
    .sort({ timestamp: 1 })
    .lean();
  res.json({ success: true, data: questions });
});

/**
 * All students' questions for a lecture (instructor view).
 * GET /api/questions/lecture/:lectureId
 */
export const getQuestionsByLecture = asyncHandler(async (req, res) => {
  const { lectureId } = req.params;
  const questions = await Question.find({ lectureId })
    .populate('studentId', 'name email')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: questions });
});

/**
 * PATCH /api/questions/answer/:id
 */
export const answerQuestion = asyncHandler(async (req, res) => {
  if (req.user.role !== 'teacher') {
    throw new AppError('Only instructors can answer questions.', 403);
  }

  const { answer } = req.body;
  if (!answer?.trim()) {
    throw new AppError('Answer text is required.', 400);
  }

  const question = await Question.findByIdAndUpdate(
    req.params.id,
    {
      answer: answer.trim(),
      answered: true,
      answeredBy: req.user._id,
      answeredAt: new Date(),
    },
    { new: true }
  );

  if (!question) {
    throw new AppError('Question not found.', 404);
  }

  res.json({ success: true, data: question });
});

/**
 * PATCH /api/questions/:id
 */
export const updateQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    throw new AppError('Question not found.', 404);
  }
  if (question.studentId.toString() !== req.user._id.toString()) {
    throw new AppError('Access denied.', 403);
  }

  const { question: questionText, timestamp } = req.body;
  if (questionText !== undefined) question.question = questionText;
  if (timestamp !== undefined) question.timestamp = timestamp;
  await question.save();

  res.json({ success: true, data: question });
});

/**
 * DELETE /api/questions/:id
 */
export const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    throw new AppError('Question not found.', 404);
  }
  if (question.studentId.toString() !== req.user._id.toString()) {
    throw new AppError('Access denied.', 403);
  }

  await question.deleteOne();
  res.json({ success: true, data: { message: 'Question deleted.' } });
});
