const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const bcrypt = require('bcryptjs');
const db = require('./database');

// Allowed email domains
const ALLOWED_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS || 'moe.sch.ae,moe.gov.ae').split(',');

// Helper to check email domain
const isAllowedEmailDomain = (email) => {
  const domain = email.split('@')[1]?.toLowerCase();
  return ALLOWED_DOMAINS.some(allowed => domain === allowed.toLowerCase());
};

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (err) {
    done(err, null);
  }
});

// Local Strategy (Email/Password)
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      // Check email domain
      if (!isAllowedEmailDomain(email)) {
        return done(null, false, { 
          message: 'Only @moe.sch.ae and @moe.gov.ae email addresses are allowed' 
        });
      }

      // Find user
      const result = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      const user = result.rows[0];

      // Check if email is verified
      if (!user.email_verified) {
        return done(null, false, { message: 'Please verify your email before logging in' });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      // Update last login
      await db.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Microsoft OAuth Strategy
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  passport.use(new MicrosoftStrategy(
    {
      clientID: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      callbackURL: process.env.MICROSOFT_CALLBACK_URL || '/api/auth/microsoft/callback',
      scope: ['user.read', 'email', 'profile'],
      tenant: process.env.MICROSOFT_TENANT_ID || 'common'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value || profile._json?.mail || profile._json?.userPrincipalName;
        
        if (!email) {
          return done(null, false, { message: 'No email found in Microsoft profile' });
        }

        // Check email domain
        if (!isAllowedEmailDomain(email)) {
          return done(null, false, { 
            message: 'Only @moe.sch.ae and @moe.gov.ae email addresses are allowed' 
          });
        }

        // Check if user exists
        let result = await db.query(
          'SELECT * FROM users WHERE email = $1 OR microsoft_id = $2',
          [email.toLowerCase(), profile.id]
        );

        let user;

        if (result.rows.length === 0) {
          // Create new user
          const insertResult = await db.query(
            `INSERT INTO users (
              name, email, microsoft_id, email_verified, role, created_at
            ) VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING *`,
            [
              profile.displayName || email.split('@')[0],
              email.toLowerCase(),
              profile.id,
              true, // Auto-verify for Microsoft SSO
              'user'
            ]
          );
          user = insertResult.rows[0];
        } else {
          user = result.rows[0];
          
          // Update Microsoft ID if not set
          if (!user.microsoft_id) {
            await db.query(
              'UPDATE users SET microsoft_id = $1, email_verified = true WHERE id = $2',
              [profile.id, user.id]
            );
          }
          
          // Update last login
          await db.query(
            'UPDATE users SET last_login = NOW() WHERE id = $1',
            [user.id]
          );
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));
}

module.exports = passport;
