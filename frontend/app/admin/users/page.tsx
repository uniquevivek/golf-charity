'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import {
  Users,
  Edit2,
  Trash2,
  Shield,
  User as UserIcon,
  Check,
  AlertCircle,
  Calendar,
  Plus,
  Save,
  X,
  CreditCard,
  Target
} from 'lucide-react';

interface ScoreRecord {
  id: string;
  score: number;
  scoreDate: string;
}

interface SubscriptionRecord {
  id: string;
  plan: 'MONTHLY' | 'YEARLY';
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  amount: number;
  endDate: string | null;
}

interface UserRecord {
  id: string;
  fullName: string | null;
  email: string;
  role: 'USER' | 'ADMIN';
  donationPercentage: number;
  selectedCharity?: { name: string } | null;
  createdAt: string;
  scores?: ScoreRecord[];
  subscriptions?: SubscriptionRecord[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit User Profile State
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'USER' | 'ADMIN'>('USER');
  const [editPct, setEditPct] = useState(10);
  const [updating, setUpdating] = useState(false);

  // Subscription Override States
  const [subPlan, setSubPlan] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [subStatus, setSubStatus] = useState<'ACTIVE' | 'EXPIRED' | 'CANCELLED'>('ACTIVE');
  const [subAmount, setSubAmount] = useState<number>(29);
  const [subEndDate, setSubEndDate] = useState<string>('');
  const [savingSub, setSavingSub] = useState(false);

  // Score states
  const [newScoreVal, setNewScoreVal] = useState<number>(36);
  const [newScoreDate, setNewScoreDate] = useState<string>('');
  const [addingScore, setAddingScore] = useState(false);

  // Inline score edit states
  const [editingScoreId, setEditingScoreId] = useState<string | null>(null);
  const [editingScoreVal, setEditingScoreVal] = useState<number>(36);
  const [editingScoreDate, setEditingScoreDate] = useState<string>('');
  const [savingScore, setSavingScore] = useState(false);

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

    // Populate subscription override states from user.subscriptions[0]
    const sub = user.subscriptions && user.subscriptions[0];
    if (sub) {
      setSubPlan(sub.plan);
      setSubStatus(sub.status);
      setSubAmount(sub.amount);
      if (sub.endDate) {
        setSubEndDate(new Date(sub.endDate).toISOString().split('T')[0]);
      } else {
        setSubEndDate('');
      }
    } else {
      setSubPlan('MONTHLY');
      setSubStatus('EXPIRED');
      setSubAmount(29);
      setSubEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // default 30 days out
    }

    // Reset score inputs
    setNewScoreVal(36);
    setNewScoreDate(new Date().toISOString().split('T')[0]);
    setEditingScoreId(null);
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

      setSuccess('User profile details updated successfully!');
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update user record');
    } finally {
      setUpdating(false);
    }
  };

  const handleOverrideSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setSavingSub(true);
    setError(null);
    setSuccess(null);

    try {
      await api.put(`/admin/users/${editingUser.id}/subscription`, {
        plan: subPlan,
        status: subStatus,
        amount: subAmount,
        endDate: subEndDate,
      });

      setSuccess('Subscription overridden successfully!');
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to override user subscription');
    } finally {
      setSavingSub(false);
    }
  };

  const handleAdminAddScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setAddingScore(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post(`/admin/users/${editingUser.id}/scores`, {
        score: newScoreVal,
        scoreDate: newScoreDate,
      });

      setSuccess('Score card added successfully!');
      // Refresh users list and keep selected user active
      const updatedUsers = await api.get('/admin/users');
      setUsers(updatedUsers);
      const updatedUser = updatedUsers.find((u: any) => u.id === editingUser.id);
      if (updatedUser) {
        setEditingUser(updatedUser);
      }
      setNewScoreVal(36);
    } catch (err: any) {
      setError(err.message || 'Failed to add score card');
    } finally {
      setAddingScore(false);
    }
  };

  const handleAdminDeleteScore = async (scoreId: string) => {
    if (!confirm('Are you sure you want to permanently delete this score card?')) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await api.delete(`/admin/scores/${scoreId}`);
      setSuccess('Score card deleted successfully!');
      
      const updatedUsers = await api.get('/admin/users');
      setUsers(updatedUsers);
      const updatedUser = updatedUsers.find((u: any) => u.id === editingUser?.id);
      if (updatedUser) {
        setEditingUser(updatedUser);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete score card');
    }
  };

  const handleAdminUpdateScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScoreId) return;

    setSavingScore(true);
    setError(null);
    setSuccess(null);

    try {
      await api.put(`/admin/scores/${editingScoreId}`, {
        score: editingScoreVal,
        scoreDate: editingScoreDate,
      });

      setSuccess('Score card updated successfully!');
      setEditingScoreId(null);

      const updatedUsers = await api.get('/admin/users');
      setUsers(updatedUsers);
      const updatedUser = updatedUsers.find((u: any) => u.id === editingUser?.id);
      if (updatedUser) {
        setEditingUser(updatedUser);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update score card');
    } finally {
      setSavingScore(false);
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
      if (editingUser?.id === id) {
        setEditingUser(null);
      }
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
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="text-amber-500" size={20} />
            Registered Accounts
          </h2>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div key={n} className="glass h-20 rounded-xl border border-border"></div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 glass rounded-2xl border border-border text-muted-foreground text-sm">
              No registered user profiles found.
            </div>
          ) : (
            <div className="space-y-3 max-h-[80vh] overflow-y-auto pr-1">
              {users.map((item) => {
                const sub = item.subscriptions && item.subscriptions[0];
                const active = sub?.status === 'ACTIVE';

                return (
                  <div
                    key={item.id}
                    className={`glass-card p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 group ${
                      editingUser?.id === item.id
                        ? 'border-amber-500 bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.05)]'
                        : 'border-border'
                    }`}
                    onClick={() => handleEditClick(item)}
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
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          active
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {active ? 'Subscribed' : 'No Sub'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{item.email}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Donation: <span className="text-primary font-bold">{item.donationPercentage}%</span> | Charity: <span className="text-white">{item.selectedCharity?.name || 'Baseline Pool'}</span>
                      </p>
                    </div>

                    <div className="flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteUser(item.id);
                        }}
                        className="p-2 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                        title="Delete User"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Override Control Workspace */}
        <div className="lg:col-span-2 space-y-6">
          {editingUser ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Profile details & Sub override */}
              <div className="space-y-6">
                
                {/* Profile Details Card */}
                <div className="glass p-6 rounded-2xl border border-border">
                  <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                    <UserIcon className="text-amber-500" size={18} />
                    Profile & Role configuration
                  </h3>
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

                    <button
                      type="submit"
                      disabled={updating}
                      className="w-full py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-all flex items-center justify-center gap-2"
                    >
                      <Save size={14} />
                      {updating ? 'Saving...' : 'Save Profile Changes'}
                    </button>
                  </form>
                </div>

                {/* Subscription Override Card */}
                <div className="glass p-6 rounded-2xl border border-border">
                  <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                    <CreditCard className="text-amber-500" size={18} />
                    Subscription Override (PRD-11)
                  </h3>
                  <form onSubmit={handleOverrideSubscription} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Plan Tier</label>
                        <select
                          value={subPlan}
                          onChange={(e) => setSubPlan(e.target.value as any)}
                          className="w-full bg-[#111827]/60 border border-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
                        >
                          <option value="MONTHLY">MONTHLY (₹29/mo)</option>
                          <option value="YEARLY">YEARLY (₹290/yr)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Status</label>
                        <select
                          value={subStatus}
                          onChange={(e) => setSubStatus(e.target.value as any)}
                          className="w-full bg-[#111827]/60 border border-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="EXPIRED">EXPIRED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Amount (INR)</label>
                        <input
                          type="number"
                          required
                          value={subAmount}
                          onChange={(e) => setSubAmount(parseFloat(e.target.value))}
                          className="w-full bg-[#111827]/40 border border-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Expiry Date</label>
                        <input
                          type="date"
                          required
                          value={subEndDate}
                          onChange={(e) => setSubEndDate(e.target.value)}
                          className="w-full bg-[#111827]/40 border border-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={savingSub}
                      className="w-full py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-all flex items-center justify-center gap-2"
                    >
                      <Save size={14} />
                      {savingSub ? 'Overriding...' : 'Apply Subscription Override'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Golf Scores override */}
              <div className="space-y-6">
                
                {/* Score Manager Card */}
                <div className="glass p-6 rounded-2xl border border-border space-y-6">
                  <h3 className="text-md font-bold text-white flex items-center gap-2">
                    <Target className="text-amber-500" size={18} />
                    Golf Scores Overrides (PRD-11)
                  </h3>

                  {/* Add Score Form */}
                  <form onSubmit={handleAdminAddScore} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                    <p className="text-xs font-black uppercase text-amber-500 flex items-center gap-1">
                      <Plus size={12} /> Add new score card
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground uppercase">Stableford Score</label>
                        <input
                          type="number"
                          min="1"
                          max="45"
                          required
                          value={newScoreVal}
                          onChange={(e) => setNewScoreVal(parseInt(e.target.value))}
                          className="w-full bg-[#111827]/60 border border-border rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground uppercase">Play Date</label>
                        <input
                          type="date"
                          required
                          value={newScoreDate}
                          onChange={(e) => setNewScoreDate(e.target.value)}
                          className="w-full bg-[#111827]/60 border border-border rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={addingScore}
                      className="w-full py-2 rounded-lg bg-white/10 text-white font-bold text-[11px] hover:bg-white/20 transition-all"
                    >
                      {addingScore ? 'Adding...' : 'Add Score Card'}
                    </button>
                  </form>

                  {/* List of active scores */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase text-muted-foreground">Active score history (rolling latest 5)</p>
                    {(!editingUser.scores || editingUser.scores.length === 0) ? (
                      <div className="text-center py-6 text-xs text-muted-foreground italic">
                        No score cards logged in history.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {editingUser.scores.map((score) => {
                          const isEditing = editingScoreId === score.id;

                          return (
                            <div
                              key={score.id}
                              className="p-3 rounded-xl bg-slate-900/60 border border-border flex flex-col gap-2.5 justify-between"
                            >
                              {isEditing ? (
                                <form onSubmit={handleAdminUpdateScore} className="space-y-2 w-full">
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      type="number"
                                      min="1"
                                      max="45"
                                      value={editingScoreVal}
                                      onChange={(e) => setEditingScoreVal(parseInt(e.target.value))}
                                      className="bg-black/40 border border-border rounded px-2 py-1 text-xs text-white"
                                    />
                                    <input
                                      type="date"
                                      value={editingScoreDate}
                                      onChange={(e) => setEditingScoreDate(e.target.value)}
                                      className="bg-black/40 border border-border rounded px-2 py-1 text-xs text-white"
                                    />
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      type="button"
                                      onClick={() => setEditingScoreId(null)}
                                      className="p-1 rounded text-red-400 hover:bg-red-500/10"
                                      title="Cancel"
                                    >
                                      <X size={14} />
                                    </button>
                                    <button
                                      type="submit"
                                      disabled={savingScore}
                                      className="p-1 rounded text-primary hover:bg-primary/10"
                                      title="Save Score Card"
                                    >
                                      <Save size={14} />
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <div className="flex justify-between items-center w-full">
                                  <div>
                                    <span className="text-lg font-black text-white mr-2">{score.score}</span>
                                    <span className="text-xs text-muted-foreground font-semibold">
                                      {new Date(score.scoreDate).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                      })}
                                    </span>
                                  </div>
                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() => {
                                        setEditingScoreId(score.id);
                                        setEditingScoreVal(score.score);
                                        setEditingScoreDate(score.scoreDate.split('T')[0]);
                                      }}
                                      className="p-1.5 rounded bg-white/5 border border-white/5 text-slate-300 hover:text-white hover:bg-white/10"
                                      title="Edit Score Card"
                                    >
                                      <Edit2 size={12} />
                                    </button>
                                    <button
                                      onClick={() => handleAdminDeleteScore(score.id)}
                                      className="p-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                                      title="Delete Score Card"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-24 glass rounded-3xl border border-border text-muted-foreground flex flex-col items-center justify-center gap-3">
              <Shield className="text-amber-500/40" size={48} />
              <div>
                <p className="text-sm font-bold text-white">Select a Registered Account</p>
                <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed">
                  Select any profile from the left registry to toggle user roles, configure active donation percentage pools, override subscription statuses, and manage historical golf scorecard entries.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
