const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } = require('../services/emailService');

// Allowed email domains
const ALLOWED_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS || 'moe.sch.ae,moe.gov.ae').split(',');

// Helper to check email domain
const isAllowedEmailDomain = (email) => {
  const domain = email.split('@')[1]?.toLowerCase();
  return ALLOWED_DOMAINS.some(allowed => domain === allowed.toLowerCase());
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('phone').optional().trim(),
  body('school').optional().trim(),
  body('oracle_number').optional().trim(),
  body('subject_taught').optional().trim()
];

// Register new user
router.post('/register', registerValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, phone, school, oracle_number, subject_taught } = req.body;

    // Check email domain
    if (!isAllowedEmailDomain(email)) {
      return res.status(400).json({
        success: false,
        message: 'Only @moe.sch.ae and @moe.gov.ae email addresses are allowed'
      });
    }

    // Check if user exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const result = await db.query(
      `INSERT INTO users (
        name, email, password_hash, phone, school, oracle_number, subject_taught,
        email_verification_token, email_verification_expires
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, name, email, role`,
      [
        name,
        email.toLowerCase(),
        passwordHash,
        phone,
        school,
        oracle_number,
        subject_taught,
        verificationToken,
        verificationExpires
      ]
    );

    const user = result.rows[0];

    // Send verification email
    await sendVerificationEmail(email, name, verificationToken);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// Verify email
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const result = await db.query(
      `SELECT * FROM users 
       WHERE email_verification_token = $1 
       AND email_verification_expires > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired verification token' 
      });
    }

    const user = result.rows[0];

    // Update user
    await db.query(
      `UPDATE users SET 
        email_verified = true, 
        email_verification_token = NULL, 
        email_verification_expires = NULL 
       WHERE id = $1`,
      [user.id]
    );

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name);

    res.json({ success: true, message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// Login
router.post('/login', async (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Login failed' });
    }
    if (!user) {
      return res.status(401).json({ success: false, message: info?.message || 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        school: user.school,
        oracle_number: user.oracle_number,
        subject_taught: user.subject_taught
      }
    });
  })(req, res, next);
});

// Microsoft OAuth - Initiate
router.get('/microsoft', passport.authenticate('microsoft', {
  prompt: 'select_account'
}));

// Microsoft OAuth - Callback
router.get('/microsoft/callback',
  passport.authenticate('microsoft', { 
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed`
  }),
  (req, res) => {
    const token = generateToken(req.user);
    res.redirect(`${process.env.CLIENT_URL}/oauth-callback?token=${token}`);
  }
);

// Forgot password
router.post('/forgot-password', 
  body('email').isEmail().withMessage('Valid email is required'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email } = req.body;

      const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
      
      // Always return success to prevent email enumeration
      if (result.rows.length === 0) {
        return res.json({ 
          success: true, 
          message: 'If an account exists, a password reset link has been sent' 
        });
      }

      const user = result.rows[0];

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.query(
        `UPDATE users SET 
          password_reset_token = $1, 
          password_reset_expires = $2 
         WHERE id = $3`,
        [resetToken, resetExpires, user.id]
      );

      // Send reset email
      await sendPasswordResetEmail(email, user.name, resetToken);

      res.json({ 
        success: true, 
        message: 'If an account exists, a password reset link has been sent' 
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ success: false, message: 'Request failed' });
    }
  }
);

// Reset password
router.post('/reset-password/:token',
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { token } = req.params;
      const { password } = req.body;

      const result = await db.query(
        `SELECT * FROM users 
         WHERE password_reset_token = $1 
         AND password_reset_expires > NOW()`,
        [token]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid or expired reset token' 
        });
      }

      const user = result.rows[0];
      const passwordHash = await bcrypt.hash(password, 12);

      await db.query(
        `UPDATE users SET 
          password_hash = $1, 
          password_reset_token = NULL, 
          password_reset_expires = NULL 
         WHERE id = $2`,
        [passwordHash, user.id]
      );

      res.json({ success: true, message: 'Password reset successful! You can now log in.' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ success: false, message: 'Password reset failed' });
    }
  }
);

// Resend verification email
router.post('/resend-verification',
  body('email').isEmail(),
  async (req, res) => {
    try {
      const { email } = req.body;

      const result = await db.query(
        'SELECT * FROM users WHERE email = $1 AND email_verified = false',
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        return res.json({ success: true, message: 'If an unverified account exists, a new verification email has been sent' });
      }

      const user = result.rows[0];
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await db.query(
        `UPDATE users SET 
          email_verification_token = $1, 
          email_verification_expires = $2 
         WHERE id = $3`,
        [verificationToken, verificationExpires, user.id]
      );

      await sendVerificationEmail(email, user.name, verificationToken);

      res.json({ success: true, message: 'Verification email sent!' });
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({ success: false, message: 'Failed to resend verification email' });
    }
  }
);

// Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const result = await db.query(
      `SELECT id, name, email, phone, school, oracle_number, subject_taught, role, email_verified, created_at, last_login
       FROM users WHERE id = $1`,
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    res.status(500).json({ success: false, message: 'Failed to get user' });
  }
});

module.exports = router;
