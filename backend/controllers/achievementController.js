import Achievement from '../models/Achievement.js';
import UserAchievement from '../models/UserAchievement.js';
import Progress from '../models/Progress.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../middleware/asyncHandler.js';

/**
 * Get all achievements (for display).
 * GET /api/achievements
 */
export const getAllAchievements = asyncHandler(async (req, res) => {
  const achievements = await Achievement.find().sort({ category: 1, points: -1 }).lean();
  res.json({ success: true, data: achievements });
});

/**
 * Get user's earned achievements.
 * GET /api/achievements/my
 */
export const getMyAchievements = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new AppError('Login required.', 401);
  }

  const userAchievements = await UserAchievement.find({ user: userId })
    .populate('achievement')
    .sort({ earnedAt: -1 })
    .lean();

  res.json({
    success: true,
    data: userAchievements.map((ua) => ({
      ...ua.achievement,
      earnedAt: ua.earnedAt,
    })),
  });
});

/**
 * Seed default achievements (run once). Not a route handler — called
 * directly from server.js at startup, so it's intentionally not wrapped in
 * asyncHandler (that wrapper is for (req, res) Express handlers only).
 */
export const seedAchievements = async () => {
  const defaults = [
    { code: 'first_enrollment', name: 'First Step', description: 'Enroll in your first course', icon: 'book-open', category: 'learning', points: 10 },
    { code: 'first_lecture', name: 'Getting Started', description: 'Complete your first lecture', icon: 'play', category: 'learning', points: 15 },
    { code: 'course_complete_1', name: 'Course Graduate', description: 'Complete your first course', icon: 'graduation-cap', category: 'completion', points: 50 },
    { code: 'course_complete_5', name: 'Dedicated Learner', description: 'Complete 5 courses', icon: 'award', category: 'milestone', points: 100 },
    { code: 'certificate_1', name: 'Certified', description: 'Earn your first certificate', icon: 'medal', category: 'completion', points: 75 },
    { code: 'sustainability_starter', name: 'Sustainability Starter', description: 'Complete a sustainability course', icon: 'leaf', category: 'special', points: 25 },
  ];

  for (const a of defaults) {
    await Achievement.findOneAndUpdate(
      { code: a.code },
      { $setOnInsert: a },
      { upsert: true, new: true }
    );
  }
};
