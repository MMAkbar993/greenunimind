import User from '../models/User.js';
import Teacher from '../models/Teacher.js';
import Progress from '../models/Progress.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { sendVerificationEmail } from '../utils/email.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../middleware/asyncHandler.js';

const parseSignupBody = (req) => {
  if (req.body.data) {
    try {
      return typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
    } catch (e) {
      return null;
    }
  }
  return req.body;
};

// createStudent and createTeacher used to be two ~90-line copies of the same
// signup flow, differing only in the role and the extra Teacher.create call.
// This is the one registration path both now call.
const registerUser = async (req, role) => {
  const body = parseSignupBody(req);
  if (!body || typeof body !== 'object') {
    throw new AppError(
      `Invalid or missing request data. Send JSON with { password, ${role}: { name: { firstName, lastName }, email, gender? } }.`,
      400
    );
  }
  const payload = body?.[role] || body;
  const { name, email, password, gender } = payload;
  const pass = password || body?.password;

  if (!name?.firstName || !name?.lastName || !email || !pass) {
    throw new AppError('First name, last name, email and password are required.', 400);
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new AppError('An account with this email already exists.', 400);
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const user = await User.create({
    name: {
      firstName: name.firstName,
      middleName: name.middleName || '',
      lastName: name.lastName,
    },
    email: email.toLowerCase(),
    password: pass,
    role,
    gender: gender || undefined,
    emailVerificationOTP: otp,
    emailVerificationExpires: new Date(Date.now() + 10 * 60 * 1000),
  });

  if (role === 'teacher') {
    await Teacher.create({ user: user._id });
  }

  sendVerificationEmail(email.toLowerCase(), otp).catch((e) =>
    console.warn('Failed to send verification email:', e.message)
  );

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  const userObj = user.toObject();
  delete userObj.password;

  return {
    user: {
      _id: userObj._id,
      name: userObj.name,
      email: userObj.email,
      role: userObj.role,
      profileImg: userObj.profileImg,
      gender: userObj.gender,
      isEmailVerified: userObj.isEmailVerified,
      createdAt: userObj.createdAt,
      updatedAt: userObj.updatedAt,
    },
    accessToken,
    refreshToken,
  };
};

export const createStudent = asyncHandler(async (req, res) => {
  const data = await registerUser(req, 'student');
  res.status(201).json({ success: true, data });
});

export const createTeacher = asyncHandler(async (req, res) => {
  const data = await registerUser(req, 'teacher');
  res.status(201).json({ success: true, data });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = req.user;
  const enrolledProgress = await Progress.find({ user: user._id })
    .select('course')
    .lean();
  const enrolledCourses = enrolledProgress
    .map((item) => item?.course?.toString())
    .filter(Boolean);

  res.status(200).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImg: user.profileImg,
      gender: user.gender,
      isEmailVerified: user.isEmailVerified,
      enrolledCourses,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});

export const editProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (req.user._id.toString() !== id) {
    throw new AppError('You can only edit your own profile.', 403);
  }

  const allowedFields = ['name', 'gender', 'profileImg'];
  const updates = {};
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError('No valid fields to update.', 400);
  }

  const user = await User.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).select('-password');

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImg: user.profileImg,
      gender: user.gender,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});
