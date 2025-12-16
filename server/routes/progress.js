const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// Get user's progress for all courses
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        up.*,
        c.title as course_title,
        c.description as course_description,
        c.passing_score,
        CASE 
          WHEN up.lesson_status IN ('completed', 'passed') THEN true 
          ELSE false 
        END as is_completed,
        CASE 
          WHEN up.score_raw >= c.passing_score THEN true 
          ELSE false 
        END as is_passed
       FROM user_progress up
       JOIN courses c ON up.course_id = c.id
       WHERE up.user_id = $1
       ORDER BY up.last_accessed DESC`,
      [req.user.id]
    );

    res.json({ success: true, progress: result.rows });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ success: false, message: 'Failed to get progress' });
  }
});

// Get progress for specific course
router.get('/:courseId', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await db.query(
      `SELECT 
        up.*,
        c.title as course_title,
        c.passing_score,
        cert.id as certificate_id,
        cert.certificate_number
       FROM user_progress up
       JOIN courses c ON up.course_id = c.id
       LEFT JOIN certificates cert ON up.course_id = cert.course_id AND up.user_id = cert.user_id
       WHERE up.user_id = $1 AND up.course_id = $2`,
      [req.user.id, courseId]
    );

    if (result.rows.length === 0) {
      // Return default progress
      return res.json({
        success: true,
        progress: {
          lesson_status: 'not_attempted',
          completion_percentage: 0,
          score_raw: null,
          total_time: 0,
          certificate_id: null
        }
      });
    }

    res.json({ success: true, progress: result.rows[0] });
  } catch (error) {
    console.error('Get course progress error:', error);
    res.status(500).json({ success: false, message: 'Failed to get progress' });
  }
});

// Get user's learning history/sessions
router.get('/history/:courseId', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await db.query(
      `SELECT 
        session_start,
        session_end,
        duration,
        ip_address
       FROM session_logs
       WHERE user_id = $1 AND course_id = $2
       ORDER BY session_start DESC
       LIMIT 50`,
      [req.user.id, courseId]
    );

    res.json({ success: true, sessions: result.rows });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ success: false, message: 'Failed to get history' });
  }
});

// Get user's quiz/interaction results
router.get('/interactions/:courseId', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await db.query(
      `SELECT 
        interaction_id,
        interaction_type,
        description,
        learner_response,
        correct_response,
        result,
        timestamp
       FROM scorm_interactions
       WHERE user_id = $1 AND course_id = $2
       ORDER BY timestamp DESC`,
      [req.user.id, courseId]
    );

    res.json({ success: true, interactions: result.rows });
  } catch (error) {
    console.error('Get interactions error:', error);
    res.status(500).json({ success: false, message: 'Failed to get interactions' });
  }
});

// Check if user can get certificate
router.get('/certificate-eligibility/:courseId', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;

    const progressResult = await db.query(
      `SELECT up.*, c.passing_score
       FROM user_progress up
       JOIN courses c ON up.course_id = c.id
       WHERE up.user_id = $1 AND up.course_id = $2`,
      [req.user.id, courseId]
    );

    if (progressResult.rows.length === 0) {
      return res.json({ 
        success: true, 
        eligible: false, 
        reason: 'Course not started' 
      });
    }

    const progress = progressResult.rows[0];
    const isCompleted = ['completed', 'passed'].includes(progress.lesson_status);
    const hasPassed = progress.score_raw >= progress.passing_score;

    // Check if certificate already exists
    const certResult = await db.query(
      'SELECT id FROM certificates WHERE user_id = $1 AND course_id = $2',
      [req.user.id, courseId]
    );

    if (certResult.rows.length > 0) {
      return res.json({
        success: true,
        eligible: true,
        hasCertificate: true,
        certificateId: certResult.rows[0].id
      });
    }

    res.json({
      success: true,
      eligible: isCompleted && hasPassed,
      hasCertificate: false,
      reason: !isCompleted ? 'Course not completed' : !hasPassed ? 'Passing score not achieved' : null,
      currentScore: progress.score_raw,
      passingScore: progress.passing_score,
      status: progress.lesson_status
    });
  } catch (error) {
    console.error('Check eligibility error:', error);
    res.status(500).json({ success: false, message: 'Failed to check eligibility' });
  }
});

module.exports = router;
