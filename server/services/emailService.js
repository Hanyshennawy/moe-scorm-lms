const nodemailer = require('nodemailer');
const db = require('../config/database');

// Check if email is configured
const isEmailConfigured = () => {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD);
};

// Create transporter
const createTransporter = () => {
  if (!isEmailConfigured()) {
    console.warn('⚠️ Email not configured - SMTP_USER and SMTP_PASSWORD required');
    return null;
  }
  
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
};

// Log email
const logEmail = async (userId, emailType, recipientEmail, subject, status, errorMessage = null) => {
  try {
    await db.query(
      `INSERT INTO email_logs (user_id, email_type, recipient_email, subject, status, error_message)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, emailType, recipientEmail, subject, status, errorMessage]
    );
  } catch (error) {
    console.error('Failed to log email:', error);
  }
};

// Email templates
const getEmailTemplate = (type, data) => {
  const baseStyle = `
    font-family: Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f9f9f9;
  `;

  const buttonStyle = `
    display: inline-block;
    padding: 12px 24px;
    background-color: #1a5276;
    color: white;
    text-decoration: none;
    border-radius: 5px;
    margin: 20px 0;
  `;

  const templates = {
    verification: {
      subject: 'Verify Your Email - MOE Learning Platform',
      html: `
        <div style="${baseStyle}">
          <h1 style="color: #1a5276;">Welcome to MOE Learning Platform!</h1>
          <p>Hello ${data.name},</p>
          <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
          <a href="${process.env.CLIENT_URL}/verify-email/${data.token}" style="${buttonStyle}">Verify Email</a>
          <p>Or copy and paste this link in your browser:</p>
          <p style="color: #666; word-break: break-all;">${process.env.CLIENT_URL}/verify-email/${data.token}</p>
          <p>This link will expire in 24 hours.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">If you didn't create an account, please ignore this email.</p>
        </div>
      `
    },
    welcome: {
      subject: 'Welcome to MOE Learning Platform!',
      html: `
        <div style="${baseStyle}">
          <h1 style="color: #1a5276;">Welcome Aboard!</h1>
          <p>Hello ${data.name},</p>
          <p>Your email has been verified successfully. You can now access all features of the MOE Learning Platform.</p>
          <p>Get started by logging in and exploring our courses:</p>
          <a href="${process.env.CLIENT_URL}/login" style="${buttonStyle}">Login Now</a>
          <h3>What you can do:</h3>
          <ul>
            <li>Access interactive training courses</li>
            <li>Track your learning progress</li>
            <li>Earn certificates upon completion</li>
          </ul>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">Ministry of Education - UAE</p>
        </div>
      `
    },
    passwordReset: {
      subject: 'Password Reset Request - MOE Learning Platform',
      html: `
        <div style="${baseStyle}">
          <h1 style="color: #1a5276;">Password Reset Request</h1>
          <p>Hello ${data.name},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <a href="${process.env.CLIENT_URL}/reset-password/${data.token}" style="${buttonStyle}">Reset Password</a>
          <p>Or copy and paste this link in your browser:</p>
          <p style="color: #666; word-break: break-all;">${process.env.CLIENT_URL}/reset-password/${data.token}</p>
          <p>This link will expire in 1 hour.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
        </div>
      `
    },
    certificate: {
      subject: `Congratulations! You've earned a certificate - ${data.courseTitle}`,
      html: `
        <div style="${baseStyle}">
          <h1 style="color: #1a5276;">🎉 Congratulations!</h1>
          <p>Hello ${data.name},</p>
          <p>You have successfully completed the course <strong>${data.courseTitle}</strong> and earned a certificate!</p>
          <div style="background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Certificate Number:</strong> ${data.certificateNumber}</p>
          </div>
          <p>You can download your certificate or verify it anytime:</p>
          <a href="${process.env.CLIENT_URL}/profile" style="${buttonStyle}">View Certificate</a>
          <p>Verification URL:</p>
          <p style="color: #666; word-break: break-all;">${data.verificationUrl}</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">Ministry of Education - UAE</p>
        </div>
      `
    },
    courseCompletion: {
      subject: `Course Completed - ${data.courseTitle}`,
      html: `
        <div style="${baseStyle}">
          <h1 style="color: #1a5276;">Course Completed!</h1>
          <p>Hello ${data.name},</p>
          <p>Congratulations on completing the course <strong>${data.courseTitle}</strong>!</p>
          <div style="background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Your Score:</strong> ${data.score}%</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> ${data.passed ? '✅ Passed' : '❌ Not Passed'}</p>
          </div>
          ${data.passed ? `
            <p>You are now eligible to receive your certificate!</p>
            <a href="${process.env.CLIENT_URL}/profile" style="${buttonStyle}">Get Your Certificate</a>
          ` : `
            <p>Keep learning and try again to earn your certificate!</p>
            <a href="${process.env.CLIENT_URL}/course" style="${buttonStyle}">Try Again</a>
          `}
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">Ministry of Education - UAE</p>
        </div>
      `
    }
  };

  return templates[type];
};

// Send email function
const sendEmail = async (to, type, data, userId = null) => {
  try {
    const transporter = createTransporter();
    
    // If email is not configured, log and return success (don't block registration)
    if (!transporter) {
      console.log(`📧 Email skipped (not configured): ${type} to ${to}`);
      await logEmail(userId, type, to, `[SKIPPED] ${type}`, 'skipped', 'Email not configured');
      return true; // Return true so registration doesn't fail
    }
    
    const template = getEmailTemplate(type, data);

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'MOE Learning Platform'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to,
      subject: template.subject,
      html: template.html
    };

    await transporter.sendMail(mailOptions);
    await logEmail(userId, type, to, template.subject, 'sent');
    
    console.log(`✉️ Email sent: ${type} to ${to}`);
    return true;
  } catch (error) {
    console.error(`❌ Email error (${type}):`, error);
    await logEmail(userId, type, to, '', 'failed', error.message);
    return false;
  }
};

// Export specific email functions
const sendVerificationEmail = async (email, name, token) => {
  return sendEmail(email, 'verification', { name, token });
};

const sendWelcomeEmail = async (email, name) => {
  return sendEmail(email, 'welcome', { name });
};

const sendPasswordResetEmail = async (email, name, token) => {
  return sendEmail(email, 'passwordReset', { name, token });
};

const sendCertificateEmail = async (email, name, courseTitle, certificateNumber, verificationUrl) => {
  return sendEmail(email, 'certificate', { 
    name, 
    courseTitle, 
    certificateNumber, 
    verificationUrl 
  });
};

const sendCourseCompletionEmail = async (email, name, courseTitle, score, passed) => {
  return sendEmail(email, 'courseCompletion', { 
    name, 
    courseTitle, 
    score, 
    passed 
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendCertificateEmail,
  sendCourseCompletionEmail
};
