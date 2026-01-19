import { ApiClient } from "./client";

export interface LoanKPIs {
  totalLoanRequests: number;
  pendingRequests: number;
  approvedLoans: number;
  activeLoans: number;
  completedLoans: number;
  defaultedLoans: number;
  totalOutstanding: number;
  totalDisbursed: number;
  defaultRate: number;
}

export interface LoanItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  description?: string;
}

export interface LoanType {
  id: string;
  name: string;
  category: string;
  description?: string;
  interest_rate: number;
  duration_months: number;
  max_amount: number;
  min_amount: number;
  is_active: boolean;
  created_by: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FarmerOption {
  id: string;
  name: string;
  phone: string;
}

export interface AdminLoanResponse {
  id: string;
  user_id: string;
  user_type: "staff" | "farmer";
  name: string;
  phone: string;
  loan_type_name: string;
  principal_amount: number; // in naira
  interest_rate: number;
  interest_amount: number; // in naira
  total_repayment: number; // in naira
  purpose: string;
  duration_months: number;
  monthly_payment: number; // in naira
  amount_paid: number; // in naira
  amount_outstanding: number; // in naira
  status: "requested" | "approved" | "active" | "completed" | "defaulted";
  reference: string;
  pickup_date?: Date;
  pickup_location?: string;
  approved_at?: Date;
  disbursed_at?: Date;
  due_date: Date;
  completed_at?: Date;
  defaulted_at?: Date;
  createdAt: Date;
  updatedAt: Date;
  items: LoanItem[];
}

export interface GetLoansQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: "requested" | "approved" | "active" | "completed" | "defaulted";
  sortBy?: "createdAt" | "due_date" | "principal_amount" | "farmer_name";
  sortOrder?: "asc" | "desc";
}

export interface LoansResponse {
  loans: AdminLoanResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoanRequestsResponse {
  loanRequests: AdminLoanResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateLoanData {
  farmer_id: string;
  loan_type_id: string;
  principal_amount: number; // in kobo
  items: LoanItem[];
  purpose?: string;
  due_date: string;
  monthly_payment?: number; // in kobo
  notes?: string;
}

export interface CreateLoanTypeData {
  name: string;
  description: string;
  category: string;
  interest_rate: number;
  duration_months: number;
}

export interface ApproveLoanData {
  pickup_date: string; // ISO 8601
  pickup_location?: string;
  admin_notes?: string;
}

export class LoansApi {
  private client: ApiClient;

  constructor() {
    this.client = new ApiClient();
  }

  /**
   * Get loan KPIs for dashboard
   */
  async getLoanKPIs(): Promise<LoanKPIs> {
    return this.client.get<LoanKPIs>("/admins/loans/kpis");
  }

  /**
   * Get all loan types
   */
  async getLoanTypes(
    filters: { category?: string; is_active?: boolean } = {}
  ): Promise<LoanType[]> {
    const params = new URLSearchParams();
    if (filters.category) params.append("category", filters.category);
    if (filters.is_active !== undefined)
      params.append("is_active", filters.is_active.toString());

    return this.client.get<LoanType[]>(`/loans/types?${params.toString()}`);
  }

  /**
   * Create a new loan type
   */
  async createLoanType(data: CreateLoanTypeData): Promise<LoanType> {
    return this.client.post<LoanType>("/loans/types", data);
  }

  /**
   * Get all loans with pagination and filters
   */
  async getAllLoans(query: GetLoansQuery = {}): Promise<LoansResponse> {
    const params = new URLSearchParams();

    if (query.page) params.append("page", query.page.toString());
    if (query.limit) params.append("limit", query.limit.toString());
    if (query.search) params.append("search", query.search);
    if (query.status) params.append("status", query.status);
    if (query.sortBy) params.append("sortBy", query.sortBy);
    if (query.sortOrder) params.append("sortOrder", query.sortOrder);

    const queryString = params.toString();
    const endpoint = `/admins/loans${queryString ? `?${queryString}` : ""}`;

    return this.client.get<LoansResponse>(endpoint);
  }

  /**
   * Get all loan requests (pending approval)
   */
  async getLoanRequests(
    query: GetLoansQuery = {}
  ): Promise<LoanRequestsResponse> {
    const params = new URLSearchParams();

    if (query.page) params.append("page", query.page.toString());
    if (query.limit) params.append("limit", query.limit.toString());
    if (query.search) params.append("search", query.search);
    if (query.sortBy) params.append("sortBy", query.sortBy);
    if (query.sortOrder) params.append("sortOrder", query.sortOrder);

    const queryString = params.toString();
    const endpoint = `/admins/loan-requests${
      queryString ? `?${queryString}` : ""
    }`;

    return this.client.get<LoanRequestsResponse>(endpoint);
  }

  /**
   * Get loan by ID
   */
  async getLoanById(id: string): Promise<AdminLoanResponse> {
    return this.client.get<AdminLoanResponse>(`/admins/loans/${id}`);
  }

  /**
   * Create a new loan
   */
  async createLoan(data: CreateLoanData): Promise<AdminLoanResponse> {
    return this.client.post<AdminLoanResponse>("/admins/loans", data);
  }

  /**
   * Approve a loan request
   */
  async approveLoanRequest(
    id: string,
    data: ApproveLoanData
  ): Promise<AdminLoanResponse> {
    return this.client.patch<AdminLoanResponse>(
      `/admins/loans/${id}/approve`,
      data
    );
  }

  /**
   * Activate an approved loan
   */
  async activateLoan(id: string): Promise<AdminLoanResponse> {
    return this.client.patch<AdminLoanResponse>(
      `/admins/loans/${id}/activate`,
      {}
    );
  }
}

// Export singleton instance
export const loansApi = new LoansApi();
