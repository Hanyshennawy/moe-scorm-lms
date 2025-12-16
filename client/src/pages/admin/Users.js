import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, Filter, Download, MoreVertical, 
  ChevronLeft, ChevronRight, Mail, CheckCircle, 
  XCircle, Shield, User as UserIcon, Trash2
} from 'lucide-react';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import Loading from '../../components/Loading';
import toast from 'react-hot-toast';

const Users = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);

  const page = parseInt(searchParams.get('page')) || 1;
  const status = searchParams.get('status') || '';
  const role = searchParams.get('role') || '';

  useEffect(() => {
    fetchUsers();
  }, [page, status, role, searchParams]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...(search && { search }),
        ...(status && { status }),
        ...(role && { role })
      });
      
      const response = await api.get(`/admin/users?${params}`);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ ...Object.fromEntries(searchParams), search, page: 1 });
    fetchUsers();
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/admin/export/users', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'users.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Users exported successfully');
    } catch (err) {
      toast.error('Failed to export users');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success('Role updated successfully');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update role');
    }
    setActionMenuOpen(null);
  };

  const handleVerifyEmail = async (userId) => {
    try {
      await api.post(`/admin/users/${userId}/verify`);
      toast.success('Email verified');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to verify email');
    }
    setActionMenuOpen(null);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to delete user');
    }
    setActionMenuOpen(null);
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      <Navbar />
      
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-gray">{pagination.total || 0} total users</p>
          </div>
          <button onClick={handleExport} className="btn btn-outline">
            <Download size={18} /> Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="card-body p-4">
            <div className="flex items-center gap-4">
              <form onSubmit={handleSearch} className="flex-1">
                <div style={{ position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Search by name, email, or school..."
                    className="form-input"
                    style={{ paddingLeft: '40px' }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </form>
              <select 
                className="form-select" 
                style={{ width: 'auto' }}
                value={status}
                onChange={(e) => setSearchParams({ ...Object.fromEntries(searchParams), status: e.target.value, page: 1 })}
              >
                <option value="">All Status</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
              <select 
                className="form-select" 
                style={{ width: 'auto' }}
                value={role}
                onChange={(e) => setSearchParams({ ...Object.fromEntries(searchParams), role: e.target.value, page: 1 })}
              >
                <option value="">All Roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="card">
          <div className="card-body p-0">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>School</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th style={{ width: '60px' }}></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div style={{ 
                          width: '36px', 
                          height: '36px', 
                          borderRadius: '50%', 
                          backgroundColor: '#e0f2fe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#1a5276'
                        }}>
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <Link to={`/admin/users/${user.id}`} className="font-medium">
                            {user.name}
                          </Link>
                          <p className="text-xs text-gray">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-gray">{user.school || '-'}</td>
                    <td>
                      {user.email_verified ? (
                        <span className="badge badge-success">
                          <CheckCircle size={12} /> Verified
                        </span>
                      ) : (
                        <span className="badge badge-warning">
                          <XCircle size={12} /> Unverified
                        </span>
                      )}
                    </td>
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
                              width: `${user.progress || 0}%`, 
                              height: '100%', 
                              backgroundColor: user.progress === 100 ? '#059669' : '#1a5276',
                              borderRadius: '3px'
                            }}></div>
                          </div>
                          <span className="text-xs text-gray">{user.progress || 0}%</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${user.role === 'admin' ? 'badge-info' : 'badge-gray'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="text-gray text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ position: 'relative' }}>
                        <button 
                          onClick={() => setActionMenuOpen(actionMenuOpen === user.id ? null : user.id)}
                          className="btn btn-sm btn-ghost"
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {actionMenuOpen === user.id && (
                          <div className="dropdown-menu" style={{ 
                            position: 'absolute', 
                            right: 0, 
                            top: '100%',
                            zIndex: 10
                          }}>
                            <Link to={`/admin/users/${user.id}`} className="dropdown-item">
                              <UserIcon size={14} /> View Details
                            </Link>
                            {!user.email_verified && (
                              <button onClick={() => handleVerifyEmail(user.id)} className="dropdown-item">
                                <Mail size={14} /> Verify Email
                              </button>
                            )}
                            {user.role === 'user' ? (
                              <button onClick={() => handleRoleChange(user.id, 'admin')} className="dropdown-item">
                                <Shield size={14} /> Make Admin
                              </button>
                            ) : (
                              <button onClick={() => handleRoleChange(user.id, 'user')} className="dropdown-item">
                                <UserIcon size={14} /> Remove Admin
                              </button>
                            )}
                            <button onClick={() => handleDeleteUser(user.id)} className="dropdown-item text-danger">
                              <Trash2 size={14} /> Delete User
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="p-8 text-center text-gray">
                No users found matching your criteria.
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="card-footer flex items-center justify-between">
              <p className="text-sm text-gray">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, pagination.total)} of {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: page - 1 })}
                  disabled={page === 1}
                  className="btn btn-sm btn-outline"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <span className="text-sm text-gray">Page {page} of {pagination.pages}</span>
                <button 
                  onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: page + 1 })}
                  disabled={page === pagination.pages}
                  className="btn btn-sm btn-outline"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Users;
