# MOE Learning Platform - SCORM LMS

A comprehensive Learning Management System (LMS) built for the Ministry of Education - UAE. This platform supports SCORM 1.2 content, user progress tracking, automatic certificate generation, and full admin analytics.

## Features

### For Learners
- 📚 **SCORM 1.2 Content Player** - Interactive course content with full SCORM support
- 📊 **Progress Tracking** - Automatic saving of course progress, bookmarks, and scores
- 🎓 **Automatic Certificates** - PDF certificates generated upon course completion
- 👤 **User Profiles** - Personalized profiles with learning history
- 🔐 **Secure Authentication** - Email/password and Microsoft SSO login

### For Administrators
- 📈 **Analytics Dashboard** - Real-time insights into learner progress and engagement
- 👥 **User Management** - Full CRUD operations, role management, and email verification
- 📋 **Export Reports** - Download CSV reports for users, progress, and certificates
- 🔍 **Search & Filter** - Advanced user search with status and role filters

## Tech Stack

- **Frontend**: React 18, React Router v6, Recharts, Lucide Icons
- **Backend**: Node.js, Express.js, Passport.js
- **Database**: PostgreSQL
- **Authentication**: JWT, Microsoft OAuth 2.0
- **Email**: Nodemailer
- **PDF Generation**: PDFKit with QR code verification
- **Deployment**: Render (render.yaml blueprint)

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Quick Start

### 1. Clone and Install

```bash
cd scorm-lms
npm install
cd client && npm install && cd ..
```

### 2. Configure Environment

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/scorm_lms

# JWT
JWT_SECRET=your-secure-jwt-secret-key

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM="MOE Learning <noreply@moe.gov.ae>"

# Microsoft OAuth (optional)
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_TENANT_ID=your-tenant-id

# URLs
APP_URL=http://localhost:3000
API_URL=http://localhost:5000

# Certificate
CERTIFICATE_SECRET=your-certificate-signing-secret
```

### 3. Set Up Database

```bash
# Create database
createdb scorm_lms

# Run migrations
npm run migrate

# Seed initial data (creates admin user and demo course)
npm run seed
```

### 4. Copy SCORM Content

Copy the SCORM content to the public directory:

```bash
# Create scorm directory in server
mkdir -p server/public/scorm

# Copy SCORM content
cp -r ../scormcontent server/public/scorm/
cp -r ../scormdriver server/public/scorm/
```

### 5. Start Development Servers

```bash
# Start backend (port 5000)
npm run dev

# In another terminal, start frontend (port 3000)
cd client && npm start
```

## Default Credentials

After seeding, you can login with:

- **Admin**: `admin@moe.gov.ae` / `Admin@123`

## Project Structure

```
scorm-lms/
├── server/
│   ├── index.js              # Express server entry
│   ├── config/
│   │   ├── database.js       # PostgreSQL connection
│   │   └── passport.js       # Auth strategies
│   ├── database/
│   │   ├── migrate.js        # Schema migrations
│   │   └── seed.js           # Initial data
│   ├── middleware/
│   │   └── auth.js           # JWT middleware
│   ├── routes/
│   │   ├── auth.js           # Auth endpoints
│   │   ├── users.js          # User profile
│   │   ├── scorm.js          # SCORM RTE API
│   │   ├── progress.js       # Progress tracking
│   │   ├── certificates.js   # Certificate generation
│   │   └── admin.js          # Admin dashboard
│   └── services/
│       └── emailService.js   # Email templates
├── client/
│   ├── public/
│   └── src/
│       ├── components/       # Reusable components
│       ├── context/          # React context
│       ├── pages/            # Page components
│       │   ├── admin/        # Admin pages
│       │   └── ...           # User pages
│       └── services/         # API client
├── .env.example
├── package.json
└── render.yaml               # Render deployment
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/verify-email` - Verify email token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/microsoft` - Microsoft OAuth login
- `GET /api/auth/microsoft/callback` - OAuth callback

### User
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/progress-summary` - Get learning progress
- `GET /api/users/certificates` - Get earned certificates

### SCORM
- `POST /api/scorm/:courseId/initialize` - Start SCORM session
- `POST /api/scorm/:courseId/setValue` - Set SCORM data element
- `GET /api/scorm/:courseId/getValue` - Get SCORM data element
- `POST /api/scorm/:courseId/commit` - Commit SCORM data
- `POST /api/scorm/:courseId/finish` - End SCORM session

### Certificates
- `POST /api/certificates/:courseId/generate` - Generate certificate
- `GET /api/certificates/:id/download` - Download PDF
- `GET /api/certificates/verify/:number` - Verify certificate

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/users` - List users with pagination
- `GET /api/admin/users/:id` - User details
- `PUT /api/admin/users/:id/role` - Update user role
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/analytics` - Detailed analytics
- `GET /api/admin/export/:type` - Export CSV data

## Deployment to Render

### Using Blueprint (Recommended)

1. Push code to GitHub
2. Connect Render to your repository
3. Create a new "Blueprint" and select the repo
4. Render will automatically create services from `render.yaml`

### Manual Deployment

1. Create a PostgreSQL database on Render
2. Create a Web Service for the API:
   - Build Command: `npm install`
   - Start Command: `npm start`
3. Create a Static Site for the frontend:
   - Build Command: `cd client && npm install && npm run build`
   - Publish Directory: `client/build`
4. Set all environment variables

## Email Configuration

For production, use a transactional email service:

- **SendGrid**: Set `SMTP_HOST=smtp.sendgrid.net`
- **Mailgun**: Set `SMTP_HOST=smtp.mailgun.org`
- **AWS SES**: Set `SMTP_HOST=email-smtp.region.amazonaws.com`

## Microsoft SSO Setup

1. Register an app in Azure Portal
2. Add redirect URI: `{API_URL}/api/auth/microsoft/callback`
3. Create a client secret
4. Configure environment variables

## Security Features

- 🔒 Password hashing with bcrypt
- 🎫 JWT token authentication
- ✅ Email verification required
- 🛡️ Domain restriction (only @moe.sch.ae and @moe.gov.ae)
- 📜 Digitally signed certificates with HMAC-SHA256
- 🔗 QR code verification for certificates

## SCORM 1.2 Support

The platform implements a complete SCORM 1.2 Runtime Environment:

- `cmi.core.student_id`
- `cmi.core.student_name`
- `cmi.core.lesson_location`
- `cmi.core.lesson_status`
- `cmi.core.score.raw`
- `cmi.core.score.min`
- `cmi.core.score.max`
- `cmi.core.session_time`
- `cmi.core.total_time`
- `cmi.suspend_data`
- `cmi.interactions.*`

## License

Proprietary - Ministry of Education UAE

## Support

For technical support, contact the IT department.
