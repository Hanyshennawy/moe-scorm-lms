import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, User, Mail, Lock, Phone, Building, Hash, BookMarked, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    school: '',
    oracle_number: '',
    subject_taught: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      setError('Password must contain uppercase, lowercase, and number');
      return false;
    }
    const domain = formData.email.split('@')[1]?.toLowerCase();
    if (!['moe.sch.ae', 'moe.gov.ae'].includes(domain)) {
      setError('Only @moe.sch.ae and @moe.gov.ae emails are allowed');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const { confirmPassword, ...userData } = formData;
      await register(userData);
      setSuccess(true);
      toast.success('Registration successful! Check your email.');
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ backgroundColor: '#f8fafc' }}>
        <div className="w-full max-w-md text-center">
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            backgroundColor: '#d1fae5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <CheckCircle size={40} color="#059669" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Check Your Email</h1>
          <p className="text-gray mb-6">
            We've sent a verification link to <strong>{formData.email}</strong>. 
            Please check your inbox and click the link to verify your account.
          </p>
          <Link to="/login" className="btn btn-primary">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ backgroundColor: '#f8fafc' }}>
      <div className="w-full max-w-lg">
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
            <h1 className="text-2xl font-bold text-center mb-2">Create Your Account</h1>
            <p className="text-gray text-center mb-6">Join the MOE Learning Platform</p>

            {error && (
              <div className="flex items-center gap-2 p-3 mb-4" style={{ backgroundColor: '#fee2e2', borderRadius: '8px', color: '#991b1b' }}>
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                {/* Name */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Full Name *</label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      name="name"
                      className="form-input"
                      style={{ paddingLeft: '40px' }}
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Email Address *</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="email"
                      name="email"
                      className="form-input"
                      style={{ paddingLeft: '40px' }}
                      placeholder="your.name@moe.gov.ae"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray mt-1">Only @moe.sch.ae and @moe.gov.ae allowed</p>
                </div>

                {/* Password */}
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="password"
                      name="password"
                      className="form-input"
                      style={{ paddingLeft: '40px' }}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="password"
                      name="confirmPassword"
                      className="form-input"
                      style={{ paddingLeft: '40px' }}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="tel"
                      name="phone"
                      className="form-input"
                      style={{ paddingLeft: '40px' }}
                      placeholder="+971 XX XXX XXXX"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Oracle Number */}
                <div className="form-group">
                  <label className="form-label">Oracle Number</label>
                  <div style={{ position: 'relative' }}>
                    <Hash size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      name="oracle_number"
                      className="form-input"
                      style={{ paddingLeft: '40px' }}
                      placeholder="Enter Oracle number"
                      value={formData.oracle_number}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* School */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">School</label>
                  <div style={{ position: 'relative' }}>
                    <Building size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      name="school"
                      className="form-input"
                      style={{ paddingLeft: '40px' }}
                      placeholder="Enter your school name"
                      value={formData.school}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Subject Taught */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Subject Taught</label>
                  <div style={{ position: 'relative' }}>
                    <BookMarked size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      name="subject_taught"
                      className="form-input"
                      style={{ paddingLeft: '40px' }}
                      placeholder="e.g., Mathematics, English, Science"
                      value={formData.subject_taught}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full mt-4" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center mt-6 text-gray">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-medium" style={{ textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
