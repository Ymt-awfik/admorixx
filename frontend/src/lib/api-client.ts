import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('accessToken');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await axios.post(`${API_URL}/auth/refresh`, {
                refreshToken,
              });

              const { accessToken } = response.data;
              localStorage.setItem('accessToken', accessToken);

              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async signup(data: { email: string; password: string; firstName?: string; lastName?: string }) {
    const response = await this.client.post('/auth/signup', data);
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    await this.client.post('/auth/logout', { refreshToken });
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Ad Accounts
  async getAdAccounts() {
    const response = await this.client.get('/ad-accounts');
    return response.data;
  }

  async deleteAdAccount(id: string) {
    const response = await this.client.delete(`/ad-accounts/${id}`);
    return response.data;
  }

  async connectGoogleAds(code: string, customerId: string) {
    const response = await this.client.post('/integrations/google-ads/callback', {
      code,
      customerId,
    });
    return response.data;
  }

  async getMetaAuthUrl() {
    const response = await this.client.get('/integrations/meta-ads/auth-url');
    return response.data;
  }

  async connectMetaAds(adAccountId: string, accessToken: string) {
    const response = await this.client.post('/integrations/meta-ads/connect', {
      adAccountId,
      accessToken,
    });
    return response.data;
  }

  // Google Ads
  async getGoogleAuthUrl(customerId?: string) {
    const params = customerId ? { customerId } : {};
    const response = await this.client.get('/integrations/google-ads/auth-url', { params });
    return response.data;
  }

  async manualConnectGoogle(accessToken: string, customerId: string, refreshToken?: string) {
    const response = await this.client.post('/integrations/google-ads/manual-connect', {
      accessToken,
      customerId,
      refreshToken,
    });
    return response.data;
  }

  // TikTok Ads
  async getTikTokAuthUrl() {
    const response = await this.client.get('/integrations/tiktok-ads/auth-url');
    return response.data;
  }

  async manualConnectTikTok(accessToken: string, advertiserId: string) {
    const response = await this.client.post('/integrations/tiktok-ads/manual-connect', {
      accessToken,
      advertiserId,
    });
    return response.data;
  }

  // Decisions
  async evaluateAllCampaigns() {
    const response = await this.client.post('/decisions/evaluate/all');
    return response.data;
  }

  async getRecentDecisions(limit?: number) {
    const response = await this.client.get('/decisions/recent', {
      params: { limit },
    });
    return response.data;
  }

  async getPendingDecisions() {
    const response = await this.client.get('/decisions/pending');
    return response.data;
  }

  // AI
  async getAIInsights(decisions: any[]) {
    const response = await this.client.post('/ai/insights-summary', { decisions });
    return response.data;
  }

  // Creatives
  async generateCreative(input: any) {
    const response = await this.client.post('/creatives/generate', input);
    return response.data;
  }

  async getCreatives(filters?: any) {
    const response = await this.client.get('/creatives', { params: filters });
    return response.data;
  }

  async getCreativePatterns() {
    const response = await this.client.get('/creatives/patterns');
    return response.data;
  }

  // Agent
  async getPendingProposals() {
    const response = await this.client.get('/agent/proposals');
    return response.data;
  }

  async approveProposal(actionId: string) {
    const response = await this.client.post(`/agent/proposals/${actionId}/approve`);
    return response.data;
  }

  async rejectProposal(actionId: string, reason?: string) {
    const response = await this.client.post(`/agent/proposals/${actionId}/reject`, {
      reason,
    });
    return response.data;
  }

  async getActionHistory(limit?: number) {
    const response = await this.client.get('/agent/history', {
      params: { limit },
    });
    return response.data;
  }

  // Generic request method
  async request<T = any>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client.request(config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
