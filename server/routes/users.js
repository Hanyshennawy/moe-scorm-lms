const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, email, phone, school, oracle_number, subject_taught, role, 
              email_verified, created_at, last_login
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to get profile' });
  }
});

// Update user profile
router.put('/profile', authMiddleware, [
  body('name').optional().trim().notEmpty(),
  body('phone').optional().trim(),
  body('school').optional().trim(),
  body('oracle_number').optional().trim(),
  body('subject_taught').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, phone, school, oracle_number, subject_taught } = req.body;

    const result = await db.query(
      `UPDATE users SET 
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        school = COALESCE($3, school),
        oracle_number = COALESCE($4, oracle_number),
        subject_taught = COALESCE($5, subject_taught),
        updated_at = NOW()
       WHERE id = $6
       RETURNING id, name, email, phone, school, oracle_number, subject_taught, role`,
      [name, phone, school, oracle_number, subject_taught, req.user.id]
    );

    res.json({ success: true, user: result.rows[0], message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// Change password
router.post('/change-password', authMiddleware, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const userResult = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Microsoft SSO users might not have a password
    if (!user.password_hash) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot change password for Microsoft SSO accounts' 
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, req.user.id]
    );

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

// Get user's course progress summary
router.get('/progress-summary', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        c.id as course_id,
        c.title,
        COALESCE(up.lesson_status, 'not attempted') as completion_status,
        COALESCE(up.score_raw, 0) as score,
        COALESCE(up.completion_percentage, 0) as progress_percentage,
        COALESCE(up.total_time, 0) as total_time_spent,
        up.first_accessed,
        up.last_accessed,
        up.completed_at,
        cert.id as certificate_id,
        cert.certificate_number
       FROM courses c
       LEFT JOIN user_progress up ON c.id = up.course_id AND up.user_id = $1
       LEFT JOIN certificates cert ON c.id = cert.course_id AND cert.user_id = $1
       WHERE c.is_active = true
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );

    res.json({ success: true, courses: result.rows });
  } catch (error) {
    console.error('Get progress summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to get progress summary' });
  }
});

// Get user's certificates
router.get('/certificates', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        cert.*,
        c.title as course_title
       FROM certificates cert
       JOIN courses c ON cert.course_id = c.id
       WHERE cert.user_id = $1
       ORDER BY cert.issue_date DESC`,
      [req.user.id]
    );

    res.json({ success: true, certificates: result.rows });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ success: false, message: 'Failed to get certificates' });
  }
});

module.exports = router;
