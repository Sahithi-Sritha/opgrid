// API Client for OpGrid Agent Backend
// Replaces Supabase client with direct HTTP calls to Express backend

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;
export const API_BASE_URL =
  configuredApiUrl === '__SAME_ORIGIN__' ? '' : configuredApiUrl || '';

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

export type Opportunity = {
  id: string;
  title: string;
  company: string;
  source: string;
  url: string;
  description: string | null;
  tags: string[];
  deadline: string | null;
  stipend: string | null;
  location: string;
  is_remote: boolean;
  category?: string;
  prize_pool?: string | null;
  team_size?: string | null;
  ppo_possible?: boolean;
  registration_open?: boolean;
  event_date?: string | null;
  raw_html?: string | null;
  created_at: string;
  seen_at: string | null;
  last_notified_at?: string | null;
};

export type Application = {
  id: string;
  opportunity_id: string;
  applied_date: string;
  status: string;
  resume_version: string | null;
  referral_name: string | null;
  follow_up_sent: boolean;
  follow_up_date: string | null;
  notes: string | null;
  created_at: string;
  opportunity?: Opportunity;
  opportunities?: Opportunity;
  deadlines?: ApplicationDeadline[];
};

export type ApplicationDeadline = {
  id: string;
  label: string;
  due_date: string;
  completed: boolean;
};

export type DashboardDeadline = ApplicationDeadline & {
  id: string;
  deadline_id: string | null;
  application_id: string | null;
  opportunity_id: string;
  title: string;
  company: string;
  status: string;
  deadline: string;
  days_remaining: number;
  urgency_level: 'urgent' | 'warning' | 'normal';
  already_applied: boolean;
  can_complete: boolean;
  url: string | null;
};

export type DashboardData = {
  stats: {
    total_opportunities: number;
    applications_this_week: number;
    deadlines_next_7_days: number;
    active_pipeline: number;
    tracked_applications: number;
  };
  deadlines: DashboardDeadline[];
  activities: Notification[];
  sparkline: Array<{ date: string; count: number }>;
};

export type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  related_id: string | null;
  read_at: string | null;
  created_at: string;
};

export type AgentHealth = {
  status: 'ok';
  uptime: number;
  scheduler: {
    enabled: boolean;
    timezone: string;
    runningJobs: string[];
  };
  timestamp: string;
};

class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T | null; error: Error | null }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (response.status === 204) {
        return { data: null, error: null };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error('API request error:', error);
      return { data: null, error: error as Error };
    }
  }

  // Opportunities
  async getOpportunities(params?: {
    limit?: number;
    offset?: number;
    filter?: string;
    tags?: string[];
  }) {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    if (params?.filter) query.append('filter', params.filter);
    if (params?.tags) query.append('tags', params.tags.join(','));

    return this.request<Opportunity[]>(`/api/opportunities?${query}`);
  }

  async getOpportunityById(id: string) {
    return this.request<Opportunity>(`/api/opportunities/${id}`);
  }

  async updateOpportunity(id: string, updates: Partial<Opportunity>) {
    return this.request<Opportunity>(`/api/opportunities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async searchOpportunities(query: string) {
    return this.request<Opportunity[]>(`/api/opportunities/search?q=${encodeURIComponent(query)}`);
  }

  async getSimilarOpportunities(id: string) {
    return this.request<Opportunity[]>(`/api/opportunities/${id}/similar`);
  }

  async markOpportunitySeen(id: string) {
    return this.updateOpportunity(id, { seen_at: new Date().toISOString() });
  }

  // Applications
  async getApplications() {
    return this.request<Application[]>('/api/applications');
  }

  async createApplication(application: Partial<Application>) {
    return this.request<Application>('/api/applications', {
      method: 'POST',
      body: JSON.stringify(application),
    });
  }

  async markApplied(opportunityId: string) {
    return this.request<Application & { alreadyTracked?: boolean }>('/api/applications', {
      method: 'POST',
      body: JSON.stringify({ opportunity_id: opportunityId }),
    });
  }

  async updateApplication(id: string, updates: Partial<Application>) {
    return this.request<Application>(`/api/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteApplication(id: string) {
    return this.request<void>(`/api/applications/${id}`, {
      method: 'DELETE',
    });
  }

  async addApplicationDeadline(id: string, deadline: { label: string; due_date: string }) {
    return this.request<Application>(`/api/applications/${id}/deadlines`, {
      method: 'POST',
      body: JSON.stringify(deadline),
    });
  }

  async updateApplicationDeadline(
    id: string,
    deadlineId: string,
    updates: Partial<Pick<ApplicationDeadline, 'label' | 'due_date' | 'completed'>>,
  ) {
    return this.request<Application>(`/api/applications/${id}/deadlines/${deadlineId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteApplicationDeadline(id: string, deadlineId: string) {
    return this.request<Application>(`/api/applications/${id}/deadlines/${deadlineId}`, {
      method: 'DELETE',
    });
  }

  async parseTimelines(text: string) {
    return this.request<{
      message: string;
      parsed: Application[];
      extraction: 'ai' | 'fallback';
      skipped: number;
    }>('/api/tracker/parse', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async addTrackedItem(application: {
    company: string;
    title: string;
    category?: 'internship' | 'hackathon' | 'fellowship' | 'competition' | 'research' | null;
    status: string;
    applied_date?: string | null;
    deadline?: string | null;
    url?: string | null;
    notes?: string | null;
  }) {
    return this.request<Application>('/api/tracker/manual', {
      method: 'POST',
      body: JSON.stringify(application),
    });
  }

  // Notifications
  async getNotifications(unreadOnly: boolean = false) {
    const query = unreadOnly ? '?unread=true' : '';
    return this.request<Notification[]>(`/api/notifications${query}`);
  }

  async markNotificationRead(id: string) {
    return this.request<Notification>(`/api/notifications/${id}/read`, {
      method: 'POST',
    });
  }

  async markAllNotificationsRead() {
    return this.request<void>('/api/notifications/read-all', {
      method: 'POST',
    });
  }

  // Dashboard
  async getDashboard() {
    return this.request<DashboardData>('/api/dashboard');
  }

  // Saved Opportunities
  async saveOpportunity(opportunityId: string) {
    return this.request<{ saved: boolean }>(`/api/opportunities/${opportunityId}/save`, {
      method: 'POST',
    });
  }

  async setOpportunityReminder(opportunityId: string, daysBefore: number) {
    return this.request<{ saved: boolean; reminder_date: string }>(
      `/api/opportunities/${opportunityId}/reminder`,
      {
        method: 'POST',
        body: JSON.stringify({ days_before: daysBefore }),
      }
    );
  }

  async unsaveOpportunity(opportunityId: string) {
    return this.request<void>(`/api/opportunities/${opportunityId}/save`, {
      method: 'DELETE',
    });
  }

  async triggerScrape() {
    const [internships, hackathons, workflow] = await Promise.allSettled([
      this.request<{ message: string }>('/trigger-scrape', { method: 'POST' }),
      this.request<{ message: string }>('/trigger-hackathons', { method: 'POST' }),
      this.request<{ dispatched: boolean; message: string }>('/api/workflow/dispatch', {
        method: 'POST',
        body: JSON.stringify({ task: 'scrape' }),
      }),
    ]);

    const internshipResult =
      internships.status === 'fulfilled' ? internships.value : { data: null, error: new Error('Internship scrape failed') };
    const hackathonResult =
      hackathons.status === 'fulfilled' ? hackathons.value : { data: null, error: new Error('Hackathon scrape failed') };
    const workflowResult =
      workflow.status === 'fulfilled' ? workflow.value : { data: null, error: new Error('Workflow dispatch failed') };

    // Direct scrape errors are critical; workflow dispatch failure is non-blocking
    const directError = internshipResult.error || hackathonResult.error;

    const parts: string[] = [];
    if (internshipResult.data?.message) parts.push(internshipResult.data.message);
    if (hackathonResult.data?.message) parts.push(hackathonResult.data.message);
    if (workflowResult.data?.message) parts.push(workflowResult.data.message);
    if (workflowResult.error) parts.push('GitHub workflow not configured (optional)');

    return {
      data: directError ? null : { message: parts.join('. ') },
      error: directError,
    };
  }

  async dispatchWorkflow(task: 'scrape' | 'deadlines' | 'digest' | 'follow-ups' | 'all' = 'scrape') {
    return this.request<{ dispatched: boolean; task: string; message: string }>(
      '/api/workflow/dispatch',
      {
        method: 'POST',
        body: JSON.stringify({ task }),
      },
    );
  }

  async getHealth() {
    return this.request<AgentHealth>('/health');
  }

  async getResumeVersions() {
    return this.request<{
      resumes: Array<{
        id: string;
        label: string;
        filename: string;
        created_at: string;
      }>;
    }>('/api/resume/list');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types
export type { ApiClient };
