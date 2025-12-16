require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'scorm_lms',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

async function createDemoUser() {
  try {
    const hashedPassword = await bcrypt.hash('Demo@123', 12);
    
    const result = await pool.query(`
      INSERT INTO users (email, password_hash, name, phone, school, oracle_number, subject_taught, role, email_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name,
        email_verified = EXCLUDED.email_verified
      RETURNING id, email, name, role
    `, [
      'demo.user@moe.sch.ae',
      hashedPassword,
      'Demo User',
      '+971501234567',
      'Al Nahda School',
      'ORN-12345',
      'Mathematics',
      'user',
      true
    ]);
    
    console.log('');
    console.log('✅ Demo user created successfully!');
    console.log('');
    console.log('╔════════════════════════════════════════╗');
    console.log('║       DEMO USER LOGIN CREDENTIALS      ║');
    console.log('╠════════════════════════════════════════╣');
    console.log('║  📧 Email:    demo.user@moe.sch.ae     ║');
    console.log('║  🔑 Password: Demo@123                 ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('');
    console.log('User details:', result.rows[0]);
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error creating demo user:', err.message);
    await pool.end();
    process.exit(1);
  }
}

createDemoUser();
