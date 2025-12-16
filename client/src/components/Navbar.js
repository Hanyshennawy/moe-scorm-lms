import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  User, LogOut, BookOpen, LayoutDashboard, 
  Users, BarChart3, ChevronDown, Award 
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const isActive = (path) => location.pathname === path;
  const isAdmin = user?.role === 'admin';

  return (
    <nav className="navbar">
      <div className="container">
        <div className="flex items-center justify-between" style={{ height: '64px' }}>
          {/* Logo */}
          <Link to={isAdmin ? '/admin' : '/profile'} className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
            <div className="flex items-center justify-center" style={{ 
              width: '40px', 
              height: '40px', 
              background: 'linear-gradient(135deg, #1a5276 0%, #2874a6 100%)',
              borderRadius: '8px'
            }}>
              <BookOpen size={24} color="white" />
            </div>
            <span style={{ fontWeight: 600, fontSize: '1.125rem', color: '#1a5276' }}>
              MOE Learning
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <>
                <Link 
                  to="/admin" 
                  className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <LayoutDashboard size={18} />
                  Dashboard
                </Link>
                <Link 
                  to="/admin/users" 
                  className={`nav-link ${isActive('/admin/users') ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Users size={18} />
                  Users
                </Link>
                <Link 
                  to="/admin/analytics" 
                  className={`nav-link ${isActive('/admin/analytics') ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <BarChart3 size={18} />
                  Analytics
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/profile" 
                  className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <User size={18} />
                  Profile
                </Link>
                <Link 
                  to="/course" 
                  className={`nav-link ${isActive('/course') ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <BookOpen size={18} />
                  Course
                </Link>
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="dropdown" onMouseLeave={() => setDropdownOpen(false)}>
            <button 
              className="flex items-center gap-2"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                padding: '0.5rem'
              }}
            >
              <div className="avatar">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="hidden-mobile" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                {user?.name}
              </span>
              <ChevronDown size={16} />
            </button>

            {dropdownOpen && (
              <div className="dropdown-menu" style={{ opacity: 1, visibility: 'visible', transform: 'translateY(0)' }}>
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{user?.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user?.email}</div>
                  {isAdmin && <span className="badge badge-info mt-1">Admin</span>}
                </div>
                
                <button 
                  className="dropdown-item"
                  onClick={() => { navigate('/profile'); setDropdownOpen(false); }}
                >
                  <User size={16} style={{ marginRight: '0.5rem' }} />
                  My Profile
                </button>
                
                {!isAdmin && (
                  <button 
                    className="dropdown-item"
                    onClick={() => { navigate('/profile'); setDropdownOpen(false); }}
                  >
                    <Award size={16} style={{ marginRight: '0.5rem' }} />
                    Certificates
                  </button>
                )}
                
                <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '0.25rem', paddingTop: '0.25rem' }}>
                  <button 
                    className="dropdown-item"
                    onClick={logout}
                    style={{ color: '#dc2626' }}
                  >
                    <LogOut size={16} style={{ marginRight: '0.5rem' }} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
