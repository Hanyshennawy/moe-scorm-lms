const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// Dashboard overview statistics
router.get('/dashboard', async (req, res) => {
  try {
    // Get total users
    const usersResult = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_users,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_users_week,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_users_month
      FROM users WHERE role = 'user'
    `);

    // Get course statistics
    const courseResult = await db.query(`
      SELECT 
        COUNT(DISTINCT up.user_id) as enrolled_users,
        COUNT(CASE WHEN up.lesson_status IN ('completed', 'passed') THEN 1 END) as completed_users,
        COUNT(CASE WHEN up.lesson_status = 'incomplete' THEN 1 END) as in_progress_users,
        ROUND(AVG(up.score_raw)::numeric, 2) as average_score,
        ROUND(AVG(up.completion_percentage)::numeric, 2) as average_completion,
        SUM(up.total_time) as total_learning_time
      FROM user_progress up
    `);

    // Get certificate statistics
    const certResult = await db.query(`
      SELECT 
        COUNT(*) as total_certificates,
        COUNT(CASE WHEN issue_date > NOW() - INTERVAL '7 days' THEN 1 END) as certificates_week,
        COUNT(CASE WHEN issue_date > NOW() - INTERVAL '30 days' THEN 1 END) as certificates_month
      FROM certificates
    `);

    // Get recent activity
    const activityResult = await db.query(`
      SELECT 
        COUNT(*) as sessions_today,
        SUM(duration) as time_today
      FROM session_logs
      WHERE session_start > NOW() - INTERVAL '24 hours'
    `);

    res.json({
      success: true,
      stats: {
        users: usersResult.rows[0],
        course: courseResult.rows[0],
        certificates: certResult.rows[0],
        activity: activityResult.rows[0]
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get dashboard stats' });
  }
});

// Get all users with progress
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE u.role = 'user'";
    const params = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.school ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status === 'completed') {
      whereClause += ` AND up.lesson_status IN ('completed', 'passed')`;
    } else if (status === 'in_progress') {
      whereClause += ` AND up.lesson_status = 'incomplete'`;
    } else if (status === 'not_started') {
      whereClause += ` AND (up.lesson_status IS NULL OR up.lesson_status = 'not_attempted')`;
    }

    const countResult = await db.query(
      `SELECT COUNT(DISTINCT u.id) as total
       FROM users u
       LEFT JOIN user_progress up ON u.id = up.user_id
       ${whereClause}`,
      params
    );

    const result = await db.query(
      `SELECT 
        u.id, u.name, u.email, u.phone, u.school, u.oracle_number, u.subject_taught,
        u.email_verified, u.created_at, u.last_login,
        up.lesson_status, up.score_raw, up.completion_percentage, up.total_time,
        up.first_accessed, up.last_accessed, up.completed_at,
        cert.id as certificate_id, cert.certificate_number, cert.issue_date
       FROM users u
       LEFT JOIN user_progress up ON u.id = up.user_id
       LEFT JOIN certificates cert ON u.id = cert.user_id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      users: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Failed to get users' });
  }
});

// Get single user details
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const userResult = await db.query(
      `SELECT 
        u.*,
        up.lesson_status, up.score_raw, up.completion_percentage, up.total_time,
        up.suspend_data, up.first_accessed, up.last_accessed, up.completed_at, up.access_count
       FROM users u
       LEFT JOIN user_progress up ON u.id = up.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get user's sessions
    const sessionsResult = await db.query(
      `SELECT * FROM session_logs 
       WHERE user_id = $1 
       ORDER BY session_start DESC 
       LIMIT 20`,
      [userId]
    );

    // Get user's interactions
    const interactionsResult = await db.query(
      `SELECT * FROM scorm_interactions 
       WHERE user_id = $1 
       ORDER BY timestamp DESC 
       LIMIT 50`,
      [userId]
    );

    // Get certificate if exists
    const certResult = await db.query(
      `SELECT * FROM certificates WHERE user_id = $1`,
      [userId]
    );

    res.json({
      success: true,
      user: userResult.rows[0],
      sessions: sessionsResult.rows,
      interactions: interactionsResult.rows,
      certificate: certResult.rows[0] || null
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user details' });
  }
});

// Course analytics
router.get('/analytics/course', async (req, res) => {
  try {
    // Completion rate over time (last 30 days)
    const completionTrend = await db.query(`
      SELECT 
        DATE(completed_at) as date,
        COUNT(*) as completions
      FROM user_progress
      WHERE completed_at IS NOT NULL 
        AND completed_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(completed_at)
      ORDER BY date
    `);

    // Score distribution
    const scoreDistribution = await db.query(`
      SELECT 
        CASE 
          WHEN score_raw >= 90 THEN '90-100'
          WHEN score_raw >= 80 THEN '80-89'
          WHEN score_raw >= 70 THEN '70-79'
          WHEN score_raw >= 60 THEN '60-69'
          WHEN score_raw >= 50 THEN '50-59'
          ELSE 'Below 50'
        END as range,
        COUNT(*) as count
      FROM user_progress
      WHERE score_raw IS NOT NULL
      GROUP BY range
      ORDER BY range DESC
    `);

    // Status distribution
    const statusDistribution = await db.query(`
      SELECT 
        COALESCE(lesson_status, 'not_attempted') as status,
        COUNT(*) as count
      FROM user_progress
      GROUP BY lesson_status
    `);

    // Daily active users (last 14 days)
    const dailyActive = await db.query(`
      SELECT 
        DATE(session_start) as date,
        COUNT(DISTINCT user_id) as active_users,
        SUM(duration) as total_time
      FROM session_logs
      WHERE session_start > NOW() - INTERVAL '14 days'
      GROUP BY DATE(session_start)
      ORDER BY date
    `);

    // Average time to completion
    const avgTimeResult = await db.query(`
      SELECT 
        ROUND(AVG(total_time)::numeric / 60, 2) as avg_minutes_to_complete
      FROM user_progress
      WHERE lesson_status IN ('completed', 'passed')
    `);

    res.json({
      success: true,
      analytics: {
        completionTrend: completionTrend.rows,
        scoreDistribution: scoreDistribution.rows,
        statusDistribution: statusDistribution.rows,
        dailyActiveUsers: dailyActive.rows,
        averageCompletionTime: avgTimeResult.rows[0]?.avg_minutes_to_complete || 0
      }
    });
  } catch (error) {
    console.error('Course analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to get analytics' });
  }
});

// User analytics
router.get('/analytics/users', async (req, res) => {
  try {
    // Registration trend (last 30 days)
    const registrationTrend = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as registrations
      FROM users
      WHERE role = 'user' AND created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    // Users by school
    const bySchool = await db.query(`
      SELECT 
        COALESCE(school, 'Not Specified') as school,
        COUNT(*) as count
      FROM users
      WHERE role = 'user'
      GROUP BY school
      ORDER BY count DESC
      LIMIT 20
    `);

    // Users by subject
    const bySubject = await db.query(`
      SELECT 
        COALESCE(subject_taught, 'Not Specified') as subject,
        COUNT(*) as count
      FROM users
      WHERE role = 'user'
      GROUP BY subject_taught
      ORDER BY count DESC
      LIMIT 15
    `);

    // Email domain breakdown
    const byDomain = await db.query(`
      SELECT 
        SPLIT_PART(email, '@', 2) as domain,
        COUNT(*) as count
      FROM users
      WHERE role = 'user'
      GROUP BY domain
    `);

    res.json({
      success: true,
      analytics: {
        registrationTrend: registrationTrend.rows,
        bySchool: bySchool.rows,
        bySubject: bySubject.rows,
        byDomain: byDomain.rows
      }
    });
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user analytics' });
  }
});

// Certificate analytics
router.get('/analytics/certificates', async (req, res) => {
  try {
    // Certificates issued over time
    const issueTrend = await db.query(`
      SELECT 
        DATE(issue_date) as date,
        COUNT(*) as count
      FROM certificates
      WHERE issue_date > NOW() - INTERVAL '30 days'
      GROUP BY DATE(issue_date)
      ORDER BY date
    `);

    // Certificate rate
    const rateResult = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM certificates) as total_certificates,
        (SELECT COUNT(DISTINCT user_id) FROM user_progress WHERE lesson_status IN ('completed', 'passed')) as eligible_users,
        (SELECT COUNT(DISTINCT user_id) FROM user_progress) as total_learners
    `);

    res.json({
      success: true,
      analytics: {
        issueTrend: issueTrend.rows,
        rates: rateResult.rows[0]
      }
    });
  } catch (error) {
    console.error('Certificate analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to get certificate analytics' });
  }
});

// Export data as CSV
router.get('/export/users', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        u.name, u.email, u.phone, u.school, u.oracle_number, u.subject_taught,
        u.email_verified, u.created_at, u.last_login,
        up.lesson_status, up.score_raw, up.completion_percentage, 
        up.total_time, up.completed_at,
        cert.certificate_number, cert.issue_date
      FROM users u
      LEFT JOIN user_progress up ON u.id = up.user_id
      LEFT JOIN certificates cert ON u.id = cert.user_id
      WHERE u.role = 'user'
      ORDER BY u.created_at DESC
    `);

    // Convert to CSV
    const headers = [
      'Name', 'Email', 'Phone', 'School', 'Oracle Number', 'Subject Taught',
      'Email Verified', 'Registration Date', 'Last Login',
      'Status', 'Score', 'Completion %', 'Total Time (mins)', 'Completed At',
      'Certificate Number', 'Certificate Date'
    ];

    const rows = result.rows.map(row => [
      row.name,
      row.email,
      row.phone || '',
      row.school || '',
      row.oracle_number || '',
      row.subject_taught || '',
      row.email_verified ? 'Yes' : 'No',
      row.created_at ? new Date(row.created_at).toISOString() : '',
      row.last_login ? new Date(row.last_login).toISOString() : '',
      row.lesson_status || 'not_started',
      row.score_raw || '',
      row.completion_percentage || 0,
      row.total_time ? Math.round(row.total_time / 60) : 0,
      row.completed_at ? new Date(row.completed_at).toISOString() : '',
      row.certificate_number || '',
      row.issue_date ? new Date(row.issue_date).toISOString() : ''
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export data' });
  }
});

// Update user role
router.patch('/users/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    await db.query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2',
      [role, userId]
    );

    res.json({ success: true, message: 'Role updated successfully' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ success: false, message: 'Failed to update role' });
  }
});

// Reset user progress (admin action)
router.post('/users/:userId/reset-progress', async (req, res) => {
  try {
    const { userId } = req.params;

    await db.query('DELETE FROM scorm_interactions WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM session_logs WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM certificates WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM user_progress WHERE user_id = $1', [userId]);

    res.json({ success: true, message: 'User progress reset successfully' });
  } catch (error) {
    console.error('Reset progress error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset progress' });
  }
});

module.exports = router;
