const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// Get course information
router.get('/course', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, title, description, scorm_version, entry_point, passing_score, total_modules
       FROM courses WHERE is_active = true LIMIT 1`
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No active course found' });
    }

    res.json({ success: true, course: result.rows[0] });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ success: false, message: 'Failed to get course' });
  }
});

// Initialize SCORM session
router.post('/initialize', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    // Get or create progress record
    let progressResult = await db.query(
      'SELECT * FROM user_progress WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );

    let progress;
    let isNewSession = false;

    if (progressResult.rows.length === 0) {
      // Create new progress record
      const insertResult = await db.query(
        `INSERT INTO user_progress (user_id, course_id, first_accessed, last_accessed, access_count)
         VALUES ($1, $2, NOW(), NOW(), 1)
         RETURNING *`,
        [userId, courseId]
      );
      progress = insertResult.rows[0];
      isNewSession = true;
    } else {
      progress = progressResult.rows[0];
      // Update access count and last accessed
      await db.query(
        `UPDATE user_progress SET last_accessed = NOW(), access_count = access_count + 1
         WHERE id = $1`,
        [progress.id]
      );
    }

    // Start session log
    const sessionResult = await db.query(
      `INSERT INTO session_logs (user_id, course_id, session_start, ip_address, user_agent)
       VALUES ($1, $2, NOW(), $3, $4)
       RETURNING id`,
      [userId, courseId, req.ip, req.headers['user-agent']]
    );

    res.json({
      success: true,
      sessionId: sessionResult.rows[0].id,
      scormData: {
        'cmi.core.student_id': userId,
        'cmi.core.student_name': req.user.name,
        'cmi.core.lesson_status': progress.lesson_status || 'not attempted',
        'cmi.core.lesson_location': progress.lesson_location || '',
        'cmi.core.score.raw': progress.score_raw ? String(progress.score_raw) : '',
        'cmi.core.score.min': String(progress.score_min || 0),
        'cmi.core.score.max': String(progress.score_max || 100),
        'cmi.core.total_time': formatCMITime(progress.total_time || 0),
        'cmi.suspend_data': progress.suspend_data || '',
        'cmi.core.entry': isNewSession ? 'ab-initio' : 'resume',
        'cmi.core.credit': 'credit',
        'cmi.core.lesson_mode': 'normal'
      }
    });
  } catch (error) {
    console.error('SCORM initialize error:', error);
    res.status(500).json({ success: false, message: 'Failed to initialize SCORM' });
  }
});

// Get SCORM value
router.get('/getValue', authMiddleware, async (req, res) => {
  try {
    const { courseId, element } = req.query;
    const userId = req.user.id;

    const result = await db.query(
      'SELECT * FROM user_progress WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, value: '' });
    }

    const progress = result.rows[0];
    let value = '';

    switch (element) {
      case 'cmi.core.lesson_status':
        value = progress.lesson_status || 'not attempted';
        break;
      case 'cmi.core.lesson_location':
        value = progress.lesson_location || '';
        break;
      case 'cmi.core.score.raw':
        value = progress.score_raw ? String(progress.score_raw) : '';
        break;
      case 'cmi.suspend_data':
        value = progress.suspend_data || '';
        break;
      case 'cmi.core.total_time':
        value = formatCMITime(progress.total_time || 0);
        break;
      default:
        value = '';
    }

    res.json({ success: true, value });
  } catch (error) {
    console.error('SCORM getValue error:', error);
    res.status(500).json({ success: false, message: 'Failed to get value' });
  }
});

// Set SCORM value
router.post('/setValue', authMiddleware, async (req, res) => {
  try {
    const { courseId, element, value } = req.body;
    const userId = req.user.id;

    // Map SCORM element to database column
    let updateQuery = '';
    let updateValue = value;

    switch (element) {
      case 'cmi.core.lesson_status':
        updateQuery = 'lesson_status = $1';
        updateValue = normalizeStatus(value);
        break;
      case 'cmi.core.lesson_location':
        updateQuery = 'lesson_location = $1';
        break;
      case 'cmi.core.score.raw':
        updateQuery = 'score_raw = $1';
        updateValue = parseFloat(value) || 0;
        break;
      case 'cmi.suspend_data':
        updateQuery = 'suspend_data = $1';
        break;
      case 'cmi.core.session_time':
        // Add session time to total time
        const sessionSeconds = parseCMITime(value);
        updateQuery = 'total_time = total_time + $1, session_time = $2';
        await db.query(
          `UPDATE user_progress SET total_time = total_time + $1, session_time = $2, updated_at = NOW()
           WHERE user_id = $3 AND course_id = $4`,
          [sessionSeconds, sessionSeconds, userId, courseId]
        );
        return res.json({ success: true });
      default:
        return res.json({ success: true }); // Ignore unknown elements
    }

    // Check if completed
    const isCompleted = ['completed', 'passed'].includes(normalizeStatus(value));
    let completedUpdate = '';
    
    if (element === 'cmi.core.lesson_status' && isCompleted) {
      completedUpdate = ', completed_at = COALESCE(completed_at, NOW()), completion_percentage = 100';
    }

    await db.query(
      `UPDATE user_progress SET ${updateQuery}${completedUpdate}, updated_at = NOW()
       WHERE user_id = $2 AND course_id = $3`,
      [updateValue, userId, courseId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('SCORM setValue error:', error);
    res.status(500).json({ success: false, message: 'Failed to set value' });
  }
});

// Commit SCORM data
router.post('/commit', authMiddleware, async (req, res) => {
  try {
    const { courseId, data } = req.body;
    const userId = req.user.id;

    if (data) {
      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (data.lesson_status !== undefined) {
        updates.push(`lesson_status = $${paramIndex++}`);
        values.push(normalizeStatus(data.lesson_status));
      }
      if (data.lesson_location !== undefined) {
        updates.push(`lesson_location = $${paramIndex++}`);
        values.push(data.lesson_location);
      }
      if (data.score_raw !== undefined) {
        updates.push(`score_raw = $${paramIndex++}`);
        values.push(parseFloat(data.score_raw) || 0);
      }
      if (data.suspend_data !== undefined) {
        updates.push(`suspend_data = $${paramIndex++}`);
        values.push(data.suspend_data);
      }
      if (data.session_time !== undefined) {
        const sessionSeconds = parseCMITime(data.session_time);
        updates.push(`total_time = total_time + $${paramIndex++}`);
        values.push(sessionSeconds);
        updates.push(`session_time = $${paramIndex++}`);
        values.push(sessionSeconds);
      }
      if (data.completion_percentage !== undefined) {
        updates.push(`completion_percentage = $${paramIndex++}`);
        values.push(parseFloat(data.completion_percentage) || 0);
      }

      // Check if completed
      if (data.lesson_status && ['completed', 'passed'].includes(normalizeStatus(data.lesson_status))) {
        updates.push(`completed_at = COALESCE(completed_at, NOW())`);
        updates.push(`completion_percentage = 100`);
      }

      if (updates.length > 0) {
        updates.push('updated_at = NOW()');
        values.push(userId);
        values.push(courseId);

        await db.query(
          `UPDATE user_progress SET ${updates.join(', ')}
           WHERE user_id = $${paramIndex++} AND course_id = $${paramIndex}`,
          values
        );
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('SCORM commit error:', error);
    res.status(500).json({ success: false, message: 'Failed to commit data' });
  }
});

// Finish/Terminate SCORM session
router.post('/finish', authMiddleware, async (req, res) => {
  try {
    const { courseId, sessionId, data } = req.body;
    const userId = req.user.id;

    // Update session log
    if (sessionId) {
      await db.query(
        `UPDATE session_logs SET session_end = NOW(), 
         duration = EXTRACT(EPOCH FROM (NOW() - session_start))::INTEGER
         WHERE id = $1`,
        [sessionId]
      );
    }

    // Commit final data if provided
    if (data) {
      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (data.lesson_status) {
        updates.push(`lesson_status = $${paramIndex++}`);
        values.push(normalizeStatus(data.lesson_status));
      }
      if (data.score_raw !== undefined) {
        updates.push(`score_raw = $${paramIndex++}`);
        values.push(parseFloat(data.score_raw) || 0);
      }
      if (data.suspend_data) {
        updates.push(`suspend_data = $${paramIndex++}`);
        values.push(data.suspend_data);
      }
      if (data.lesson_location) {
        updates.push(`lesson_location = $${paramIndex++}`);
        values.push(data.lesson_location);
      }

      // Check if completed/passed
      const status = normalizeStatus(data.lesson_status);
      if (['completed', 'passed'].includes(status)) {
        updates.push(`completed_at = COALESCE(completed_at, NOW())`);
        updates.push(`completion_percentage = 100`);
      }

      if (updates.length > 0) {
        updates.push('updated_at = NOW()');
        values.push(userId);
        values.push(courseId);

        await db.query(
          `UPDATE user_progress SET ${updates.join(', ')}
           WHERE user_id = $${paramIndex++} AND course_id = $${paramIndex}`,
          values
        );
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('SCORM finish error:', error);
    res.status(500).json({ success: false, message: 'Failed to finish session' });
  }
});

// Record interaction
router.post('/interaction', authMiddleware, async (req, res) => {
  try {
    const { courseId, interaction } = req.body;
    const userId = req.user.id;

    await db.query(
      `INSERT INTO scorm_interactions (
        user_id, course_id, interaction_id, interaction_type, description,
        learner_response, correct_response, result, weighting, latency
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        userId,
        courseId,
        interaction.id,
        interaction.type,
        interaction.description,
        interaction.learner_response,
        interaction.correct_response,
        interaction.result,
        interaction.weighting,
        interaction.latency
      ]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Record interaction error:', error);
    res.status(500).json({ success: false, message: 'Failed to record interaction' });
  }
});

// Helper functions
function normalizeStatus(status) {
  if (!status) return 'not_attempted';
  const normalized = status.toLowerCase().replace(/\s+/g, '_').replace('-', '_');
  const validStatuses = ['passed', 'completed', 'failed', 'incomplete', 'browsed', 'not_attempted'];
  return validStatuses.includes(normalized) ? normalized : 'not_attempted';
}

function formatCMITime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(4, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function parseCMITime(timeString) {
  if (!timeString) return 0;
  const parts = timeString.split(':');
  if (parts.length >= 3) {
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return Math.floor(hours * 3600 + minutes * 60 + seconds);
  }
  return 0;
}

module.exports = router;
