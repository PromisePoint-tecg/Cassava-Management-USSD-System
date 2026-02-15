import { apiClient } from './client';

export type WithdrawerPayoutStatus =
  | 'pending'
  | 'processing'
  | 'retrying'
  | 'completed'
  | 'failed';

export interface WithdrawerPayoutSummary {
  id: string;
  walletTransactionId?: string;
  walletTransactionReference: string;
  transferReference: string;
  paystackTransferCode?: string | null;
  paystackRecipientCode?: string | null;
  userId?: string;
  userType: 'farmer' | 'staff';
  userName: string;
  userPhone?: string | null;
  source: 'staff_api' | 'ussd_farmer' | 'ussd_staff' | 'api';
  amount: number;
  status: WithdrawerPayoutStatus;
  attempts: number;
  maxAttempts: number;
  lastError?: string | null;
  nextRetryAt?: string | null;
  bank: {
    name: string;
    code: string;
    accountNumber: string;
    accountName: string;
  };
  balances: {
    userWalletBefore: number;
    userWalletAfter: number;
    organizationWithdrawerWalletBefore: number;
    organizationWithdrawerWalletAfter: number;
  };
  organizationWalletTransactionId?: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt?: string | null;
  failedAt?: string | null;
  transactions?: {
    userWalletTransaction?: any;
    organizationWithdrawerTransaction?: any;
  };
}

export interface WithdrawerPayoutKpis {
  period: {
    startDate: string | null;
    endDate: string | null;
  };
  totals: {
    totalRequests: number;
    pending: number;
    processing: number;
    retrying: number;
    completed: number;
    failed: number;
    totalRequestedAmount: number;
    totalCompletedAmount: number;
    totalFailedAmount: number;
    averageAmount: number;
  };
}

export interface WithdrawerPayoutListResponse {
  payouts: WithdrawerPayoutSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetWithdrawerPayoutsParams {
  page?: number;
  limit?: number;
  status?: WithdrawerPayoutStatus | 'all' | '';
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'amount' | 'status' | 'processed_at';
  sortOrder?: 'asc' | 'desc';
}

class WithdrawersApi {
  async getWithdrawerKpis(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<WithdrawerPayoutKpis> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);

    const response: any = await apiClient.get(
      `/admins/withdrawers/kpis${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
    );

    return response.data || response;
  }

  async getWithdrawerPayouts(
    params: GetWithdrawerPayoutsParams = {},
  ): Promise<WithdrawerPayoutListResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    const response: any = await apiClient.get(
      `/admins/withdrawers${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
    );

    return response.data || response;
  }

  async getWithdrawerPayoutById(id: string): Promise<WithdrawerPayoutSummary> {
    const response: any = await apiClient.get(`/admins/withdrawers/${id}`);
    return response.data || response;
  }
}

export const withdrawersApi = new WithdrawersApi();
