import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Mail, Lock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const oauthError = searchParams.get('error');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/profile');
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = () => {
    window.location.href = '/api/auth/microsoft';
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ backgroundColor: '#f8fafc' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2" style={{ textDecoration: 'none' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              background: 'linear-gradient(135deg, #1a5276 0%, #2874a6 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BookOpen size={28} color="white" />
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a5276' }}>
              MOE Learning
            </span>
          </Link>
        </div>

        <div className="card">
          <div className="card-body p-8">
            <h1 className="text-2xl font-bold text-center mb-2">Welcome Back</h1>
            <p className="text-gray text-center mb-6">Sign in to continue your learning</p>

            {/* OAuth Error */}
            {oauthError && (
              <div className="flex items-center gap-2 p-3 mb-4" style={{ backgroundColor: '#fee2e2', borderRadius: '8px', color: '#991b1b' }}>
                <AlertCircle size={18} />
                <span className="text-sm">Microsoft login failed. Please try again or use email.</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 mb-4" style={{ backgroundColor: '#fee2e2', borderRadius: '8px', color: '#991b1b' }}>
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Microsoft SSO Button */}
            <button
              type="button"
              onClick={handleMicrosoftLogin}
              className="btn w-full mb-4"
              style={{ 
                backgroundColor: '#2f2f2f', 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
                <rect width="10" height="10" fill="#f25022"/>
                <rect x="11" width="10" height="10" fill="#7fba00"/>
                <rect y="11" width="10" height="10" fill="#00a4ef"/>
                <rect x="11" y="11" width="10" height="10" fill="#ffb900"/>
              </svg>
              Sign in with Microsoft
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
              <span className="text-gray text-sm">or</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="email"
                    className="form-input"
                    style={{ paddingLeft: '40px' }}
                    placeholder="your.name@moe.gov.ae"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="password"
                    className="form-input"
                    style={{ paddingLeft: '40px' }}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mb-6">
                <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                  <input type="checkbox" style={{ width: '16px', height: '16px' }} />
                  <span className="text-sm">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-primary" style={{ textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center mt-6 text-gray">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary font-medium" style={{ textDecoration: 'none' }}>
            Sign up
          </Link>
        </p>

        <p className="text-center mt-4 text-xs text-gray">
          Only @moe.sch.ae and @moe.gov.ae emails are allowed
        </p>
      </div>
    </div>
  );
};

export default Login;
