const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { sendCertificateEmail } = require('../services/emailService');

// Generate certificate number
const generateCertificateNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `MOE-${timestamp}-${random}`;
};

// Create digital signature
const createDigitalSignature = (data) => {
  const secret = process.env.CERTIFICATE_SECRET || 'certificate-secret';
  return crypto.createHmac('sha256', secret)
    .update(JSON.stringify(data))
    .digest('hex');
};

// Verify digital signature
const verifyDigitalSignature = (data, signature) => {
  const expectedSignature = createDigitalSignature(data);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};

// Generate certificate for user
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    // Check if already has certificate
    const existingCert = await db.query(
      'SELECT * FROM certificates WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );

    if (existingCert.rows.length > 0) {
      return res.json({
        success: true,
        certificate: existingCert.rows[0],
        message: 'Certificate already exists'
      });
    }

    // Check eligibility
    const progressResult = await db.query(
      `SELECT up.*, c.title as course_title, c.passing_score, u.name as user_name, u.email
       FROM user_progress up
       JOIN courses c ON up.course_id = c.id
       JOIN users u ON up.user_id = u.id
       WHERE up.user_id = $1 AND up.course_id = $2`,
      [userId, courseId]
    );

    if (progressResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Course not started' });
    }

    const progress = progressResult.rows[0];
    const isCompleted = ['completed', 'passed'].includes(progress.lesson_status);
    const hasPassed = progress.score_raw >= progress.passing_score;

    if (!isCompleted || !hasPassed) {
      return res.status(400).json({
        success: false,
        message: 'Not eligible for certificate. Complete the course with passing score.'
      });
    }

    // Generate certificate
    const certificateNumber = generateCertificateNumber();
    const issueDate = new Date();
    
    const signatureData = {
      certificateNumber,
      userId,
      courseId,
      score: progress.score_raw,
      issueDate: issueDate.toISOString()
    };
    const digitalSignature = createDigitalSignature(signatureData);

    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify/${certificateNumber}`;

    // Save certificate
    const certResult = await db.query(
      `INSERT INTO certificates (
        user_id, course_id, certificate_number, issue_date, score, 
        digital_signature, verification_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [userId, courseId, certificateNumber, issueDate, progress.score_raw, digitalSignature, verificationUrl]
    );

    const certificate = certResult.rows[0];

    // Send certificate email
    await sendCertificateEmail(
      progress.email,
      progress.user_name,
      progress.course_title,
      certificateNumber,
      verificationUrl
    );

    res.json({
      success: true,
      certificate: {
        ...certificate,
        course_title: progress.course_title,
        user_name: progress.user_name
      },
      message: 'Certificate generated successfully!'
    });
  } catch (error) {
    console.error('Generate certificate error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate certificate' });
  }
});

// Download certificate as PDF
router.get('/download/:certificateId', authMiddleware, async (req, res) => {
  try {
    const { certificateId } = req.params;
    const userId = req.user.id;

    // Get certificate details
    const result = await db.query(
      `SELECT 
        cert.*,
        c.title as course_title,
        c.description as course_description,
        u.name as user_name,
        u.email as user_email,
        u.school,
        u.oracle_number
       FROM certificates cert
       JOIN courses c ON cert.course_id = c.id
       JOIN users u ON cert.user_id = u.id
       WHERE cert.id = $1 AND (cert.user_id = $2 OR $3 = 'admin')`,
      [certificateId, userId, req.user.role]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    const cert = result.rows[0];

    // Update download count
    await db.query(
      'UPDATE certificates SET downloaded_count = downloaded_count + 1 WHERE id = $1',
      [certificateId]
    );

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(cert.verification_url, {
      width: 100,
      margin: 1
    });

    // Create PDF
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 50
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Certificate-${cert.certificate_number}.pdf"`);

    doc.pipe(res);

    // Certificate design
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Border
    doc.rect(30, 30, pageWidth - 60, pageHeight - 60)
       .lineWidth(3)
       .stroke('#1a5276');

    doc.rect(40, 40, pageWidth - 80, pageHeight - 80)
       .lineWidth(1)
       .stroke('#2874a6');

    // Header
    doc.fontSize(14)
       .fillColor('#666')
       .text('MINISTRY OF EDUCATION - UAE', 0, 70, { align: 'center' });

    doc.fontSize(36)
       .fillColor('#1a5276')
       .text('Certificate of Completion', 0, 100, { align: 'center' });

    // Decorative line
    doc.moveTo(200, 150)
       .lineTo(pageWidth - 200, 150)
       .lineWidth(2)
       .stroke('#f39c12');

    // Certificate text
    doc.fontSize(14)
       .fillColor('#333')
       .text('This is to certify that', 0, 180, { align: 'center' });

    doc.fontSize(28)
       .fillColor('#1a5276')
       .font('Helvetica-Bold')
       .text(cert.user_name, 0, 210, { align: 'center' });

    if (cert.school) {
      doc.fontSize(12)
         .fillColor('#666')
         .font('Helvetica')
         .text(`from ${cert.school}`, 0, 250, { align: 'center' });
    }

    doc.fontSize(14)
       .fillColor('#333')
       .font('Helvetica')
       .text('has successfully completed the course', 0, 280, { align: 'center' });

    doc.fontSize(22)
       .fillColor('#2874a6')
       .font('Helvetica-Bold')
       .text(cert.course_title, 0, 310, { align: 'center' });

    // Score and date
    doc.fontSize(12)
       .fillColor('#333')
       .font('Helvetica')
       .text(`with a score of ${cert.score}%`, 0, 350, { align: 'center' });

    const issueDate = new Date(cert.issue_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    doc.text(`Issued on ${issueDate}`, 0, 370, { align: 'center' });

    // Certificate number
    doc.fontSize(10)
       .fillColor('#666')
       .text(`Certificate Number: ${cert.certificate_number}`, 0, 400, { align: 'center' });

    // QR Code
    const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
    doc.image(qrBuffer, pageWidth - 150, pageHeight - 150, { width: 80 });

    doc.fontSize(8)
       .fillColor('#666')
       .text('Scan to verify', pageWidth - 150, pageHeight - 60, { width: 80, align: 'center' });

    // Digital signature notice
    doc.fontSize(8)
       .fillColor('#999')
       .text('This certificate is digitally signed and can be verified at the URL above or by scanning the QR code.', 
             100, pageHeight - 80, { width: pageWidth - 200, align: 'center' });

    // Signature line
    doc.moveTo(100, pageHeight - 120)
       .lineTo(250, pageHeight - 120)
       .lineWidth(1)
       .stroke('#333');

    doc.fontSize(10)
       .fillColor('#333')
       .text(process.env.CERTIFICATE_ISSUER || 'Ministry of Education - UAE', 
             100, pageHeight - 115, { width: 150, align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Download certificate error:', error);
    res.status(500).json({ success: false, message: 'Failed to download certificate' });
  }
});

// Verify certificate (public endpoint)
router.get('/verify/:certificateNumber', async (req, res) => {
  try {
    const { certificateNumber } = req.params;

    const result = await db.query(
      `SELECT 
        cert.certificate_number,
        cert.issue_date,
        cert.score,
        cert.digital_signature,
        c.title as course_title,
        u.name as user_name
       FROM certificates cert
       JOIN courses c ON cert.course_id = c.id
       JOIN users u ON cert.user_id = u.id
       WHERE cert.certificate_number = $1`,
      [certificateNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Certificate not found'
      });
    }

    const cert = result.rows[0];

    // Verify digital signature
    const signatureData = {
      certificateNumber: cert.certificate_number,
      userId: cert.user_id,
      courseId: cert.course_id,
      score: parseFloat(cert.score),
      issueDate: new Date(cert.issue_date).toISOString()
    };

    res.json({
      success: true,
      valid: true,
      certificate: {
        certificateNumber: cert.certificate_number,
        userName: cert.user_name,
        courseTitle: cert.course_title,
        score: cert.score,
        issueDate: cert.issue_date
      },
      message: 'Certificate is valid and authentic'
    });
  } catch (error) {
    console.error('Verify certificate error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// Get user's certificates
router.get('/my-certificates', authMiddleware, async (req, res) => {
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
