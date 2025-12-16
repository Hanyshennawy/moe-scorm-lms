import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, BookOpen, Award, TrendingUp, 
  Clock, CheckCircle, XCircle, Activity 
} from 'lucide-react';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import Loading from '../../components/Loading';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/recent-activity')
      ]);
      setStats(statsRes.data);
      setRecentActivity(activityRes.data || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  const COLORS = ['#1a5276', '#059669', '#d97706', '#dc2626'];

  const statusData = [
    { name: 'Completed', value: stats?.completedUsers || 0, color: '#059669' },
    { name: 'In Progress', value: stats?.inProgressUsers || 0, color: '#d97706' },
    { name: 'Not Started', value: stats?.notStartedUsers || 0, color: '#94a3b8' }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      <Navbar />
      
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-gray">Overview of platform activity and statistics</p>
          </div>
          <Link to="/admin/users" className="btn btn-primary">
            <Users size={18} /> Manage Users
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid mb-6" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
          <StatCard 
            icon={<Users size={24} />} 
            label="Total Users" 
            value={stats?.totalUsers || 0}
            change={`+${stats?.newUsersToday || 0} today`}
            color="#1a5276"
            bg="#e0f2fe"
          />
          <StatCard 
            icon={<BookOpen size={24} />} 
            label="Active Learners" 
            value={stats?.activeLearners || 0}
            change="Last 7 days"
            color="#059669"
            bg="#d1fae5"
          />
          <StatCard 
            icon={<Award size={24} />} 
            label="Certificates Issued" 
            value={stats?.totalCertificates || 0}
            change={`${stats?.certificatesToday || 0} today`}
            color="#d97706"
            bg="#fef3c7"
          />
          <StatCard 
            icon={<TrendingUp size={24} />} 
            label="Completion Rate" 
            value={`${stats?.completionRate || 0}%`}
            change="Overall"
            color="#7c3aed"
            bg="#ede9fe"
          />
        </div>

        <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          {/* Activity Chart */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">User Activity (Last 30 Days)</h2>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats?.activityChart || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="sessions" 
                    stroke="#1a5276" 
                    fill="#e0f2fe" 
                    name="Sessions"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Learner Status</h2>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-4">
                {statusData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: item.color }}></div>
                    <span className="text-sm text-gray">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid mt-6" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Recent Registrations */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Recent Registrations</h2>
              <Link to="/admin/users" className="text-sm text-primary">View All</Link>
            </div>
            <div className="card-body p-0">
              {stats?.recentUsers?.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentUsers.slice(0, 5).map((user) => (
                      <tr key={user.id}>
                        <td>
                          <Link to={`/admin/users/${user.id}`} className="font-medium">
                            {user.name}
                          </Link>
                        </td>
                        <td className="text-gray">{user.email}</td>
                        <td className="text-gray text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center text-gray">No recent registrations</div>
              )}
            </div>
          </div>

          {/* Recent Completions */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Recent Completions</h2>
              <Link to="/admin/analytics" className="text-sm text-primary">View Analytics</Link>
            </div>
            <div className="card-body p-0">
              {stats?.recentCompletions?.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Course</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentCompletions.slice(0, 5).map((completion, index) => (
                      <tr key={index}>
                        <td className="font-medium">{completion.user_name}</td>
                        <td className="text-gray">{completion.course_title}</td>
                        <td>
                          <span className="badge badge-success">{completion.score}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center text-gray">No recent completions</div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid mt-6" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <Link to="/admin/users" className="card p-4 text-center" style={{ textDecoration: 'none' }}>
            <Users size={32} color="#1a5276" style={{ margin: '0 auto 0.5rem' }} />
            <p className="font-medium">Manage Users</p>
            <p className="text-xs text-gray">{stats?.totalUsers || 0} users</p>
          </Link>
          <Link to="/admin/analytics" className="card p-4 text-center" style={{ textDecoration: 'none' }}>
            <Activity size={32} color="#059669" style={{ margin: '0 auto 0.5rem' }} />
            <p className="font-medium">View Analytics</p>
            <p className="text-xs text-gray">Detailed reports</p>
          </Link>
          <Link to="/admin/certificates" className="card p-4 text-center" style={{ textDecoration: 'none' }}>
            <Award size={32} color="#d97706" style={{ margin: '0 auto 0.5rem' }} />
            <p className="font-medium">Certificates</p>
            <p className="text-xs text-gray">{stats?.totalCertificates || 0} issued</p>
          </Link>
          <Link to="/admin/export" className="card p-4 text-center" style={{ textDecoration: 'none' }}>
            <TrendingUp size={32} color="#7c3aed" style={{ margin: '0 auto 0.5rem' }} />
            <p className="font-medium">Export Data</p>
            <p className="text-xs text-gray">Download reports</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, change, color, bg }) => (
  <div className="card">
    <div className="card-body p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray text-sm mb-1">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
          <p className="text-xs text-gray mt-1">{change}</p>
        </div>
        <div style={{ 
          width: '48px', 
          height: '48px', 
          borderRadius: '12px', 
          backgroundColor: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color
        }}>
          {icon}
        </div>
      </div>
    </div>
  </div>
);

export default Dashboard;
