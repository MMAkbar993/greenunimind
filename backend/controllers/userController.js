import User from '../models/User.js';
import Teacher from '../models/Teacher.js';
import Progress from '../models/Progress.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { sendVerificationEmail } from '../utils/email.js';

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

const createStudent = async (req, res) => {
  try {
    const body = parseSignupBody(req);
    if (!body || typeof body !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing request data. Send JSON with { password, student: { name: { firstName, lastName }, email, gender? } }.',
      });
    }
    const payload = body?.student || body;
    const { name, email, password, gender } = payload;
    const pass = password || body?.password;

    if (!name?.firstName || !name?.lastName || !email || !pass) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email and password are required.',
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
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
      role: 'student',
      gender: gender || undefined,
      emailVerificationOTP: otp,
      emailVerificationExpires: new Date(Date.now() + 10 * 60 * 1000),
    });

    sendVerificationEmail(email.toLowerCase(), otp).catch((e) =>
      console.warn('Failed to send verification email:', e.message)
    );

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({
      success: true,
      data: {
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
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Registration failed.',
    });
  }
};

const createTeacher = async (req, res) => {
  try {
    const body = parseSignupBody(req);
    if (!body || typeof body !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing request data. Send JSON with { password, teacher: { name: { firstName, lastName }, email, gender? } }.',
      });
    }
    const payload = body?.teacher || body;
    const { name, email, password, gender } = payload;
    const pass = password || body?.password;

    if (!name?.firstName || !name?.lastName || !email || !pass) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email and password are required.',
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
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
      role: 'teacher',
      gender: gender || undefined,
      emailVerificationOTP: otp,
      emailVerificationExpires: new Date(Date.now() + 10 * 60 * 1000),
    });

    await Teacher.create({ user: user._id });

    sendVerificationEmail(email.toLowerCase(), otp).catch((e) =>
      console.warn('Failed to send verification email:', e.message)
    );

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({
      success: true,
      data: {
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
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Registration failed.',
    });
  }
};

const getMe = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to get user.',
    });
  }
};

const editProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user._id.toString() !== id) {
      return res.status(403).json({ success: false, message: 'You can only edit your own profile.' });
    }

    const allowedFields = ['name', 'gender', 'profileImg'];
    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update.' });
    }

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
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
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update profile.' });
  }
};

export { createStudent, createTeacher, getMe, editProfile };
