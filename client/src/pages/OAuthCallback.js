import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Microsoft login failed. Please try again.');
      navigate('/login?error=oauth');
      return;
    }

    if (token) {
      // Store token
      localStorage.setItem('token', token);
      
      // Decode token to get user info
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id: payload.id,
          email: payload.email,
          name: payload.name,
          role: payload.role
        });
        toast.success('Welcome!');
        navigate('/profile');
      } catch (err) {
        toast.error('Authentication failed.');
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8fafc' }}>
      <div className="text-center">
        <div className="animate-spin" style={{ 
          width: '48px', 
          height: '48px', 
          border: '4px solid #e2e8f0',
          borderTopColor: '#1a5276',
          borderRadius: '50%',
          margin: '0 auto 1rem'
        }}></div>
        <p className="text-gray">Completing sign in...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
