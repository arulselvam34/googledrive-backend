const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

/* =========================
   TOKEN HELPERS
========================= */

// Generate random token (for email verification & reset)
const generateToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Hash token before saving in DB
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/* =========================
   EMAIL SENDER (RENDER SAFE)
========================= */

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,          // ✅ REQUIRED on Render
      secure: false,      // ✅ MUST be false
      auth: {
        user: process.env.SMTP_USER, // your gmail
        pass: process.env.SMTP_PASS  // gmail app password
      }
    });

    await transporter.sendMail({
      from: `"Google Drive App" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    });
  } catch (error) {
    console.error("Email sending failed:", error);
    throw new Error("Email could not be sent");
  }
};

/* =========================
   JWT HELPER
========================= */

const generateJWT = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "7d" }
  );
};

/* =========================
   EMAIL TEMPLATES
========================= */

const emailTemplates = {
  verifyEmail: (firstName, verificationLink) => `
    <h2>Welcome to Google Drive, ${firstName}!</h2>
    <p>Please verify your email address by clicking the button below:</p>
    <a href="${verificationLink}" style="
      display: inline-block;
      padding: 12px 24px;
      background-color: #4CAF50;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    ">Verify Email</a>
    <p>This link expires in 24 hours.</p>
    <p>If you did not create this account, you can safely ignore this email.</p>
  `,

  resetPassword: (firstName, resetLink) => `
    <h2>Password Reset Request</h2>
    <p>Hi ${firstName},</p>
    <p>You requested to reset your password. Click the button below:</p>
    <a href="${resetLink}" style="
      display: inline-block;
      padding: 12px 24px;
      background-color: #2196F3;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    ">Reset Password</a>
    <p>This link expires in 30 minutes.</p>
    <p>If you did not request this, please ignore this email.</p>
  `
};

/* =========================
   EXPORTS
========================= */

module.exports = {
  generateToken,
  hashToken,
  sendEmail,
  generateJWT,
  emailTemplates
};
