import Achievement from '../models/Achievement.js';
import UserAchievement from '../models/UserAchievement.js';
import Progress from '../models/Progress.js';

/**
 * Award achievement to user if not already earned.
 */
export async function awardAchievement(userId, achievementCode) {
  const achievement = await Achievement.findOne({ code: achievementCode });
  if (!achievement) return null;

  const existing = await UserAchievement.findOne({ user: userId, achievement: achievement._id });
  if (existing) return null;

  const ua = await UserAchievement.create({ user: userId, achievement: achievement._id });
  return ua;
}

/**
 * Check and award achievements based on user progress.
 * Call after enrollment, lecture completion, or course completion.
 */
export async function checkAndAwardAchievements(userId) {
  const awarded = [];

  const progressList = await Progress.find({ user: userId }).lean();
  const completedCourses = progressList.filter((p) => p.progress >= 100);
  const hasCertificates = progressList.filter((p) => p.certificateGenerated).length;
  const totalLecturesCompleted = progressList.reduce(
    (sum, p) => sum + (p.lectureProgress?.filter((lp) => lp.isCompleted).length || 0),
    0
  );

  if (progressList.length >= 1) {
    const a = await awardAchievement(userId, 'first_enrollment');
    if (a) awarded.push('first_enrollment');
  }
  if (totalLecturesCompleted >= 1) {
    const a = await awardAchievement(userId, 'first_lecture');
    if (a) awarded.push('first_lecture');
  }
  if (completedCourses.length >= 1) {
    const a = await awardAchievement(userId, 'course_complete_1');
    if (a) awarded.push('course_complete_1');
  }
  if (completedCourses.length >= 5) {
    const a = await awardAchievement(userId, 'course_complete_5');
    if (a) awarded.push('course_complete_5');
  }
  if (hasCertificates >= 1) {
    const a = await awardAchievement(userId, 'certificate_1');
    if (a) awarded.push('certificate_1');
  }

  return awarded;
}
