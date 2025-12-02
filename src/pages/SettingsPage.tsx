/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Shield, Clock, Camera, Loader2, Mail, AlertTriangle, CheckCircle, BarChart3, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { logActivity, getActivityLogs } from '../lib/activityLogger';
import { cn } from '../lib/format';
import { UsagePanel } from '../components/UsagePanel';
import SavedGenerationsPanel from '../components/SettingsDrawer/SavedGenerationsPanel';

type Tab = 'profile' | 'account' | 'security' | 'activity' | 'usage' | 'history';

interface SettingsPageProps {
  onClose: () => void;
}

export default function SettingsPage({ onClose }: SettingsPageProps) {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Profile state
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Account state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  // Activity logs
  const [activities, setActivities] = useState<unknown[]>([]);

  useEffect(() => {
    setFullName(profile?.full_name || '');
    setBio(profile?.bio || '');
  }, [profile]);

  useEffect(() => {
    if (activeTab === 'activity') {
      loadActivityLogs();
    }
  }, [activeTab]);

  const loadActivityLogs = async () => {
    const logs = await getActivityLogs(20);
    setActivities(logs);
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5242880) {
        setError('Avatar must be less than 5MB');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      let avatarUrl = profile?.avatar_url;

      // Upload avatar if changed
      if (avatarFile && user) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(fileName);

        avatarUrl = publicUrl;
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          bio: bio,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user!.id);

      if (updateError) throw updateError;

      await logActivity({ action: 'profile_updated' });
      await refreshProfile();
      setSuccess('Profile updated successfully!');
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;

      await logActivity({ action: 'email_changed', details: { new_email: newEmail } });
      setSuccess('Verification email sent! Please check your inbox.');
      setNewEmail('');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change email';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      await logActivity({ action: 'password_changed' });
      setSuccess('Password changed successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountDelete = async () => {
    if (deleteConfirmation !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Log before deletion
      await logActivity({ action: 'account_deleted' });

      // Delete user account
      const { error } = await supabase.auth.admin.deleteUser(user!.id);
      if (error) throw error;

      await signOut();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete account';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleLinkOAuth = async (provider: 'google' | 'facebook' | 'apple') => {
    try {
      const { error } = await supabase.auth.linkIdentity({ provider });
      if (error) throw error;
      setSuccess(`${provider} account linked successfully!`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : `Failed to link ${provider} account`;
      setError(errorMessage);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: Mail },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'usage', label: 'Usage & Costs', icon: BarChart3 },
    { id: 'history', label: 'Generation History', icon: History },
    { id: 'activity', label: 'Activity', icon: Clock },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed left-0 right-0 bottom-0 bg-black/30 backdrop-blur-[1px] transition-opacity duration-200"
      style={{ 
        zIndex: 1000,
        top: 'var(--topbar-h, 64px)'
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        exit={{ opacity: 0, translateY: -20 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute left-1/2 top-8 -translate-x-1/2 w-full max-w-4xl rounded-3xl"
        style={{
          maxHeight: 'calc(100vh - var(--topbar-h, 64px) - 80px)',
          background: 'linear-gradient(180deg, rgba(10, 14, 20, 0.92), rgba(8, 12, 18, 0.92))',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 12px 50px rgba(0, 0, 0, 0.55), 0 1px 0 rgba(255, 255, 255, 0.04) inset',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-medium text-white/90">Settings</h2>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex" style={{ 
          maxHeight: 'calc(100vh - var(--topbar-h, 64px) - 160px)'
        }}>
          {/* Sidebar */}
          <div className="w-56 border-r border-white/10 p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      activeTab === tab.id
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                        : 'text-white/70 hover:bg-emerald-500/5 hover:text-white border border-transparent'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-5 pb-6 lg:p-6 lg:pb-7 custom-scrollbar">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <ProfileTab
                  key="profile"
                  fullName={fullName}
                  setFullName={setFullName}
                  bio={bio}
                  setBio={setBio}
                  avatarPreview={avatarPreview}
                  profile={profile}
                  handleAvatarSelect={handleAvatarSelect}
                  fileInputRef={fileInputRef}
                  handleProfileUpdate={handleProfileUpdate}
                  isLoading={isLoading}
                  error={error}
                  success={success}
                />
              )}

              {activeTab === 'account' && (
                <AccountTab
                  key="account"
                  user={user}
                  newEmail={newEmail}
                  setNewEmail={setNewEmail}
                  handleEmailChange={handleEmailChange}
                  handleLinkOAuth={handleLinkOAuth}
                  isLoading={isLoading}
                  error={error}
                  success={success}
                />
              )}

              {activeTab === 'security' && (
                <SecurityTab
                  key="security"
                  newPassword={newPassword}
                  setNewPassword={setNewPassword}
                  confirmPassword={confirmPassword}
                  setConfirmPassword={setConfirmPassword}
                  handlePasswordChange={handlePasswordChange}
                  deleteConfirmation={deleteConfirmation}
                  setDeleteConfirmation={setDeleteConfirmation}
                  handleAccountDelete={handleAccountDelete}
                  isLoading={isLoading}
                  error={error}
                  success={success}
                />
              )}

              {activeTab === 'usage' && (
                <motion.div
                  key="usage"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <UsagePanel />
                </motion.div>
              )}

              {activeTab === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <SavedGenerationsPanel />
                </motion.div>
              )}

              {activeTab === 'activity' && (
                <ActivityTab key="activity" activities={activities} />
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Profile Tab Component
function ProfileTab({
  fullName,
  setFullName,
  bio,
  setBio,
  avatarPreview,
  profile,
  handleAvatarSelect,
  fileInputRef,
  handleProfileUpdate,
  isLoading,
  error,
  success,
}: {
  fullName: string;
  setFullName: (val: string) => void;
  bio: string;
  setBio: (val: string) => void;
  avatarPreview: string | null;
  profile: { avatar_url?: string | null; full_name?: string | null } | null;
  handleAvatarSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleProfileUpdate: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string;
  success: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Profile Information</h3>

        {/* Avatar Upload */}
        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            {avatarPreview || profile?.avatar_url ? (
              <img
                src={avatarPreview || profile?.avatar_url || ''}
                alt="Avatar"
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gradient-to-b from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-2xl font-semibold">
                {fullName?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 rounded-full bg-gradient-to-r from-[#3EE594] to-[#1CC8A8] p-2 text-[#052c23] shadow-lg transition-transform hover:scale-105"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              className="hidden"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Profile Picture</p>
            <p className="text-xs text-white/60 mt-1">JPG, PNG or WebP. Max 5MB.</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Bio</label>
            <textarea
              value={bio || ''}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              placeholder="Tell us about yourself..."
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-400 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-gradient-to-r from-[#3EE594] to-[#1CC8A8] px-4 py-2.5 font-medium text-[#052c23] shadow-[0_16px_32px_rgba(34,197,94,0.35)] transition-transform hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
}

// Account Tab Component
function AccountTab({
  user,
  newEmail,
  setNewEmail,
  handleEmailChange,
  handleLinkOAuth,
  isLoading,
  error,
  success,
}: {
  user: { email?: string } | null;
  newEmail: string;
  setNewEmail: (val: string) => void;
  handleEmailChange: (e: React.FormEvent) => void;
  handleLinkOAuth: (provider: 'google' | 'facebook' | 'apple') => Promise<void>;
  isLoading: boolean;
  error: string;
  success: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Current Email */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Email Address</h3>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/60">Current email</p>
          <p className="text-white font-medium mt-1">{user?.email}</p>
        </div>
      </div>

      {/* Change Email */}
      <div>
        <h4 className="text-sm font-semibold text-white mb-3">Change Email</h4>
        <form onSubmit={handleEmailChange} className="space-y-4">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            placeholder="new@email.com"
          />
          <button
            type="submit"
            disabled={isLoading || !newEmail}
            className="w-full rounded-lg bg-gradient-to-r from-[#3EE594] to-[#1CC8A8] px-4 py-2.5 font-medium text-[#052c23] shadow-[0_16px_32px_rgba(34,197,94,0.35)] transition-transform hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {isLoading ? 'Sending...' : 'Change Email'}
          </button>
        </form>
      </div>

      {/* OAuth Accounts */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Connected Accounts</h3>
        <div className="space-y-3">
          {['google', 'facebook', 'apple'].map((provider) => (
            <div
              key={provider}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-lg capitalize">{provider[0]}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white capitalize">{provider}</p>
                  <p className="text-xs text-white/60">Not connected</p>
                </div>
              </div>
              <button
                onClick={() => handleLinkOAuth(provider as any)}
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
              >
                Connect
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-400 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {success}
        </div>
      )}
    </motion.div>
  );
}

// Security Tab Component
function SecurityTab({
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  handlePasswordChange,
  deleteConfirmation,
  setDeleteConfirmation,
  handleAccountDelete,
  isLoading,
  error,
  success,
}: {
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  handlePasswordChange: (e: React.FormEvent) => void;
  deleteConfirmation: string;
  setDeleteConfirmation: (val: string) => void;
  handleAccountDelete: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string;
  success: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      {/* Change Password */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            placeholder="New password"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            placeholder="Confirm new password"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-gradient-to-r from-[#3EE594] to-[#1CC8A8] px-4 py-2.5 font-medium text-[#052c23] shadow-[0_16px_32px_rgba(34,197,94,0.35)] transition-transform hover:-translate-y-[1px] disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Delete Account */}
      <div>
        <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">Delete Account</p>
              <p className="text-xs text-white/60 mt-1">
                This action is permanent and cannot be undone. All your data will be deleted.
              </p>
            </div>
          </div>
          <input
            type="text"
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            className="w-full rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-red-500/50 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            placeholder='Type "DELETE" to confirm'
          />
          <button
            onClick={handleAccountDelete}
            disabled={isLoading || deleteConfirmation !== 'DELETE'}
            className="w-full rounded-lg bg-red-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Deleting...' : 'Delete Account'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-400 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {success}
        </div>
      )}
    </motion.div>
  );
}

// Activity Tab Component
function ActivityTab({ activities }: { activities: unknown[] }) {
  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      user_signed_in: 'Signed in',
      user_signed_up: 'Account created',
      user_signed_out: 'Signed out',
      password_reset_requested: 'Password reset requested',
      password_changed: 'Password changed',
      email_changed: 'Email changed',
      profile_updated: 'Profile updated',
      avatar_uploaded: 'Avatar uploaded',
      account_deleted: 'Account deleted',
      session_revoked: 'Session revoked',
    };
    return labels[action] || action;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {activities.length === 0 ? (
          <p className="text-center text-white/60 py-8">No activity logs yet</p>
        ) : (
          activities.map((activity: unknown) => {
            const act = activity as { id: string; action: string; timestamp: string; created_at: string; details?: string };
            return (
            <div
              key={act.id}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4"
            >
              <div>
                <p className="text-sm font-medium text-white">
                  {getActionLabel(act.action)}
                </p>
                <p className="text-xs text-white/60 mt-1">
                  {new Date(act.created_at).toLocaleString()}
                </p>
              </div>
              <Clock className="h-4 w-4 text-white/40" />
            </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
