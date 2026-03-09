'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';

export default function DashboardPage() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [decisions, setDecisions] = useState([]);
  const [adAccounts, setAdAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (isAuthenticated && user && !user.hasConnectedAdAccount) {
      // Redirect to connect accounts if user hasn't connected any
      router.push('/connect-ad-accounts');
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.hasConnectedAdAccount) {
      loadDashboardData();
    }
  }, [isAuthenticated, user]);

  const loadDashboardData = async () => {
    try {
      const [decisionsRes, accountsRes] = await Promise.all([
        apiClient.getRecentDecisions(10),
        apiClient.getAdAccounts(),
      ]);
      setDecisions(decisionsRes.data || []);
      setAdAccounts(accountsRes.data || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      toast.info('Running decision engine...');
      await apiClient.evaluateAllCampaigns();
      toast.success('Analysis complete!');
      loadDashboardData();
    } catch (error) {
      toast.error('Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const syncAccount = async (accountId: string) => {
    setSyncingAccountId(accountId);
    try {
      toast.info('Syncing campaigns from Meta Ads...');
      const response = await apiClient.request({
        method: 'POST',
        url: '/integrations/meta-ads/sync-campaigns',
        data: { adAccountId: accountId },
      });
      toast.success(`Successfully synced ${response.campaignCount || 0} campaigns!`);
      await loadDashboardData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to sync campaigns');
    } finally {
      setSyncingAccountId(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h3 className="text-gray-500 text-sm font-medium mb-1">Ad Accounts</h3>
            <p className="text-3xl font-bold text-gray-900">{adAccounts.length}</p>
          </div>
          <div className="card">
            <h3 className="text-gray-500 text-sm font-medium mb-1">Recent Decisions</h3>
            <p className="text-3xl font-bold text-gray-900">{decisions.length}</p>
          </div>
          <div className="card">
            <h3 className="text-gray-500 text-sm font-medium mb-1">Pending Actions</h3>
            <p className="text-3xl font-bold text-gray-900">
              {decisions.filter((d: any) => d.status === 'PENDING').length}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={runAnalysis}
              disabled={analyzing || adAccounts.length === 0}
              className="btn btn-primary"
            >
              {analyzing ? 'Analyzing...' : 'Run Campaign Analysis'}
            </button>
            <a href="/creatives" className="btn btn-secondary text-center">
              Generate Creative Ideas
            </a>
            <a href="/agent" className="btn btn-secondary text-center">
              Review Agent Proposals
            </a>
          </div>
        </div>

        {/* Connected Ad Accounts */}
        {adAccounts.length === 0 ? (
          <div className="card text-center py-12 mb-8">
            <h3 className="text-xl font-semibold mb-2">No Ad Accounts Connected</h3>
            <p className="text-gray-600 mb-6">
              Connect your Google Ads account to start analyzing campaigns
            </p>
            <a href="/settings" className="btn btn-primary">
              Connect Ad Account
            </a>
          </div>
        ) : (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Connected Accounts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adAccounts.map((account: any) => (
                <div key={account.id} className="card">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{account.accountName}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {account.platform} • {account._count?.campaigns || 0} campaigns
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      account.isConnected
                        ? 'bg-success-50 text-success-700'
                        : 'bg-danger-50 text-danger-700'
                    }`}>
                      {account.isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  {account.isConnected && account.platform === 'FACEBOOK_ADS' && (
                    <button
                      onClick={() => syncAccount(account.id)}
                      disabled={syncingAccountId === account.id}
                      className="btn btn-secondary w-full text-sm py-2"
                    >
                      {syncingAccountId === account.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Syncing...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Sync Campaigns
                        </span>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Decisions */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Decisions</h2>

          {decisions.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500 mb-4">No decisions yet</p>
              <p className="text-sm text-gray-400">
                Run analysis to get AI-powered campaign insights
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {decisions.map((decision: any) => (
                <div key={decision.id} className="card hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {decision.campaign?.name || 'Campaign'}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          decision.decisionType === 'PAUSE_CAMPAIGN'
                            ? 'bg-danger-50 text-danger-700'
                            : decision.decisionType === 'INCREASE_BUDGET'
                            ? 'bg-success-50 text-success-700'
                            : 'bg-warning-50 text-warning-700'
                        }`}>
                          {decision.decisionType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {decision.reasoning}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Rule: {decision.ruleName}</span>
                        <span>•</span>
                        <span>Confidence: {decision.confidenceScore}%</span>
                        <span>•</span>
                        <span>{new Date(decision.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      decision.status === 'PENDING'
                        ? 'bg-warning-50 text-warning-700'
                        : decision.status === 'APPROVED'
                        ? 'bg-success-50 text-success-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {decision.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
