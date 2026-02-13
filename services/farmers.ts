import { apiClient } from './client';

export interface Farmer {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  name: string;
  fullName: string;
  phone: string;
  lga: string;
  farmSizeHectares: number;
  totalSales: number;
  totalEarnings: number;
  completedSales: number;
  walletBalance: number;
  loanDefaults: number;
  activeLoan: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface FarmerDetail extends Farmer {
  walletBalance: number;
  walletBankName?: string;
  walletBankCode?: string;
  walletAccountNumber?: string;
  walletAccountName?: string;
  walletBvn?: string;
}

export interface PaginatedFarmersResponse {
  farmers: Farmer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetAllFarmersParams {
  page?: number;
  limit?: number;
  lga?: string;
  status?: 'active' | 'inactive' | 'suspended';
  activeLoan?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UpdateFarmerData {
  firstName?: string;
  lastName?: string;
  lga?: string;
  farmSizeHectares?: number;
}

export interface UserFinancialDetails {
  wallet: {
    balance: number;
    isActive: boolean;
  };
  outstandingLoans: Array<{
    id: string;
    principalAmount: number;
    totalRepayment: number;
    amountPaid: number;
    amountOutstanding: number;
    status: string;
  }>;
  recentPurchases: Array<{
    id: string;
    weightKg: number;
    totalAmount: number;
    netAmountCredited: number;
    status: string;
    createdAt: Date;
  }>;
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    status: string;
    description: string;
    createdAt: Date;
  }>;
}

export interface FarmerDashboardKpiRow {
  kpi: string;
  target: number;
  actual: number;
  status: 'on_track' | 'at_risk' | 'off_track';
  unit: 'count' | 'percent' | 'minutes';
}

export interface FarmerDashboardKpiTable {
  period: string;
  rows: FarmerDashboardKpiRow[];
  generatedAt: string;
}

export interface DashboardKpiDateFilterParams {
  startDate?: string;
  endDate?: string;
}

export const farmersApi = {
  /**
   * Get all farmers with pagination and filters
   */
  async getAllFarmers(params?: GetAllFarmersParams): Promise<PaginatedFarmersResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.lga) queryParams.append('lga', params.lga);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.activeLoan) queryParams.append('activeLoan', params.activeLoan);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const url = `/admins/farmers/list${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get<PaginatedFarmersResponse>(url);
    return response;
  },

  /**
   * Get farmer by ID with detailed information
   */
  async getFarmerById(farmerId: string): Promise<FarmerDetail> {
    const response = await apiClient.get<FarmerDetail>(`/admins/farmers/${farmerId}`);
    return response;
  },

  /**
   * Update farmer information
   */
  async updateFarmer(farmerId: string, data: UpdateFarmerData): Promise<FarmerDetail> {
    const response = await apiClient.patch<FarmerDetail>(`/admins/farmers/${farmerId}`, data);
    return response;
  },

  /**
   * Deactivate farmer account
   */
  async deactivateFarmer(farmerId: string): Promise<{ message: string; farmer: FarmerDetail }> {
    const response = await apiClient.patch<{ message: string; farmer: FarmerDetail }>(`/admins/farmers/${farmerId}/deactivate`, {});
    return response;
  },

  /**
   * Activate farmer account
   */
  async activateFarmer(farmerId: string): Promise<{ message: string; farmer: FarmerDetail }> {
    const response = await apiClient.patch<{ message: string; farmer: FarmerDetail }>(`/admins/farmers/${farmerId}/activate`, {});
    return response;
  },

  /**
   * Suspend farmer account with reason
   */
  async suspendFarmer(farmerId: string, reason: string): Promise<{ message: string; farmer: FarmerDetail }> {
    const response = await apiClient.patch<{ message: string; farmer: FarmerDetail }>(`/admins/farmers/${farmerId}/suspend`, { reason });
    return response;
  },

  /**
   * Get farmer's detailed financial status including wallet, loans, and transactions
   */
  async getFarmerFinancialStatus(farmerId: string): Promise<UserFinancialDetails> {
    const response = await apiClient.get<{status: boolean; message: string; data: UserFinancialDetails}>(`/admin/transactions/farmer/${farmerId}/financial-status`);
    return response.data;
  },

  /**
   * Get dashboard KPI table used on dashboard/farmers analytics surfaces
   */
  async getDashboardKpiTable(
    params?: DashboardKpiDateFilterParams,
  ): Promise<FarmerDashboardKpiTable> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    const queryString = queryParams.toString();
    const url = `/admins/dashboard/kpis${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get<{ kpiTable: FarmerDashboardKpiTable }>(
      url,
    );
    return response.kpiTable;
  },
};
