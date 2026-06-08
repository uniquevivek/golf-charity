'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { Users, Edit2, Trash2, Shield, User as UserIcon, Check, AlertCircle } from 'lucide-react';

interface UserRecord {
  id: string;
  fullName: string | null;
  email: string;
  role: 'USER' | 'ADMIN';
  donationPercentage: number;
  selectedCharity?: { name: string } | null;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit State
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'USER' | 'ADMIN'>('USER');
  const [editPct, setEditPct] = useState(10);
  const [updating, setUpdating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.get('/admin/users');
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve user accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditClick = (user: UserRecord) => {
    setEditingUser(user);
    setEditName(user.fullName || '');
    setEditRole(user.role);
    setEditPct(user.donationPercentage);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      await api.put(`/admin/users/${editingUser.id}`, {
        fullName: editName,
        role: editRole,
        donationPercentage: editPct,
      });

      setSuccess('User updated successfully!');
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update user record');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this user? All historical scores, subscriptions, and winnings will be permanently removed.')) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await api.delete(`/admin/users/${id}`);
      setSuccess('User record successfully deleted.');
      setUsers(users.filter((u) => u.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete user.');
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-primary text-sm flex items-start gap-2">
          <Check size={18} className="flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User List Panel */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="text-amber-500" size={20} />
            Registered Accounts
          </h2>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2].map((n) => (
                <div key={n} className="glass h-20 rounded-xl border border-border"></div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 glass rounded-2xl border border-border text-muted-foreground text-sm">
              No registered user profiles found.
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((item) => (
                <div
                  key={item.id}
                  className="glass-card p-4 rounded-xl border border-border flex items-center justify-between gap-4 group"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white">
                        {item.fullName || 'No Name synced'}
                      </span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        item.role === 'ADMIN'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-white/5 text-muted-foreground'
                      }`}>
                        {item.role}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{item.email}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Donation: <span className="text-primary font-bold">{item.donationPercentage}%</span> | Charity: <span className="text-white">{item.selectedCharity?.name || 'Baseline Pool'}</span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(item)}
                      className="p-2 rounded bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                      title="Edit User"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(item.id)}
                      className="p-2 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                      title="Delete User"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Form Panel */}
        <div className="glass p-6 rounded-2xl border border-border h-fit">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Edit2 className="text-amber-500" size={18} />
            {editingUser ? 'Edit User Details' : 'Select a User to Edit'}
          </h2>

          {editingUser ? (
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#111827]/40 border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Security Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="w-full bg-[#111827]/60 border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                >
                  <option value="USER">USER (Subscriber)</option>
                  <option value="ADMIN">ADMIN (Manager)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Donation Allocation ({editPct}%)</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={editPct}
                  onChange={(e) => setEditPct(parseInt(e.target.value, 10))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs text-slate-300 font-bold hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <p className="text-xs text-muted-foreground leading-relaxed">
              Click the edit icon on any user in the registry list to modify their credentials, update security permissions (ADMIN/USER), or configure custom donation percentage profiles.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
