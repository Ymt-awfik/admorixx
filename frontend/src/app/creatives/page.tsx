'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';

export default function CreativesPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [creative, setCreative] = useState<any>(null);
  const [formData, setFormData] = useState({
    productName: '',
    productDescription: '',
    targetAudience: '',
    platform: 'TIKTOK',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);

    try {
      const response = await apiClient.generateCreative({
        ...formData,
        numberOfVariants: 7,
      });
      setCreative(response.data);
      toast.success('Creative generated successfully!');
    } catch (error) {
      toast.error('Failed to generate creative');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Creative Generator</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div>
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Product Details</h2>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="label">Product Name</label>
                  <input
                    type="text"
                    name="productName"
                    className="input"
                    placeholder="Smart Fitness Tracker"
                    value={formData.productName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="label">Product Description</label>
                  <textarea
                    name="productDescription"
                    className="input"
                    rows={4}
                    placeholder="AI-powered fitness tracking with personalized workout plans..."
                    value={formData.productDescription}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="label">Target Audience</label>
                  <input
                    type="text"
                    name="targetAudience"
                    className="input"
                    placeholder="Health-conscious millennials aged 25-40"
                    value={formData.targetAudience}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="label">Platform</label>
                  <select
                    name="platform"
                    className="input"
                    value={formData.platform}
                    onChange={handleChange}
                  >
                    <option value="TIKTOK">TikTok</option>
                    <option value="INSTAGRAM_REELS">Instagram Reels</option>
                    <option value="YOUTUBE_SHORTS">YouTube Shorts</option>
                    <option value="FACEBOOK_REELS">Facebook Reels</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={generating}
                >
                  {generating ? 'Generating...' : 'Generate Creative Ideas'}
                </button>
              </form>
            </div>
          </div>

          {/* Generated Creative */}
          <div>
            {creative ? (
              <div className="space-y-6">
                <div className="card">
                  <h2 className="text-xl font-semibold mb-2">{creative.title}</h2>
                  <p className="text-gray-600 mb-4">{creative.description}</p>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      Pattern: {creative.patternName}
                    </span>
                    <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
                      Viral Score: {creative.viralConfidenceScore}%
                    </span>
                  </div>
                </div>

                <div className="card">
                  <h3 className="font-semibold mb-3">Hook Variants</h3>
                  <div className="space-y-2">
                    {creative.hooks.map((hook: string, idx: number) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">
                          {idx + 1}. {hook}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h3 className="font-semibold mb-3">Storyboard</h3>
                  <div className="space-y-3">
                    {creative.storyboard.map((shot: any, idx: number) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <span className="text-lg font-bold text-primary-600">
                            {shot.shotNumber}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-500 mb-1">
                              {shot.timeRange}
                            </p>
                            <p className="text-sm text-gray-700 mb-2">
                              {shot.description}
                            </p>
                            <p className="text-xs text-gray-600">
                              <strong>Visual:</strong> {shot.visualNotes}
                            </p>
                            {shot.audioNotes && (
                              <p className="text-xs text-gray-600">
                                <strong>Audio:</strong> {shot.audioNotes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h3 className="font-semibold mb-2">Call-to-Action</h3>
                  <p className="text-gray-700">{creative.cta}</p>
                </div>

                <div className="card">
                  <h3 className="font-semibold mb-2">Why This Score?</h3>
                  <p className="text-sm text-gray-600">{creative.reasoningForScore}</p>
                </div>
              </div>
            ) : (
              <div className="card text-center py-12">
                <p className="text-gray-500">
                  Fill in the form and click generate to create viral video ad ideas
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
