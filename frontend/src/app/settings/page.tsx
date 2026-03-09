'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';

export default function SettingsPage() {
  const { user, isAuthenticated, loading: authLoading, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [adAccounts, setAdAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile editing
  const [profileData, setProfileData] = useState({ firstName: '', lastName: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change
  const [passwords, setPasswords] = useState({ current: '', newPw: '', confirm: '' });
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (isAuthenticated) {
      loadAdAccounts();
      setProfileData({ firstName: user?.firstName || '', lastName: user?.lastName || '' });
    }
  }, [authLoading, isAuthenticated, router, user]);

  const loadAdAccounts = async () => {
    try {
      const response = await apiClient.getAdAccounts();
      setAdAccounts(response.data || []);
    } catch {
      toast.error('Failed to load ad accounts');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!profileData.firstName.trim()) { toast.error('First name is required'); return; }
    try {
      setSavingProfile(true);
      await apiClient.request({
        method: 'PUT',
        url: '/users/profile',
        data: { firstName: profileData.firstName.trim(), lastName: profileData.lastName.trim() },
      });
      await refreshUser();
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (!passwords.current) { toast.error('Current password is required'); return; }
    if (passwords.newPw.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (!/[A-Z]/.test(passwords.newPw)) { toast.error('New password must include an uppercase letter'); return; }
    if (!/[0-9]/.test(passwords.newPw)) { toast.error('New password must include a number'); return; }
    if (passwords.newPw !== passwords.confirm) { toast.error('Passwords do not match'); return; }
    try {
      setSavingPassword(true);
      await apiClient.request({
        method: 'PUT',
        url: '/users/profile',
        data: { currentPassword: passwords.current, newPassword: passwords.newPw },
      });
      toast.success('Password changed successfully!');
      setPasswords({ current: '', newPw: '', confirm: '' });
      setShowPasswordForm(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password. Check your current password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-3xl mx-auto p-8 space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>

        {/* ===== User Profile ===== */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input bg-gray-50 cursor-not-allowed" value={user?.email || ''} disabled />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First Name</label>
                <input
                  type="text"
                  className="input"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input
                  type="text"
                  className="input"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  placeholder="Last name"
                />
              </div>
            </div>
            <button onClick={saveProfile} disabled={savingProfile} className="btn btn-primary px-6">
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>

          {/* Password Change */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Password</h3>
                <p className="text-xs text-gray-400">Change your account password</p>
              </div>
              <button onClick={() => setShowPasswordForm(!showPasswordForm)} className="text-sm text-primary-600 hover:underline font-medium">
                {showPasswordForm ? 'Cancel' : 'Change Password'}
              </button>
            </div>

            {showPasswordForm && (
              <div className="space-y-3 mt-4 bg-gray-50 p-4 rounded-xl">
                <div>
                  <label className="label text-sm">Current Password</label>
                  <input type="password" className="input" placeholder="••••••••" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} />
                </div>
                <div>
                  <label className="label text-sm">New Password</label>
                  <input type="password" className="input" placeholder="••••••••" value={passwords.newPw} onChange={(e) => setPasswords({ ...passwords, newPw: e.target.value })} />
                  <p className="text-xs text-gray-400 mt-1">Min 8 chars, uppercase, lowercase, number</p>
                </div>
                <div>
                  <label className="label text-sm">Confirm New Password</label>
                  <input type="password" className="input" placeholder="••••••••" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
                  {passwords.confirm && passwords.newPw !== passwords.confirm && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
                </div>
                <button onClick={savePassword} disabled={savingPassword} className="btn btn-primary px-6">
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ===== Connected Ad Accounts ===== */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-gray-900">Connected Ad Accounts</h2>
            <a href="/connect-ad-accounts" className="text-sm text-primary-600 hover:underline font-medium">
              + Add Account
            </a>
          </div>

          {adAccounts.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <p className="text-gray-500 text-sm mb-3">No ad accounts connected yet</p>
              <a href="/connect-ad-accounts" className="btn btn-primary text-sm px-6">Connect Your First Account</a>
            </div>
          ) : (
            <div className="space-y-3">
              {adAccounts.map((account: any) => (
                <div key={account.id} className="p-4 border border-gray-200 rounded-xl flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      account.platform === 'FACEBOOK_ADS' ? 'bg-blue-100' :
                      account.platform === 'GOOGLE_ADS' ? 'bg-red-100' : 'bg-gray-900'
                    }`}>
                      {account.platform === 'FACEBOOK_ADS' && <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>}
                      {account.platform === 'GOOGLE_ADS' && <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>}
                      {account.platform === 'TIKTOK_ADS' && <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{account.accountName}</p>
                      <p className="text-xs text-gray-400">{account.platform.replace('_', ' ')} · {account.platformAccountId}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Connected</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== Account Actions ===== */}
        <div className="bg-white border border-red-100 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-red-700 mb-4">Account</h2>
          <button onClick={handleLogout} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors">
            Log Out
          </button>
        </div>
      </main>
    </div>
  );
}
