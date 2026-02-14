import { apiClient } from "./client";
import { TransactionQueryParams, TransactionsResponse } from "./transactions";

export type OrganizationWalletType =
  | "payroll"
  | "bonus"
  | "withdrawer"
  | "purchase";

export type FinanceKpiUnit = "count" | "naira" | "percent" | "naira_per_session";

export interface FinanceKpiMetric {
  metric: string;
  value: number;
  unit: FinanceKpiUnit;
}

export interface OrganizationWalletSnapshot {
  id?: string | null;
  walletType: OrganizationWalletType;
  walletName: string;
  exists: boolean;
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  currency?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface FinanceKpisResponse {
  period: string;
  wallets: OrganizationWalletSnapshot[];
  operationalMetrics: FinanceKpiMetric[];
  engagementMetrics: FinanceKpiMetric[];
  summary: {
    totalFarmers: number;
    totalStaff: number;
    totalActiveFarmers: number;
    totalOrganizationWalletBalance: number;
  };
  generatedAt: string;
}

export interface FundOrganizationWalletByTypePayload {
  walletType: OrganizationWalletType;
  amount: number;
  reason?: string;
}

export interface AdminWalletActionPayload {
  userId: string;
  amount: number;
  reason: string;
}

class FinanceApi {
  async getFinanceKPIs(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<FinanceKpisResponse> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append("startDate", params.startDate);
    if (params?.endDate) searchParams.append("endDate", params.endDate);
    const query = searchParams.toString();

    const response: any = await apiClient.get(
      `/admins/finance/kpis${query ? `?${query}` : ""}`
    );
    return response.data || response;
  }

  async getOrganizationWallets(): Promise<OrganizationWalletSnapshot[]> {
    const response: any = await apiClient.get("/admins/wallet/organization/all");
    return response.data || response;
  }

  async fundOrganizationWalletByType(
    payload: FundOrganizationWalletByTypePayload
  ): Promise<any> {
    const response: any = await apiClient.post(
      "/admins/wallet/organization/fund-by-type",
      payload
    );
    return response.data || response;
  }

  async getOrganizationTransactions(
    params: TransactionQueryParams = {}
  ): Promise<TransactionsResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });

    const response: any = await apiClient.get(
      `/admin/transactions/organization?${searchParams.toString()}`
    );
    return response.data || response;
  }

  async fundUserWallet(payload: AdminWalletActionPayload): Promise<any> {
    const response: any = await apiClient.post("/admins/wallet/fund", payload);
    return response.data || response;
  }

  async withdrawUserWallet(payload: AdminWalletActionPayload): Promise<any> {
    const response: any = await apiClient.post(
      "/admins/wallet/withdraw",
      payload
    );
    return response.data || response;
  }
}

export const financeApi = new FinanceApi();
