/**
 * Bonus Management API functions
 */

import { apiClient } from "./client";

export interface BonusWallet {
  id: string;
  user_type: string;
  balance: number;
  total_deposited: number;
  total_withdrawn: number;
  organization_name: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffBonusBalance {
  staffId: string;
  firstName: string;
  lastName: string;
  bonusBalance: number;
}

export interface BonusAssignmentResult {
  staffId: string;
  success: boolean;
  message: string;
  bonusBalance?: number;
}

export interface BonusAssignmentResponse {
  success: number;
  failed: number;
  results: BonusAssignmentResult[];
}

export interface FundBonusWalletData {
  amount: number;
  reason?: string;
}

export interface StaffBonus {
  staffId: string;
  amount: number;
  reason?: string;
}

export interface AssignBonusData {
  staffBonuses: StaffBonus[];
}

export interface TransferBonusData {
  staffId: string;
  amount?: number; // Optional - if not provided, transfers all bonus balance
}

export type BonusTransactionType =
  | 'bonus_wallet_funding'
  | 'bonus_allocation'
  | 'bonus_transfer';

export interface BonusTransaction {
  _id: string;
  reference: string;
  type: BonusTransactionType;
  amount: number; // in kobo
  amountNaira?: number;
  user_id?: string;
  user_type: string;
  description?: string;
  status: string;
  balance_before?: number;
  balance_after?: number;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedBonusTransactions {
  items: BonusTransaction[];
  total: number;
  page: number;
  limit: number;
}

class BonusApi {

  /**
   * Get organization bonus wallet
   */
  async getBonusWallet(): Promise<BonusWallet> {
    const result: any = await apiClient.get('/admins/bonus/wallet');
    return result.data || result;
  }

  /**
   * Create organization bonus wallet
   */
  async createBonusWallet(organizationName: string = 'Organization Bonus Wallet'): Promise<BonusWallet> {
    const result: any = await apiClient.post('/admins/bonus/wallet/create', {
      organization_name: organizationName,
    });
    return result.data || result;
  }

  /**
   * Fund organization bonus wallet
   */
  async fundBonusWallet(data: FundBonusWalletData): Promise<BonusWallet> {
    const result: any = await apiClient.post('/admins/bonus/wallet/fund', data);
    return result.data || result;
  }

  /**
   * Assign bonuses to multiple staff
   */
  async assignBonuses(data: AssignBonusData): Promise<BonusAssignmentResponse> {
    const result: any = await apiClient.post('/admins/bonus/assign', data);
    return result.data || result;
  }

  /**
   * Transfer bonus to main wallet for a staff
   */
  async transferBonusToWallet(data: TransferBonusData): Promise<any> {
    const result: any = await apiClient.post('/admins/bonus/transfer', data);
    return result.data || result;
  }

  /**
   * Get staff bonus balance
   */
  async getStaffBonusBalance(staffId: string): Promise<number> {
    const result: any = await apiClient.get(`/admins/bonus/staff/${staffId}/balance`);
    return result.data?.bonusBalance ?? result.bonusBalance ?? result.data;
  }

  /**
   * Get all staff with their bonus balances
   */
  async getAllStaffBonusBalances(): Promise<StaffBonusBalance[]> {
    const result: any = await apiClient.get('/admins/bonus/staff/balances');
    return result.data || result;
  }

  /**
   * Get bonus transactions (paginated & filterable)
   */
  async getBonusTransactions(params: {
    page?: number;
    limit?: number;
    type?: BonusTransactionType;
    staffId?: string;
    search?: string;
  }): Promise<PaginatedBonusTransactions> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.type) searchParams.append('type', params.type);
    if (params.staffId) searchParams.append('staffId', params.staffId);
    if (params.search) searchParams.append('search', params.search);

    const qs = searchParams.toString();
    const result: any = await apiClient.get(`/admins/bonus/transactions${qs ? `?${qs}` : ''}`);
    return result.data || result;
  }
}

// Export singleton instance
export const bonusApi = new BonusApi();