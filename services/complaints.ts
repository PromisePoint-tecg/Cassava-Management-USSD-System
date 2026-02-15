import { ApiClient } from './client';

export type ComplaintStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type ComplaintPriority = 'low' | 'medium' | 'high' | 'critical';
export type ComplaintComplainantType =
  | 'farmer'
  | 'student_farmer'
  | 'staff'
  | 'admin'
  | 'other';

export interface ComplaintItem {
  id: string;
  reference: string;
  complainantType: ComplaintComplainantType;
  complainantId?: string | null;
  complainantName: string;
  complainantPhone?: string | null;
  category: string;
  title: string;
  description: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  source: 'dashboard' | 'ussd' | 'api';
  assignedToAdminId?: string | null;
  assignedToAdminName?: string | null;
  resolutionNotes?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  createdByAdminId?: string | null;
  updatedByAdminId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintKpis {
  period: {
    startDate: string | null;
    endDate: string | null;
  };
  totals: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    resolutionRate: number;
  };
  priorities: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export interface ComplaintsResponse {
  complaints: ComplaintItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ComplaintListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: ComplaintStatus | '';
  priority?: ComplaintPriority | '';
  complainantType?: ComplaintComplainantType | '';
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateComplaintPayload {
  complainantType?: ComplaintComplainantType;
  complainantId?: string;
  complainantName: string;
  complainantPhone?: string;
  category?: string;
  title: string;
  description: string;
  priority?: ComplaintPriority;
  status?: ComplaintStatus;
  source?: 'dashboard' | 'ussd' | 'api';
}

export interface UpdateComplaintPayload {
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
  assignedToAdminId?: string;
  assignedToAdminName?: string;
  resolutionNotes?: string;
}

class ComplaintsApi {
  private client = new ApiClient();

  private unwrapData<T>(payload: any): T {
    if (payload && typeof payload === 'object' && 'data' in payload) {
      return payload.data as T;
    }
    return payload as T;
  }

  async getComplaints(query: ComplaintListQuery = {}): Promise<ComplaintsResponse> {
    const params = new URLSearchParams();

    if (query.page) params.append('page', String(query.page));
    if (query.limit) params.append('limit', String(query.limit));
    if (query.search) params.append('search', query.search);
    if (query.status) params.append('status', query.status);
    if (query.priority) params.append('priority', query.priority);
    if (query.complainantType) params.append('complainantType', query.complainantType);
    if (query.startDate) params.append('startDate', query.startDate);
    if (query.endDate) params.append('endDate', query.endDate);
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);

    const queryString = params.toString();
    const response = await this.client.get<any>(
      `/complaints${queryString ? `?${queryString}` : ''}`,
    );
    return this.unwrapData<ComplaintsResponse>(response);
  }

  async getComplaintKpis(filters: {
    startDate?: string;
    endDate?: string;
  } = {}): Promise<ComplaintKpis> {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString();
    const response = await this.client.get<any>(
      `/complaints/kpis${queryString ? `?${queryString}` : ''}`,
    );
    return this.unwrapData<ComplaintKpis>(response);
  }

  async getComplaintById(id: string): Promise<ComplaintItem> {
    const response = await this.client.get<any>(`/complaints/${id}`);
    return this.unwrapData<ComplaintItem>(response);
  }

  async createComplaint(payload: CreateComplaintPayload): Promise<ComplaintItem> {
    const response = await this.client.post<any>('/complaints', payload);
    return this.unwrapData<ComplaintItem>(response);
  }

  async updateComplaint(
    id: string,
    payload: UpdateComplaintPayload,
  ): Promise<ComplaintItem> {
    const response = await this.client.patch<any>(`/complaints/${id}`, payload);
    return this.unwrapData<ComplaintItem>(response);
  }
}

export const complaintsApi = new ComplaintsApi();
