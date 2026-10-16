import crypto from 'crypto';
import { generateSecret as generateTotpSecret, generateURI as generateTotpURI, verify as verifyTotp } from 'otplib';
import QRCode from 'qrcode';
import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../middleware/asyncHandler.js';

const generateBackupCodes = () => {
  const codes = [];
  for (let i = 0; i < 8; i++) {
    codes.push(crypto.randomBytes(4).toString('hex'));
  }
  return codes;
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new AppError('Email and password are required.', 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('Account is deactivated.', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (user.twoFactorEnabled) {
    return res.status(403).json({
      success: false,
      message: 'Two-factor authentication required.',
      data: { requiresTwoFactor: true, email: user.email },
    });
  }

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  const userObj = user.toObject();
  delete userObj.password;

  res.status(200).json({
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
});

const googleLogin = asyncHandler(async (req, res) => {
  const { googleId, email, name, photoUrl, role } = req.body;

  if (!googleId || !email) {
    throw new AppError('Google account information is required.', 400);
  }

  let user = await User.findOne({ email: email.toLowerCase() }).select('+googleId');

  if (user) {
    if (!user.isActive) {
      throw new AppError('Account is deactivated.', 401);
    }

    if (!user.googleId) {
      user.googleId = googleId;
      if (photoUrl && !user.profileImg) user.profileImg = photoUrl;
      await user.save({ validateModifiedOnly: true });
    }
  } else {
    const nameParts = (name || 'Google User').trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;

    try {
      user = await User.create({
        name: { firstName, lastName },
        email: email.toLowerCase(),
        password: crypto.randomBytes(16).toString('hex'),
        role: role === 'teacher' ? 'teacher' : 'student',
        googleId,
        profileImg: photoUrl || null,
        isEmailVerified: true,
      });
    } catch (err) {
      if (err.code === 11000) {
        throw new AppError('This Google account is already linked to another user.', 409);
      }
      throw err;
    }
  }

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.googleId;

  const responseUser = {
    _id: userObj._id,
    name: userObj.name,
    email: userObj.email,
    role: userObj.role,
    profileImg: userObj.profileImg,
    gender: userObj.gender,
    isEmailVerified: userObj.isEmailVerified,
    createdAt: userObj.createdAt,
    updatedAt: userObj.updatedAt,
  };

  res.status(200).json({
    success: true,
    token: accessToken,
    accessToken,
    refreshToken,
    user: responseUser,
    data: {
      user: responseUser,
      accessToken,
      refreshToken,
    },
  });
});

const logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

const refreshToken = asyncHandler(async (req, res) => {
  let token =
    req.body?.refreshToken ||
    req.headers['x-refresh-token'] ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null);

  if (!token) {
    throw new AppError('Refresh token is required.', 401);
  }

  // verifyRefreshToken throws JsonWebTokenError/TokenExpiredError on a bad
  // token - the central error handler maps those to 401 for us.
  const decoded = verifyRefreshToken(token);
  const user = await User.findById(decoded.id).select('-password');
  if (!user) {
    throw new AppError('User not found.', 401);
  }
  if (!user.isActive) {
    throw new AppError('Account is deactivated.', 401);
  }

  const accessToken = generateAccessToken(user._id, user.role);
  const newRefreshToken = generateRefreshToken(user._id);

  res.status(200).json({
    success: true,
    data: {
      accessToken,
      refreshToken: newRefreshToken,
    },
  });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    throw new AppError('Email and OTP are required.', 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() })
    .select('+emailVerificationOTP +emailVerificationExpires');

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (user.isEmailVerified) {
    throw new AppError('Email is already verified.', 400);
  }

  if (!user.emailVerificationOTP || !user.emailVerificationExpires) {
    throw new AppError('No verification code found. Please request a new one.', 400);
  }

  if (user.emailVerificationExpires < new Date()) {
    throw new AppError('Verification code has expired. Please request a new one.', 400);
  }

  if (user.emailVerificationOTP !== otp) {
    throw new AppError('Invalid verification code.', 400);
  }

  user.isEmailVerified = true;
  user.emailVerificationOTP = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateModifiedOnly: true });

  res.json({
    success: true,
    message: 'Email verified successfully.',
    data: { isEmailVerified: true },
  });
});

const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new AppError('Email is required.', 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (user.isEmailVerified) {
    throw new AppError('Email is already verified.', 400);
  }

  const otp = generateOTP();
  user.emailVerificationOTP = otp;
  user.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save({ validateModifiedOnly: true });

  await sendVerificationEmail(email, otp);

  res.json({ success: true, message: 'Verification code sent.' });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new AppError('Email is required.', 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save({ validateModifiedOnly: true });

  await sendPasswordResetEmail(email, resetToken);

  res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    throw new AppError('Token and new password are required.', 400);
  }

  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters.', 400);
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    throw new AppError('Invalid or expired reset token.', 400);
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new AppError('Current and new passwords are required.', 400);
  }

  if (newPassword.length < 8) {
    throw new AppError('New password must be at least 8 characters.', 400);
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Current password is incorrect.', 401);
  }

  user.password = newPassword;
  await user.save();

  const accessToken = generateAccessToken(user._id, user.role);
  const newRefreshToken = generateRefreshToken(user._id);

  res.json({
    success: true,
    message: 'Password changed successfully.',
    data: { accessToken, refreshToken: newRefreshToken },
  });
});

const getRateLimitStatus = asyncHandler(async (req, res) => {
  const { email } = req.query;
  res.json({
    success: true,
    data: {
      remaining: parseInt(res.getHeader('RateLimit-Remaining') || '20'),
      limit: parseInt(res.getHeader('RateLimit-Limit') || '20'),
      resetAt: res.getHeader('RateLimit-Reset') || null,
      canResend: true,
      email: email || null,
    },
  });
});

/**
 * Generates a fresh TOTP secret + QR code. The secret isn't persisted here -
 * it's only saved once the user proves they scanned it correctly via
 * verifyTwoFactor, which receives the same secret back from the client.
 * GET /auth/2fa/setup/:userId
 */
const setupTwoFactor = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (req.user._id.toString() !== userId) {
    throw new AppError('Access denied.', 403);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (user.twoFactorEnabled) {
    return res.json({ success: true, data: { enabled: true, qrCodeUrl: null, secret: null } });
  }

  const secret = generateTotpSecret();
  const otpauth = generateTotpURI({ issuer: 'GreenUniMind', label: user.email, secret });
  const qrCodeUrl = await QRCode.toDataURL(otpauth);

  res.json({ success: true, data: { enabled: false, qrCodeUrl, secret } });
});

/**
 * Confirms setup: verifies the code against the secret the client just
 * scanned, and only then persists the secret and turns 2FA on.
 * POST /auth/2fa/verify
 */
const verifyTwoFactor = asyncHandler(async (req, res) => {
  const { userId, token, secret } = req.body;
  if (req.user._id.toString() !== userId) {
    throw new AppError('Access denied.', 403);
  }
  if (!token || !secret) {
    throw new AppError('Verification code and secret are required.', 400);
  }

  const result = await verifyTotp({ token, secret });
  if (!result.valid) {
    throw new AppError('Invalid verification code.', 400);
  }

  const backupCodes = generateBackupCodes();
  await User.findByIdAndUpdate(userId, {
    twoFactorEnabled: true,
    twoFactorSecret: secret,
    twoFactorBackupCodes: backupCodes,
  });

  res.json({ success: true, data: { verified: true, backupCodes } });
});

/**
 * Completes a login that was interrupted by `login` returning
 * requiresTwoFactor - this is intentionally public (no `protect`), since the
 * user doesn't have a token yet at this point.
 * POST /auth/2fa/login-verify
 */
const verifyLoginTwoFactor = asyncHandler(async (req, res) => {
  const { email, token } = req.body;
  if (!email || !token) {
    throw new AppError('Email and verification code are required.', 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+twoFactorSecret +twoFactorBackupCodes'
  );
  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    throw new AppError('Two-factor authentication is not enabled for this account.', 400);
  }

  const totpResult = await verifyTotp({ token, secret: user.twoFactorSecret });
  let isValid = totpResult.valid;

  // Fall back to a one-time backup code, consuming it if it matches.
  if (!isValid && user.twoFactorBackupCodes?.includes(token)) {
    isValid = true;
    user.twoFactorBackupCodes = user.twoFactorBackupCodes.filter((code) => code !== token);
    await user.save();
  }

  if (!isValid) {
    throw new AppError('Invalid verification code.', 401);
  }

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  res.status(200).json({
    success: true,
    data: {
      user: {
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
      accessToken,
      refreshToken,
    },
  });
});

/**
 * POST /auth/2fa/disable
 */
const disableTwoFactor = asyncHandler(async (req, res) => {
  const { userId, password } = req.body;
  if (req.user._id.toString() !== userId) {
    throw new AppError('Access denied.', 403);
  }
  if (!password) {
    throw new AppError('Password is required to disable two-factor authentication.', 400);
  }

  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Incorrect password.', 401);
  }

  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  user.twoFactorBackupCodes = undefined;
  await user.save();

  res.json({ success: true, data: { disabled: true } });
});

export {
  login,
  googleLogin,
  logout,
  refreshToken,
  verifyOtp,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  getRateLimitStatus,
  setupTwoFactor,
  verifyTwoFactor,
  verifyLoginTwoFactor,
  disableTwoFactor,
};
