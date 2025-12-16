import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Mail, Phone, Building, Hash, BookMarked, 
  Calendar, Clock, Award, BookOpen, CheckCircle, 
  RotateCcw, Trash2, Shield, Download
} from 'lucide-react';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import Loading from '../../components/Loading';
import toast from 'react-hot-toast';

const UserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const [userRes, progressRes, certsRes, sessionsRes] = await Promise.all([
        api.get(`/admin/users/${userId}`),
        api.get(`/admin/users/${userId}/progress`),
        api.get(`/admin/users/${userId}/certificates`),
        api.get(`/admin/users/${userId}/sessions`)
      ]);
      
      setUser(userRes.data);
      setProgress(progressRes.data || []);
      setCertificates(certsRes.data || []);
      setSessions(sessionsRes.data || []);
    } catch (err) {
      toast.error('Failed to load user data');
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const handleResetProgress = async () => {
    if (!window.confirm('Are you sure you want to reset this user\'s progress? This cannot be undone.')) return;
    try {
      await api.post(`/admin/users/${userId}/reset-progress`);
      toast.success('Progress reset successfully');
      fetchUserData();
    } catch (err) {
      toast.error('Failed to reset progress');
    }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted');
      navigate('/admin/users');
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const handleToggleAdmin = async () => {
    try {
      const newRole = user.role === 'admin' ? 'user' : 'admin';
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success(`User is now ${newRole}`);
      fetchUserData();
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      <Navbar />
      
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin/users" className="btn btn-ghost">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{user?.name}</h1>
            <p className="text-gray">{user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleToggleAdmin} className="btn btn-outline">
              <Shield size={18} /> 
              {user?.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
            </button>
            <button onClick={handleResetProgress} className="btn btn-outline text-warning">
              <RotateCcw size={18} /> Reset Progress
            </button>
            <button onClick={handleDeleteUser} className="btn btn-danger">
              <Trash2 size={18} /> Delete
            </button>
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '350px 1fr', gap: '2rem', alignItems: 'start' }}>
          {/* User Info */}
          <div className="card">
            <div className="card-body p-6">
              <div className="flex flex-col items-center mb-6">
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #1a5276 0%, #2874a6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <span style={{ fontSize: '2rem', fontWeight: 600, color: 'white' }}>
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <h3 className="font-semibold text-lg">{user?.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`badge ${user?.role === 'admin' ? 'badge-info' : 'badge-gray'}`}>
                    {user?.role}
                  </span>
                  {user?.email_verified ? (
                    <span className="badge badge-success">Verified</span>
                  ) : (
                    <span className="badge badge-warning">Unverified</span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <InfoField icon={<Mail size={16} />} label="Email" value={user?.email} />
                <InfoField icon={<Phone size={16} />} label="Phone" value={user?.phone || '-'} />
                <InfoField icon={<Building size={16} />} label="School" value={user?.school || '-'} />
                <InfoField icon={<Hash size={16} />} label="Oracle Number" value={user?.oracle_number || '-'} />
                <InfoField icon={<BookMarked size={16} />} label="Subject Taught" value={user?.subject_taught || '-'} />
                <InfoField 
                  icon={<Calendar size={16} />} 
                  label="Joined" 
                  value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'} 
                />
                <InfoField 
                  icon={<Clock size={16} />} 
                  label="Last Active" 
                  value={user?.last_active ? new Date(user.last_active).toLocaleString() : 'Never'} 
                />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              <StatCard 
                icon={<BookOpen size={20} />} 
                label="Courses" 
                value={progress?.length || 0}
                bg="#e0f2fe"
                color="#1a5276"
              />
              <StatCard 
                icon={<CheckCircle size={20} />} 
                label="Completed" 
                value={progress?.filter(p => p.completion_status === 'completed').length || 0}
                bg="#d1fae5"
                color="#059669"
              />
              <StatCard 
                icon={<Award size={20} />} 
                label="Certificates" 
                value={certificates?.length || 0}
                bg="#fef3c7"
                color="#d97706"
              />
              <StatCard 
                icon={<Clock size={20} />} 
                label="Total Time" 
                value={formatTotalTime(progress)}
                bg="#ede9fe"
                color="#7c3aed"
              />
            </div>

            {/* Course Progress */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold">Course Progress</h2>
              </div>
              <div className="card-body p-0">
                {progress?.length > 0 ? (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Progress</th>
                        <th>Score</th>
                        <th>Status</th>
                        <th>Time Spent</th>
                        <th>Last Access</th>
                      </tr>
                    </thead>
                    <tbody>
                      {progress.map((p, index) => (
                        <tr key={index}>
                          <td className="font-medium">{p.course_title}</td>
                          <td>
                            <div style={{ width: '100px' }}>
                              <div className="flex items-center gap-2">
                                <div style={{ 
                                  flex: 1,
                                  height: '6px', 
                                  backgroundColor: '#e2e8f0', 
                                  borderRadius: '3px'
                                }}>
                                  <div style={{ 
                                    width: `${p.progress_percentage || 0}%`, 
                                    height: '100%', 
                                    backgroundColor: p.progress_percentage === 100 ? '#059669' : '#1a5276',
                                    borderRadius: '3px'
                                  }}></div>
                                </div>
                                <span className="text-xs text-gray">{p.progress_percentage || 0}%</span>
                              </div>
                            </div>
                          </td>
                          <td>{p.score || 0}%</td>
                          <td>
                            <span className={`badge ${getStatusBadge(p.completion_status)}`}>
                              {p.completion_status}
                            </span>
                          </td>
                          <td className="text-gray">{formatTime(p.total_time_spent)}</td>
                          <td className="text-gray text-sm">
                            {p.last_access ? new Date(p.last_access).toLocaleString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-gray">No course progress yet</div>
                )}
              </div>
            </div>

            {/* Certificates */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold">Certificates</h2>
              </div>
              <div className="card-body p-0">
                {certificates?.length > 0 ? (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Certificate #</th>
                        <th>Issue Date</th>
                        <th>Score</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {certificates.map((cert) => (
                        <tr key={cert.id}>
                          <td className="font-medium">{cert.course_title}</td>
                          <td style={{ fontFamily: 'monospace' }}>{cert.certificate_number}</td>
                          <td className="text-gray">
                            {new Date(cert.issued_at).toLocaleDateString()}
                          </td>
                          <td>
                            <span className="badge badge-success">{cert.score}%</span>
                          </td>
                          <td>
                            <a 
                              href={`/verify-certificate/${cert.certificate_number}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline"
                            >
                              Verify
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-gray">No certificates earned yet</div>
                )}
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold">Recent Sessions</h2>
              </div>
              <div className="card-body p-0">
                {sessions?.length > 0 ? (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Start Time</th>
                        <th>Duration</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.slice(0, 10).map((session, index) => (
                        <tr key={index}>
                          <td className="font-medium">{session.course_title}</td>
                          <td className="text-gray">
                            {new Date(session.start_time).toLocaleString()}
                          </td>
                          <td className="text-gray">{formatTime(session.duration)}</td>
                          <td>
                            <span className={`badge ${session.completed ? 'badge-success' : 'badge-gray'}`}>
                              {session.completed ? 'Completed' : 'Exited'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-gray">No session history</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoField = ({ icon, label, value }) => (
  <div>
    <label className="flex items-center gap-2 text-xs text-gray mb-1">
      {icon} {label}
    </label>
    <p className="text-sm font-medium">{value}</p>
  </div>
);

const StatCard = ({ icon, label, value, bg, color }) => (
  <div className="card">
    <div className="card-body p-4">
      <div className="flex items-center gap-3">
        <div style={{ 
          width: '40px', 
          height: '40px', 
          borderRadius: '8px', 
          backgroundColor: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color
        }}>
          {icon}
        </div>
        <div>
          <p className="text-xl font-bold">{value}</p>
          <p className="text-xs text-gray">{label}</p>
        </div>
      </div>
    </div>
  </div>
);

const getStatusBadge = (status) => {
  switch (status) {
    case 'completed':
    case 'passed':
      return 'badge-success';
    case 'incomplete':
      return 'badge-warning';
    default:
      return 'badge-gray';
  }
};

const formatTime = (seconds) => {
  if (!seconds) return '0m';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

const formatTotalTime = (progress) => {
  const totalSeconds = progress?.reduce((acc, p) => acc + (p.total_time_spent || 0), 0) || 0;
  return formatTime(totalSeconds);
};

export default UserDetail;
