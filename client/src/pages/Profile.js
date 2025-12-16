import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  User, Mail, Phone, Building, Hash, BookMarked, 
  Edit2, Save, X, Award, BookOpen, Clock, 
  CheckCircle, Play, Download, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Loading from '../components/Loading';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const [profileRes, progressRes, certsRes] = await Promise.all([
        api.get('/users/profile'),
        api.get('/users/progress-summary'),
        api.get('/users/certificates')
      ]);
      
      const profileData = profileRes.data.user || profileRes.data;
      const progressData = progressRes.data.courses || progressRes.data;
      const certsData = certsRes.data.certificates || certsRes.data;
      
      setProfile(profileData);
      setProgress({ courses: progressData });
      setCertificates(certsData);
      setFormData(profileData);
    } catch (err) {
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.put('/users/profile', formData);
      setProfile(response.data.user);
      setUser({ ...user, name: response.data.user.name });
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadCertificate = async (certId) => {
    try {
      const response = await api.get(`/certificates/${certId}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate-${certId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Failed to download certificate');
    }
  };

  if (loading) return <Loading />;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="badge badge-success">Completed</span>;
      case 'passed':
        return <span className="badge badge-success">Passed</span>;
      case 'incomplete':
        return <span className="badge badge-warning">In Progress</span>;
      case 'not attempted':
        return <span className="badge badge-gray">Not Started</span>;
      default:
        return <span className="badge badge-gray">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      <Navbar />
      
      <div className="container py-8">
        <div className="grid" style={{ gridTemplateColumns: '350px 1fr', gap: '2rem', alignItems: 'start' }}>
          {/* Profile Card */}
          <div className="card">
            <div className="card-body p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Profile</h2>
                {!editing ? (
                  <button onClick={() => setEditing(true)} className="btn btn-sm btn-outline">
                    <Edit2 size={14} /> Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => { setEditing(false); setFormData(profile); }} className="btn btn-sm btn-outline">
                      <X size={14} />
                    </button>
                    <button onClick={handleSave} className="btn btn-sm btn-primary" disabled={saving}>
                      <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              {/* Avatar */}
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
                    {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <h3 className="font-semibold text-lg">{profile?.name}</h3>
                <span className="badge badge-info mt-1">{profile?.role}</span>
              </div>

              {/* Profile Fields */}
              <div className="space-y-4">
                <ProfileField 
                  icon={<Mail size={16} />} 
                  label="Email" 
                  value={profile?.email}
                  disabled 
                />
                
                {editing ? (
                  <>
                    <EditableField
                      icon={<User size={16} />}
                      label="Name"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleChange}
                    />
                    <EditableField
                      icon={<Phone size={16} />}
                      label="Phone"
                      name="phone"
                      value={formData.phone || ''}
                      onChange={handleChange}
                    />
                    <EditableField
                      icon={<Building size={16} />}
                      label="School"
                      name="school"
                      value={formData.school || ''}
                      onChange={handleChange}
                    />
                    <EditableField
                      icon={<Hash size={16} />}
                      label="Oracle Number"
                      name="oracle_number"
                      value={formData.oracle_number || ''}
                      onChange={handleChange}
                    />
                    <EditableField
                      icon={<BookMarked size={16} />}
                      label="Subject Taught"
                      name="subject_taught"
                      value={formData.subject_taught || ''}
                      onChange={handleChange}
                    />
                  </>
                ) : (
                  <>
                    <ProfileField icon={<Phone size={16} />} label="Phone" value={profile?.phone || '-'} />
                    <ProfileField icon={<Building size={16} />} label="School" value={profile?.school || '-'} />
                    <ProfileField icon={<Hash size={16} />} label="Oracle Number" value={profile?.oracle_number || '-'} />
                    <ProfileField icon={<BookMarked size={16} />} label="Subject Taught" value={profile?.subject_taught || '-'} />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              <StatCard 
                icon={<BookOpen size={20} color="#1a5276" />} 
                label="Courses" 
                value={progress?.totalCourses || 0}
                bg="#e0f2fe"
              />
              <StatCard 
                icon={<CheckCircle size={20} color="#059669" />} 
                label="Completed" 
                value={progress?.completedCourses || 0}
                bg="#d1fae5"
              />
              <StatCard 
                icon={<Clock size={20} color="#d97706" />} 
                label="In Progress" 
                value={progress?.inProgressCourses || 0}
                bg="#fef3c7"
              />
              <StatCard 
                icon={<Award size={20} color="#7c3aed" />} 
                label="Certificates" 
                value={certificates?.length || 0}
                bg="#ede9fe"
              />
            </div>

            {/* Course Progress */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold">My Courses</h2>
              </div>
              <div className="card-body p-0">
                {progress?.courses?.length > 0 ? (
                  <div>
                    {progress.courses.map((course) => (
                      <div key={course.course_id} className="p-4" style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium mb-1">{course.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray">
                              <span>Progress: {Math.round(course.progress_percentage || 0)}%</span>
                              <span>Score: {course.score || 0}%</span>
                              {course.total_time_spent && (
                                <span>Time: {formatTime(course.total_time_spent)}</span>
                              )}
                            </div>
                            {/* Progress Bar */}
                            <div style={{ 
                              width: '100%', 
                              height: '6px', 
                              backgroundColor: '#e2e8f0', 
                              borderRadius: '3px',
                              marginTop: '0.5rem'
                            }}>
                              <div style={{ 
                                width: `${course.progress_percentage || 0}%`, 
                                height: '100%', 
                                backgroundColor: course.progress_percentage === 100 ? '#059669' : '#1a5276',
                                borderRadius: '3px',
                                transition: 'width 0.3s ease'
                              }}></div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 ml-4">
                            {getStatusBadge(course.completion_status)}
                            <Link to={`/course/${course.course_id}`} className="btn btn-sm btn-primary">
                              <Play size={14} /> {course.completion_status === 'not attempted' ? 'Start' : 'Continue'}
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray">
                    <BookOpen size={48} className="mx-auto mb-4" style={{ opacity: 0.5 }} />
                    <p>No courses enrolled yet.</p>
                    <Link to="/course/1" className="btn btn-primary mt-4">
                      Start Learning
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Certificates */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold">My Certificates</h2>
              </div>
              <div className="card-body p-0">
                {certificates?.length > 0 ? (
                  <div>
                    {certificates.map((cert) => (
                      <div key={cert.id} className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <div className="flex items-center gap-4">
                          <div style={{ 
                            width: '48px', 
                            height: '48px', 
                            borderRadius: '8px', 
                            backgroundColor: '#fef3c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Award size={24} color="#d97706" />
                          </div>
                          <div>
                            <h3 className="font-medium">{cert.course_title}</h3>
                            <p className="text-sm text-gray">
                              Issued: {new Date(cert.issued_at).toLocaleDateString()}
                              {cert.certificate_number && ` • #${cert.certificate_number}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a 
                            href={`/verify-certificate/${cert.certificate_number}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline"
                          >
                            <Eye size={14} /> Verify
                          </a>
                          <button 
                            onClick={() => handleDownloadCertificate(cert.id)} 
                            className="btn btn-sm btn-primary"
                          >
                            <Download size={14} /> Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray">
                    <Award size={48} className="mx-auto mb-4" style={{ opacity: 0.5 }} />
                    <p>No certificates earned yet.</p>
                    <p className="text-sm mt-2">Complete a course to earn your certificate!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const ProfileField = ({ icon, label, value, disabled }) => (
  <div>
    <label className="flex items-center gap-2 text-xs text-gray mb-1">
      {icon} {label}
    </label>
    <p className="text-sm font-medium">{value}</p>
  </div>
);

const EditableField = ({ icon, label, name, value, onChange }) => (
  <div>
    <label className="flex items-center gap-2 text-xs text-gray mb-1">
      {icon} {label}
    </label>
    <input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      className="form-input"
      style={{ padding: '0.5rem', fontSize: '0.875rem' }}
    />
  </div>
);

const StatCard = ({ icon, label, value, bg }) => (
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
          justifyContent: 'center'
        }}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-gray">{label}</p>
        </div>
      </div>
    </div>
  </div>
);

const formatTime = (seconds) => {
  if (!seconds) return '0m';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

export default Profile;
