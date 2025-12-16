import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Download, Calendar, TrendingUp, Users, 
  Award, Clock, BookOpen, BarChart3 
} from 'lucide-react';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import Loading from '../../components/Loading';
import toast from 'react-hot-toast';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get(`/admin/analytics?days=${timeRange}`);
      setAnalytics(response.data);
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    try {
      const response = await api.get(`/admin/export/${type}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`${type} exported successfully`);
    } catch (err) {
      toast.error('Failed to export data');
    }
  };

  if (loading) return <Loading />;

  const COLORS = ['#1a5276', '#059669', '#d97706', '#dc2626', '#7c3aed'];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      <Navbar />
      
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-gray">Detailed insights into platform usage and performance</p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="form-select"
              style={{ width: 'auto' }}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
            <div className="dropdown">
              <button className="btn btn-primary">
                <Download size={18} /> Export
              </button>
              <div className="dropdown-menu" style={{ display: 'none' }}>
                <button onClick={() => handleExport('users')} className="dropdown-item">
                  Export Users
                </button>
                <button onClick={() => handleExport('progress')} className="dropdown-item">
                  Export Progress
                </button>
                <button onClick={() => handleExport('certificates')} className="dropdown-item">
                  Export Certificates
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid mb-6" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
          <SummaryCard 
            icon={<Users size={20} />}
            label="Total Users"
            value={analytics?.summary?.totalUsers || 0}
            change={`+${analytics?.summary?.newUsers || 0}`}
            color="#1a5276"
          />
          <SummaryCard 
            icon={<BookOpen size={20} />}
            label="Enrollments"
            value={analytics?.summary?.totalEnrollments || 0}
            change={`+${analytics?.summary?.newEnrollments || 0}`}
            color="#059669"
          />
          <SummaryCard 
            icon={<Award size={20} />}
            label="Certificates"
            value={analytics?.summary?.totalCertificates || 0}
            change={`+${analytics?.summary?.newCertificates || 0}`}
            color="#d97706"
          />
          <SummaryCard 
            icon={<TrendingUp size={20} />}
            label="Completion Rate"
            value={`${analytics?.summary?.completionRate || 0}%`}
            change={`${analytics?.summary?.completionRateChange > 0 ? '+' : ''}${analytics?.summary?.completionRateChange || 0}%`}
            color="#7c3aed"
          />
          <SummaryCard 
            icon={<Clock size={20} />}
            label="Avg. Time"
            value={formatTime(analytics?.summary?.avgTimeSpent)}
            change="per user"
            color="#dc2626"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid mb-6" style={{ gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          {/* User Activity */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">User Activity Over Time</h2>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics?.userActivity || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip />
                  <Area type="monotone" dataKey="activeUsers" stroke="#1a5276" fill="#e0f2fe" name="Active Users" />
                  <Area type="monotone" dataKey="newUsers" stroke="#059669" fill="#d1fae5" name="New Users" />
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
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={analytics?.statusDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {(analytics?.statusDistribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {(analytics?.statusDistribution || []).map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-xs text-gray">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid mb-6" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Completion Trends */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Completions Over Time</h2>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={analytics?.completionTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="completions" stroke="#059669" strokeWidth={2} name="Completions" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Score Distribution */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Score Distribution</h2>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics?.scoreDistribution || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="range" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1a5276" name="Users" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tables Row */}
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Top Performers */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Top Performers</h2>
              <Link to="/admin/users" className="text-sm text-primary">View All</Link>
            </div>
            <div className="card-body p-0">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>User</th>
                    <th>Score</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {(analytics?.topPerformers || []).slice(0, 10).map((user, index) => (
                    <tr key={user.id}>
                      <td>
                        <span className={`badge ${index < 3 ? 'badge-warning' : 'badge-gray'}`}>
                          #{index + 1}
                        </span>
                      </td>
                      <td>
                        <Link to={`/admin/users/${user.id}`} className="font-medium">
                          {user.name}
                        </Link>
                      </td>
                      <td>
                        <span className="badge badge-success">{user.score}%</span>
                      </td>
                      <td className="text-gray">{formatTime(user.timeSpent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!analytics?.topPerformers || analytics.topPerformers.length === 0) && (
                <div className="p-6 text-center text-gray">No data available</div>
              )}
            </div>
          </div>

          {/* Recent Certificates */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Recent Certificates</h2>
            </div>
            <div className="card-body p-0">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Course</th>
                    <th>Date</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {(analytics?.recentCertificates || []).slice(0, 10).map((cert, index) => (
                    <tr key={index}>
                      <td className="font-medium">{cert.userName}</td>
                      <td className="text-gray">{cert.courseTitle}</td>
                      <td className="text-gray text-sm">
                        {new Date(cert.issuedAt).toLocaleDateString()}
                      </td>
                      <td>
                        <span className="badge badge-success">{cert.score}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!analytics?.recentCertificates || analytics.recentCertificates.length === 0) && (
                <div className="p-6 text-center text-gray">No certificates issued yet</div>
              )}
            </div>
          </div>
        </div>

        {/* School Performance */}
        <div className="card mt-6">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Performance by School</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.schoolPerformance || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                <YAxis type="category" dataKey="school" stroke="#94a3b8" fontSize={12} width={150} />
                <Tooltip />
                <Bar dataKey="users" fill="#1a5276" name="Users" radius={[0, 4, 4, 0]} />
                <Bar dataKey="completions" fill="#059669" name="Completions" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ icon, label, value, change, color }) => (
  <div className="card">
    <div className="card-body p-4">
      <div className="flex items-center gap-3">
        <div style={{ color }}>{icon}</div>
        <div className="flex-1">
          <p className="text-xs text-gray">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
        <span className="text-xs text-gray">{change}</span>
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

export default Analytics;
