const crypto = require('crypto');

// Generate random token
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Hash token (for storage)
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Send email
const sendEmail = async (to, subject, html) => {
  const nodemailer = require('nodemailer');

  const transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject,
    html
  };

  return transporter.sendMail(mailOptions);
};

// Generate JWT
const generateJWT = (userId) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Email templates
const emailTemplates = {
  verifyEmail: (firstName, verificationLink) => `
    <h2>Welcome to Google Drive, ${firstName}!</h2>
    <p>Please verify your email address by clicking the link below:</p>
    <a href="${verificationLink}" style="
      display: inline-block;
      padding: 10px 20px;
      background-color: #4CAF50;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    ">Verify Email</a>
    <p>This link expires in 24 hours.</p>
    <p>If you did not request this, please ignore this email.</p>
  `,
  resetPassword: (firstName, resetLink) => `
    <h2>Password Reset Request</h2>
    <p>Hi ${firstName},</p>
    <p>Click the link below to reset your password:</p>
    <a href="${resetLink}" style="
      display: inline-block;
      padding: 10px 20px;
      background-color: #2196F3;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    ">Reset Password</a>
    <p>This link expires in 30 minutes.</p>
    <p>If you did not request this, please ignore this email.</p>
  `
};

module.exports = {
  generateToken,
  hashToken,
  sendEmail,
  generateJWT,
  emailTemplates
};
