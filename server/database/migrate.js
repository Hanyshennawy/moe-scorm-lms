require('dotenv').config();
const db = require('../config/database');

async function migrate() {
  console.log('🔄 Starting database migration...');

  try {
    // Create UUID extension
    await db.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        phone VARCHAR(50),
        school VARCHAR(255),
        oracle_number VARCHAR(100),
        subject_taught VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        email_verified BOOLEAN DEFAULT FALSE,
        email_verification_token VARCHAR(255),
        email_verification_expires TIMESTAMP,
        password_reset_token VARCHAR(255),
        password_reset_expires TIMESTAMP,
        microsoft_id VARCHAR(255),
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Users table created');

    // Create course table
    await db.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        scorm_version VARCHAR(50) DEFAULT '1.2',
        entry_point VARCHAR(255) NOT NULL,
        passing_score DECIMAL(5,2) DEFAULT 80.00,
        total_modules INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Courses table created');

    // Create user_progress table
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_progress (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        lesson_status VARCHAR(50) DEFAULT 'not_attempted',
        lesson_location TEXT,
        score_raw DECIMAL(5,2),
        score_min DECIMAL(5,2) DEFAULT 0,
        score_max DECIMAL(5,2) DEFAULT 100,
        total_time INTEGER DEFAULT 0,
        session_time INTEGER DEFAULT 0,
        suspend_data TEXT,
        completion_percentage DECIMAL(5,2) DEFAULT 0,
        completed_at TIMESTAMP,
        first_accessed TIMESTAMP,
        last_accessed TIMESTAMP DEFAULT NOW(),
        access_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, course_id)
      )
    `);
    console.log('✅ User progress table created');

    // Create scorm_interactions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS scorm_interactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        interaction_id VARCHAR(255),
        interaction_type VARCHAR(50),
        description TEXT,
        learner_response TEXT,
        correct_response TEXT,
        result VARCHAR(50),
        weighting DECIMAL(5,2),
        latency INTEGER,
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ SCORM interactions table created');

    // Create certificates table
    await db.query(`
      CREATE TABLE IF NOT EXISTS certificates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        certificate_number VARCHAR(100) UNIQUE NOT NULL,
        issue_date TIMESTAMP DEFAULT NOW(),
        score DECIMAL(5,2),
        digital_signature TEXT,
        verification_url TEXT,
        downloaded_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, course_id)
      )
    `);
    console.log('✅ Certificates table created');

    // Create session_logs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS session_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        session_start TIMESTAMP DEFAULT NOW(),
        session_end TIMESTAMP,
        duration INTEGER DEFAULT 0,
        ip_address VARCHAR(45),
        user_agent TEXT
      )
    `);
    console.log('✅ Session logs table created');

    // Create email_logs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        email_type VARCHAR(50) NOT NULL,
        recipient_email VARCHAR(255) NOT NULL,
        subject VARCHAR(255),
        status VARCHAR(50) DEFAULT 'sent',
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Email logs table created');

    // Create indexes for performance
    await db.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_progress_course ON user_progress(course_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_progress_status ON user_progress(lesson_status)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_certificates_number ON certificates(certificate_number)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_sessions_user ON session_logs(user_id)');
    console.log('✅ Indexes created');

    console.log('✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = migrate;
