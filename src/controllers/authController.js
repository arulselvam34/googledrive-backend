const User = require('../models/User');
const {
  generateToken,
  hashToken,
  sendEmail,
  generateJWT,
  emailTemplates
} = require('../utils/helpers');

const register = async (req, res, next) => {
  try {
    const { username, firstName, lastName, password, confirmPassword } = req.body;

    // Validation
    if (!username || !firstName || !lastName || !password) {
      return res.status(400).json({
        error: 'Please provide all required fields'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        error: 'Passwords do not match'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        error: 'Email already registered'
      });
    }

    // Generate verification token
    const verificationToken = generateToken();
    const hashedToken = hashToken(verificationToken);

    // Create user
    const user = new User({
      username: username.toLowerCase(),
      firstName,
      lastName,
      password,
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    await user.save();

    // Send verification email
    const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}&email=${username}`;
    await sendEmail(
      username,
      'Verify Your Email - Google Drive',
      emailTemplates.verifyEmail(firstName, verificationLink)
    );

    res.status(201).json({
      message: 'Registration successful. Please verify your email.',
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token, email } = req.body;

    if (!token || !email) {
      return res.status(400).json({
        error: 'Token and email are required'
      });
    }

    const hashedToken = hashToken(token);
    const user = await User.findOne({
      username: email.toLowerCase(),
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired verification token'
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save();

    res.json({
      message: 'Email verified successfully. You can now login.'
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Please provide username and password'
      });
    }

    const user = await User.findOne({ username: username.toLowerCase() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        error: 'Please verify your email before logging in'
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateJWT(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    const user = await User.findOne({ username: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const resetToken = generateToken();
    const hashedToken = hashToken(resetToken);

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpiry = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&email=${email}`;
    await sendEmail(
      email,
      'Reset Your Password - Google Drive',
      emailTemplates.resetPassword(user.firstName, resetLink)
    );

    res.json({
      message: 'Password reset link sent to your email'
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, email, password, confirmPassword } = req.body;

    if (!token || !email || !password) {
      return res.status(400).json({
        error: 'Token, email, and password are required'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        error: 'Passwords do not match'
      });
    }

    const hashedToken = hashToken(token);
    const user = await User.findOne({
      username: email.toLowerCase(),
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired reset token'
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.json({
      message: 'Password reset successful. You can now login with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword
};
