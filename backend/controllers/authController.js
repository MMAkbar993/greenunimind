import crypto from 'crypto';
import { generateSecret as generateTotpSecret, generateURI as generateTotpURI, verify as verifyTotp } from 'otplib';
import QRCode from 'qrcode';
import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';

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

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
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
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Login failed.',
    });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { googleId, email, name, photoUrl, role } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({
        success: false,
        message: 'Google account information is required.',
      });
    }

    let user = await User.findOne({ email: email.toLowerCase() }).select('+googleId');

    if (user) {
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated.',
        });
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

      user = await User.create({
        name: { firstName, lastName },
        email: email.toLowerCase(),
        password: crypto.randomBytes(16).toString('hex'),
        role: role === 'teacher' ? 'teacher' : 'student',
        googleId,
        profileImg: photoUrl || null,
        isEmailVerified: true,
      });
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
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This Google account is already linked to another user.',
      });
    }
    res.status(500).json({
      success: false,
      message: err.message || 'Google sign in failed.',
    });
  }
};

const logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Logout failed.',
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    let token =
      req.body?.refreshToken ||
      req.headers['x-refresh-token'] ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : null);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required.',
      });
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.',
      });
    }
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.',
      });
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
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token.',
      });
    }
    res.status(500).json({
      success: false,
      message: err.message || 'Token refresh failed.',
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+emailVerificationOTP +emailVerificationExpires');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified.' });
    }

    if (!user.emailVerificationOTP || !user.emailVerificationExpires) {
      return res.status(400).json({ success: false, message: 'No verification code found. Please request a new one.' });
    }

    if (user.emailVerificationExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
    }

    if (user.emailVerificationOTP !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid verification code.' });
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
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Verification failed.' });
  }
};

const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified.' });
    }

    const otp = generateOTP();
    user.emailVerificationOTP = otp;
    user.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateModifiedOnly: true });

    await sendVerificationEmail(email, otp);

    res.json({ success: true, message: 'Verification code sent.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to resend verification.' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
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
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to process request.' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and new password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Password reset failed.' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
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
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to change password.' });
  }
};

const getRateLimitStatus = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get rate limit status.' });
  }
};

/**
 * Generates a fresh TOTP secret + QR code. The secret isn't persisted here -
 * it's only saved once the user proves they scanned it correctly via
 * verifyTwoFactor, which receives the same secret back from the client.
 * GET /auth/2fa/setup/:userId
 */
const setupTwoFactor = async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.twoFactorEnabled) {
      return res.json({ success: true, data: { enabled: true, qrCodeUrl: null, secret: null } });
    }

    const secret = generateTotpSecret();
    const otpauth = generateTotpURI({ issuer: 'GreenUniMind', label: user.email, secret });
    const qrCodeUrl = await QRCode.toDataURL(otpauth);

    res.json({ success: true, data: { enabled: false, qrCodeUrl, secret } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to start two-factor setup.' });
  }
};

/**
 * Confirms setup: verifies the code against the secret the client just
 * scanned, and only then persists the secret and turns 2FA on.
 * POST /auth/2fa/verify
 */
const verifyTwoFactor = async (req, res) => {
  try {
    const { userId, token, secret } = req.body;
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (!token || !secret) {
      return res.status(400).json({ success: false, message: 'Verification code and secret are required.' });
    }

    const result = await verifyTotp({ token, secret });
    if (!result.valid) {
      return res.status(400).json({ success: false, message: 'Invalid verification code.' });
    }

    const backupCodes = generateBackupCodes();
    await User.findByIdAndUpdate(userId, {
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      twoFactorBackupCodes: backupCodes,
    });

    res.json({ success: true, data: { verified: true, backupCodes } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to verify two-factor code.' });
  }
};

/**
 * Completes a login that was interrupted by `login` returning
 * requiresTwoFactor - this is intentionally public (no `protect`), since the
 * user doesn't have a token yet at this point.
 * POST /auth/2fa/login-verify
 */
const verifyLoginTwoFactor = async (req, res) => {
  try {
    const { email, token } = req.body;
    if (!email || !token) {
      return res.status(400).json({ success: false, message: 'Email and verification code are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+twoFactorSecret +twoFactorBackupCodes'
    );
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res
        .status(400)
        .json({ success: false, message: 'Two-factor authentication is not enabled for this account.' });
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
      return res.status(401).json({ success: false, message: 'Invalid verification code.' });
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
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Two-factor verification failed.' });
  }
};

/**
 * POST /auth/2fa/disable
 */
const disableTwoFactor = async (req, res) => {
  try {
    const { userId, password } = req.body;
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: 'Password is required to disable two-factor authentication.' });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = undefined;
    await user.save();

    res.json({ success: true, data: { disabled: true } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to disable two-factor authentication.' });
  }
};

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
