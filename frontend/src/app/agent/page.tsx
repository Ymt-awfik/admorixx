'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

export default function AgentPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (isAuthenticated) {
      loadProposals();
    }
  }, [authLoading, isAuthenticated, router]);

  const loadProposals = async () => {
    try {
      const response = await apiClient.getPendingProposals();
      setProposals(response.data || []);
    } catch {
      toast.error('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (proposalId: string) => {
    try {
      setApproving(proposalId);
      await apiClient.approveProposal(proposalId);
      toast.success('Proposal approved and executed!');
      loadProposals();
    } catch {
      toast.error('Failed to approve proposal');
    } finally {
      setApproving(null);
    }
  };

  const handleRejectSubmit = async (proposalId: string) => {
    try {
      setRejecting(proposalId);
      await apiClient.rejectProposal(proposalId, rejectReason || undefined);
      toast.success('Proposal rejected');
      setRejectingId(null);
      setRejectReason('');
      loadProposals();
    } catch {
      toast.error('Failed to reject proposal');
    } finally {
      setRejecting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading proposals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Agent Proposals</h1>
          <p className="text-gray-500 mt-2">
            Review and approve AI-recommended actions for your campaigns
          </p>
        </div>

        {proposals.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl text-center py-16 px-8">
            <div className="text-5xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Proposals</h3>
            <p className="text-gray-500 text-sm">
              The AI agent is monitoring your campaigns. Proposals will appear here when optimization opportunities are detected.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {proposals.map((proposal: any) => (
              <div key={proposal.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {formatKey(proposal.actionType.replace(/_/g, ' '))}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">{proposal.adAccount?.accountName}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      proposal.riskLevel === 'low' ? 'bg-green-100 text-green-700' :
                      proposal.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {proposal.riskLevel?.toUpperCase()} RISK
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Reasoning */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">AI Reasoning</h4>
                    <p className="text-sm text-gray-600">{proposal.reasoning}</p>
                  </div>

                  {/* Proposed Changes */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Proposed Changes</h4>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                        {JSON.stringify(proposal.proposedChanges, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {/* Estimated Impact */}
                  {proposal.estimatedImpact && Object.keys(proposal.estimatedImpact).length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Estimated Impact</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(proposal.estimatedImpact).map(([key, value]) => (
                          <div key={key} className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-1">{formatKey(key)}</p>
                            <p className="text-base font-semibold text-gray-900">{String(value)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Safety Checks */}
                  {proposal.safetyChecks && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Safety Checks</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(proposal.safetyChecks).map(([key, value]) => (
                          <div key={key} className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                            value ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                          }`}>
                            <span className="font-bold">{value ? '✓' : '✗'}</span>
                            <span>{formatKey(key)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rejection form (inline) */}
                  {rejectingId === proposal.id && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <label className="block text-sm font-semibold text-red-800 mb-2">Reason for rejection (optional)</label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="e.g. Budget is too tight this week, campaign is already paused..."
                        rows={3}
                        className="w-full border border-red-200 rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleRejectSubmit(proposal.id)}
                          disabled={rejecting === proposal.id}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
                        >
                          {rejecting === proposal.id ? 'Rejecting...' : 'Confirm Rejection'}
                        </button>
                        <button
                          onClick={() => { setRejectingId(null); setRejectReason(''); }}
                          className="px-4 py-2 border border-gray-300 text-sm text-gray-600 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {rejectingId !== proposal.id && (
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => handleApprove(proposal.id)}
                        disabled={!!approving || !!rejecting}
                        className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {approving === proposal.id ? (
                          <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>Executing...</>
                        ) : '✓ Approve & Execute'}
                      </button>
                      <button
                        onClick={() => setRejectingId(proposal.id)}
                        disabled={!!approving || !!rejecting}
                        className="flex-1 border border-red-200 text-red-600 hover:bg-red-50 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  )}

                  <p className="text-xs text-gray-400">
                    Proposed {new Date(proposal.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
