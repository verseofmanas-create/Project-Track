import { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, User, MapPin, Trash2, ShieldAlert } from 'lucide-react';

export default function UsersView({ role }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form state
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'Site Manager',
    location: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId, username) => {
    if (!confirm(`Are you sure you want to delete the user '${username}'?`)) return;
    
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user');
      
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to create user');
      
      // Reset form and refresh
      setFormData({ username: '', password: '', full_name: '', role: 'Site Manager', location: '' });
      setIsAdding(false);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  if (role !== 'Admin') {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-slate-400 h-96">
        <ShieldAlert className="w-16 h-16 text-red-500/50 mb-4" />
        <h2 className="text-xl font-bold text-slate-200">Access Denied</h2>
        <p className="mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500" />
            User Management
          </h1>
          <p className="text-slate-400 mt-1">Manage platform access for Site Managers and Clients</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-medium"
        >
          {isAdding ? 'Cancel' : <><UserPlus className="w-4 h-4" /> Add User</>}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {isAdding && (
        <div className="glass-panel border-slate-800/80 p-6 rounded-xl animate-in fade-in slide-in-from-top-4">
          <h2 className="text-lg font-semibold text-white mb-4">Create New User</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
              <input
                required
                type="text"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                value={formData.full_name}
                onChange={e => setFormData({...formData, full_name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Username</label>
              <input
                required
                type="text"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
              <input
                required
                type="password"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Role</label>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
              >
                <option value="Site Manager">Site Manager</option>
                <option value="Client">Client</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-1">Location / Assigned Project</label>
              <input
                type="text"
                placeholder="e.g. Hyderabad Hq, Skyline Towers"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
              />
            </div>
            <div className="md:col-span-2 flex justify-end mt-2">
              <button
                type="submit"
                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="glass-panel border-slate-800/80 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/50 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Location</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                        {u.role === 'Admin' ? <Shield className="w-5 h-5 text-emerald-400" /> : <User className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="font-medium text-white">{u.full_name}</div>
                        <div className="text-slate-500 text-xs">@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      u.role === 'Admin' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      u.role === 'Client' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">
                    {u.location ? (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {u.location}
                      </div>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(u.id, u.username)}
                      disabled={u.username === 'admin'}
                      className={`p-2 rounded-lg transition-colors ${
                        u.username === 'admin' 
                          ? 'text-slate-600 cursor-not-allowed' 
                          : 'text-slate-400 hover:text-red-400 hover:bg-red-400/10'
                      }`}
                      title={u.username === 'admin' ? "Cannot delete default admin" : "Delete user"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
