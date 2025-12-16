require('dotenv').config();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('Admin@123', 12);
    
    const adminResult = await db.query(`
      INSERT INTO users (id, name, email, password_hash, role, email_verified, school, subject_taught)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        email_verified = EXCLUDED.email_verified
      RETURNING id
    `, [
      uuidv4(),
      'System Administrator',
      'admin@moe.gov.ae',
      adminPassword,
      'admin',
      true,
      'Ministry of Education',
      'Administration'
    ]);
    console.log('✅ Admin user created/updated');

    // Create the demo course
    const courseResult = await db.query(`
      INSERT INTO courses (id, title, description, scorm_version, entry_point, passing_score, total_modules)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [
      uuidv4(),
      'Demo for Testing Dec8, 25',
      'A comprehensive demo course for testing the SCORM LMS platform. This course covers essential training modules designed for educators.',
      '1.2',
      'scormdriver/indexAPI.html',
      80.00,
      1
    ]);
    
    if (courseResult.rows.length > 0) {
      console.log('✅ Demo course created');
    } else {
      console.log('ℹ️ Demo course already exists');
    }

    console.log('✅ Database seeding completed successfully!');
    console.log('');
    console.log('📝 Default Admin Credentials:');
    console.log('   Email: admin@moe.gov.ae');
    console.log('   Password: Admin@123');
    console.log('');
    console.log('⚠️  Please change the admin password after first login!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// Run seed if called directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seed;
