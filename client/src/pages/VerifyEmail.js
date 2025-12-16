import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import api from '../services/api';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. No token provided.');
        return;
      }

      try {
        const response = await api.get(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(response.data.message);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. The link may be expired.');
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ backgroundColor: '#f8fafc' }}>
      <div className="w-full max-w-md text-center">
        {status === 'loading' && (
          <>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              backgroundColor: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              <Loader size={40} color="#1a5276" className="animate-spin" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Verifying Your Email</h1>
            <p className="text-gray">Please wait while we verify your email address...</p>
          </>
        )}

        {status === 'success' && (
          <>
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
            <h1 className="text-2xl font-bold mb-3">Email Verified!</h1>
            <p className="text-gray mb-6">{message}</p>
            <Link to="/login" className="btn btn-primary">
              Continue to Login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              <XCircle size={40} color="#dc2626" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Verification Failed</h1>
            <p className="text-gray mb-6">{message}</p>
            <div className="flex items-center justify-center gap-3">
              <Link to="/login" className="btn btn-primary">
                Go to Login
              </Link>
              <Link to="/register" className="btn btn-outline">
                Sign Up Again
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
