'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';

interface AdAccount {
  id: string;
  platform: string;
  accountName: string;
  platformAccountId: string;
  isConnected: boolean;
  _count?: { campaigns: number };
}

export default function ConnectAdAccountsPage() {
  const { user, isAuthenticated, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [showManual, setShowManual] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState<string | null>(null);

  // OAuth: optional Customer ID for Google
  const [googleCustomerId, setGoogleCustomerId] = useState('');

  // Manual connect form states
  const [metaToken, setMetaToken] = useState('');
  const [googleToken, setGoogleToken] = useState('');
  const [googleManualId, setGoogleManualId] = useState('');
  const [tiktokToken, setTiktokToken] = useState('');
  const [tiktokAdvertiserId, setTiktokAdvertiserId] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (isAuthenticated) {
      loadAdAccounts();
      handleOAuthCallback();
    }
  }, [authLoading, isAuthenticated]);

  const handleOAuthCallback = async () => {
    const message = searchParams.get('message');

    if (searchParams.get('meta_success')) {
      toast.success(message || 'Meta Ads account connected!');
      router.replace('/connect-ad-accounts');
      await loadAdAccounts();
      await refreshUser();
    } else if (searchParams.get('meta_error')) {
      toast.error(searchParams.get('meta_error')!);
      router.replace('/connect-ad-accounts');
    }

    if (searchParams.get('google_success')) {
      toast.success(message || 'Google Ads account connected!');
      router.replace('/connect-ad-accounts');
      await loadAdAccounts();
      await refreshUser();
    } else if (searchParams.get('google_error')) {
      toast.error(searchParams.get('google_error')!);
      router.replace('/connect-ad-accounts');
    }

    if (searchParams.get('tiktok_success')) {
      toast.success(message || 'TikTok Ads account connected!');
      router.replace('/connect-ad-accounts');
      await loadAdAccounts();
      await refreshUser();
    } else if (searchParams.get('tiktok_error')) {
      toast.error(searchParams.get('tiktok_error')!);
      router.replace('/connect-ad-accounts');
    }
  };

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

  // ===== ONE-CLICK OAUTH =====
  const startOAuth = async (platform: 'META' | 'GOOGLE' | 'TIKTOK') => {
    try {
      setConnecting(platform);
      let authUrl: string;

      if (platform === 'META') {
        const res = await apiClient.getMetaAuthUrl();
        authUrl = res.authUrl;
      } else if (platform === 'GOOGLE') {
        const cid = googleCustomerId.trim().replace(/-/g, '') || undefined;
        const res = await apiClient.getGoogleAuthUrl(cid);
        authUrl = res.authUrl;
      } else {
        const res = await apiClient.getTikTokAuthUrl();
        authUrl = res.authUrl;
      }

      window.location.href = authUrl;
    } catch (error: any) {
      const msg = error.response?.data?.message || `Could not start ${platform} connection. Try manual connect below.`;
      toast.error(msg);
      setConnecting(null);
      setShowManual(platform);
    }
  };

  // ===== MANUAL CONNECT (fallback) =====
  const manualConnectMeta = async () => {
    if (!metaToken.trim()) { toast.error('Please paste your Meta Access Token'); return; }
    try {
      setConnecting('META_M');
      await apiClient.request({ method: 'POST', url: '/integrations/meta-ads/manual-connect', data: { accessToken: metaToken.trim() } });
      toast.success('Meta Ads account connected!');
      setMetaToken(''); setShowManual(null);
      await loadAdAccounts(); await refreshUser();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to connect Meta account');
    } finally { setConnecting(null); }
  };

  const manualConnectGoogle = async () => {
    if (!googleToken.trim() || !googleManualId.trim()) { toast.error('Please fill in Customer ID and Access Token'); return; }
    try {
      setConnecting('GOOGLE_M');
      await apiClient.manualConnectGoogle(googleToken.trim(), googleManualId.trim().replace(/-/g, ''));
      toast.success('Google Ads account connected!');
      setGoogleToken(''); setGoogleManualId(''); setShowManual(null);
      await loadAdAccounts(); await refreshUser();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to connect Google Ads');
    } finally { setConnecting(null); }
  };

  const manualConnectTikTok = async () => {
    if (!tiktokToken.trim() || !tiktokAdvertiserId.trim()) { toast.error('Please fill in Advertiser ID and Access Token'); return; }
    try {
      setConnecting('TIKTOK_M');
      await apiClient.manualConnectTikTok(tiktokToken.trim(), tiktokAdvertiserId.trim());
      toast.success('TikTok Ads account connected!');
      setTiktokToken(''); setTiktokAdvertiserId(''); setShowManual(null);
      await loadAdAccounts(); await refreshUser();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to connect TikTok Ads');
    } finally { setConnecting(null); }
  };

  const disconnectAccount = async (accountId: string) => {
    try {
      setDisconnecting(accountId);
      await apiClient.deleteAdAccount(accountId);
      toast.success('Account disconnected');
      setConfirmDisconnect(null);
      await loadAdAccounts(); await refreshUser();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to disconnect account');
    } finally { setDisconnecting(null); }
  };

  const proceedToDashboard = async () => {
    if (adAccounts.length === 0) { toast.error('Please connect at least one ad account to continue'); return; }
    await refreshUser();
    router.push('/dashboard');
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const hasAccounts = adAccounts.length > 0;
  const isMetaConnected = adAccounts.some(a => a.platform === 'FACEBOOK_ADS');
  const isGoogleConnected = adAccounts.some(a => a.platform === 'GOOGLE_ADS');
  const isTikTokConnected = adAccounts.some(a => a.platform === 'TIKTOK_ADS');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-3xl mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            {hasAccounts ? 'Your Ad Accounts' : 'Connect Your Ad Accounts'}
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            {hasAccounts
              ? 'Manage your connected platforms or add more.'
              : 'Connect your ad platforms in one click to get started with AI-powered optimization.'}
          </p>
        </div>

        {/* Connected Accounts */}
        {hasAccounts && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Connected</h2>
            {adAccounts.map((account) => (
              <div key={account.id} className="bg-white border border-green-200 rounded-xl p-4 mb-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      account.platform === 'FACEBOOK_ADS' ? 'bg-blue-100' :
                      account.platform === 'GOOGLE_ADS' ? 'bg-red-100' : 'bg-gray-900'
                    }`}>
                      {account.platform === 'FACEBOOK_ADS' && <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>}
                      {account.platform === 'GOOGLE_ADS' && <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>}
                      {account.platform === 'TIKTOK_ADS' && <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{account.accountName}</p>
                      <p className="text-xs text-gray-400">{account.platformAccountId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Connected</span>
                    <button
                      onClick={() => setConfirmDisconnect(confirmDisconnect === account.id ? null : account.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1"
                      title="Disconnect account"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                {confirmDisconnect === account.id && (
                  <div className="mt-3 pt-3 border-t border-red-100 flex items-center justify-between bg-red-50 -mx-4 -mb-4 px-4 py-3 rounded-b-xl">
                    <p className="text-sm text-red-700 font-medium">Disconnect this account?</p>
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmDisconnect(null)} className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-lg bg-white hover:bg-gray-50">Cancel</button>
                      <button onClick={() => disconnectAccount(account.id)} disabled={disconnecting === account.id} className="px-3 py-1 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50">
                        {disconnecting === account.id ? 'Removing...' : 'Yes, Disconnect'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div className="text-center mt-6">
              <button onClick={proceedToDashboard} className="btn btn-primary px-10 py-3 text-base font-semibold shadow-md">
                Continue to Dashboard →
              </button>
            </div>
          </div>
        )}

        {/* Platform Cards */}
        <div className="space-y-4">
          {hasAccounts && <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Add Another Platform</h2>}

          {/* ====== META ====== */}
          {!isMetaConnected && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Meta Ads</h2>
                    <p className="text-sm text-gray-500">Facebook & Instagram advertising</p>
                  </div>
                </div>

                <button
                  onClick={() => startOAuth('META')}
                  disabled={!!connecting}
                  className="w-full bg-[#0668E1] hover:bg-[#0557C2] text-white py-3 rounded-xl font-semibold text-base transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
                >
                  {connecting === 'META' ? (
                    <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>Redirecting to Meta...</>
                  ) : (
                    <><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>Connect with Meta</>
                  )}
                </button>

                <button onClick={() => setShowManual(showManual === 'META' ? null : 'META')} className="text-xs text-gray-400 hover:text-gray-600 transition-colors w-full text-center">
                  Can&apos;t use the button? Connect with token {showManual === 'META' ? '▲' : '▼'}
                </button>

                {showManual === 'META' && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meta Access Token</label>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Paste token (starts with EAA...)" value={metaToken} onChange={(e) => setMetaToken(e.target.value)} className="input flex-1 text-sm" />
                      <button onClick={manualConnectMeta} disabled={connecting === 'META_M' || !metaToken.trim()} className="btn btn-primary bg-[#0668E1] hover:bg-[#0557C2] px-4 text-sm">
                        {connecting === 'META_M' ? '...' : 'Connect'}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-400">
                      Get token: <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Meta Graph API Explorer</a> → Generate Token → select ads_management, ads_read
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ====== GOOGLE ====== */}
          {!isGoogleConnected && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Google Ads</h2>
                    <p className="text-sm text-gray-500">Search, Display & YouTube campaigns</p>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Customer ID <span className="text-gray-400 font-normal">(optional — speeds up connection)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 123-456-7890  (top-right of ads.google.com)"
                    value={googleCustomerId}
                    onChange={(e) => setGoogleCustomerId(e.target.value)}
                    className="input w-full text-sm"
                  />
                </div>

                <button
                  onClick={() => startOAuth('GOOGLE')}
                  disabled={!!connecting}
                  className="w-full bg-[#4285F4] hover:bg-[#3367D6] text-white py-3 rounded-xl font-semibold text-base transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
                >
                  {connecting === 'GOOGLE' ? (
                    <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>Redirecting to Google...</>
                  ) : (
                    <><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>Connect with Google</>
                  )}
                </button>

                <button onClick={() => setShowManual(showManual === 'GOOGLE' ? null : 'GOOGLE')} className="text-xs text-gray-400 hover:text-gray-600 transition-colors w-full text-center">
                  Can&apos;t use the button? Connect with token {showManual === 'GOOGLE' ? '▲' : '▼'}
                </button>

                {showManual === 'GOOGLE' && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer ID</label>
                      <input type="text" placeholder="123-456-7890" value={googleManualId} onChange={(e) => setGoogleManualId(e.target.value)} className="input w-full text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
                      <div className="flex gap-2">
                        <input type="text" placeholder="Paste OAuth access token" value={googleToken} onChange={(e) => setGoogleToken(e.target.value)} className="input flex-1 text-sm" />
                        <button onClick={manualConnectGoogle} disabled={connecting === 'GOOGLE_M' || !googleToken.trim() || !googleManualId.trim()} className="btn btn-primary bg-[#4285F4] hover:bg-[#3367D6] px-4 text-sm">
                          {connecting === 'GOOGLE_M' ? '...' : 'Connect'}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      Get token: <a href="https://developers.google.com/oauthplayground/" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Google OAuth Playground</a> → select Google Ads API scope → authorize → exchange for token
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ====== TIKTOK ====== */}
          {!isTikTokConnected && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">TikTok Ads</h2>
                    <p className="text-sm text-gray-500">Video advertising & performance campaigns</p>
                  </div>
                </div>

                <button
                  onClick={() => startOAuth('TIKTOK')}
                  disabled={!!connecting}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl font-semibold text-base transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
                >
                  {connecting === 'TIKTOK' ? (
                    <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>Redirecting to TikTok...</>
                  ) : (
                    <><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>Connect with TikTok</>
                  )}
                </button>

                <button onClick={() => setShowManual(showManual === 'TIKTOK' ? null : 'TIKTOK')} className="text-xs text-gray-400 hover:text-gray-600 transition-colors w-full text-center">
                  Can&apos;t use the button? Connect with token {showManual === 'TIKTOK' ? '▲' : '▼'}
                </button>

                {showManual === 'TIKTOK' && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Advertiser ID</label>
                      <input type="text" placeholder="e.g. 7012345678901234567" value={tiktokAdvertiserId} onChange={(e) => setTiktokAdvertiserId(e.target.value)} className="input w-full text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
                      <div className="flex gap-2">
                        <input type="text" placeholder="Paste access token" value={tiktokToken} onChange={(e) => setTiktokToken(e.target.value)} className="input flex-1 text-sm" />
                        <button onClick={manualConnectTikTok} disabled={connecting === 'TIKTOK_M' || !tiktokToken.trim() || !tiktokAdvertiserId.trim()} className="btn btn-primary bg-gray-900 hover:bg-gray-800 px-4 text-sm">
                          {connecting === 'TIKTOK_M' ? '...' : 'Connect'}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      Get credentials: <a href="https://ads.tiktok.com/marketing_api/homepage" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">TikTok Marketing API</a> → My Apps → generate access token
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* All platforms connected */}
          {isMetaConnected && isGoogleConnected && isTikTokConnected && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="font-bold text-green-900 text-lg">All platforms connected!</h3>
              <p className="text-green-700 text-sm mt-1">Your AI agent is ready to optimize all your campaigns.</p>
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        {hasAccounts && (
          <div className="text-center mt-8">
            <button onClick={proceedToDashboard} className="btn btn-primary px-10 py-3 text-base font-semibold shadow-md">
              Continue to Dashboard →
            </button>
          </div>
        )}

        {!hasAccounts && (
          <p className="text-center mt-8 text-xs text-gray-400">
            Need help? Contact <span className="text-primary-600">support@admorix.com</span>
          </p>
        )}
      </main>
    </div>
  );
}
