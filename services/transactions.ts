import { apiClient } from "./client";

export interface Transaction {
  id: string;
  userId: string;
  userType: "farmer" | "buyer" | "staff" | "organization";
  type: string;
  walletType?: "payroll" | "bonus" | "withdrawer" | "purchase";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: "pending" | "completed" | "failed" | "cancelled";
  reference: string;
  description: string;
  orderId?: string;
  loanId?: string;
  user?: {
    id: string;
    name: string;
    phone: string;
    type: "farmer" | "buyer";
    lga?: string;
    farmSize?: number;
    businessName?: string;
  };
  createdAt: string;
  completedAt?: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  totalPages: number;
}

export interface TransactionStats {
  totalTransactions: number;
  totalAmount: number;
  pendingTransactions: number;
  completedTransactions: number;
  failedTransactions: number;
  byType: {
    wallet: number;
    loan: number;
    purchase: number;
    payroll: number;
    organization: number;
  };
}

export interface TransactionQueryParams {
  page?: number;
  limit?: number;
  type?: string;
  walletType?: string;
  status?: string;
  userType?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const transactionsApi = {
  async getAllTransactions(
    params: TransactionQueryParams = {}
  ): Promise<TransactionsResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });

    try {
      const response = await apiClient.get<any>(
        `/admin/transactions?${searchParams.toString()}`
      );
      console.log("getAllTransactions response:", response);

      // Handle both wrapped and direct response formats
      if (response && response.data) {
        return response.data;
      } else if (response && response.transactions) {
        return response;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("API Error in getAllTransactions:", error);
      throw error;
    }
  },

  async getWalletTransactions(
    params: TransactionQueryParams = {}
  ): Promise<TransactionsResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });

    try {
      const response = await apiClient.get<any>(
        `/admin/transactions/wallet?${searchParams.toString()}`
      );
      return response.data || response;
    } catch (error) {
      console.error("API Error in getWalletTransactions:", error);
      throw error;
    }
  },

  async getLoanTransactions(
    params: TransactionQueryParams = {}
  ): Promise<TransactionsResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });

    try {
      const response = await apiClient.get<any>(
        `/admin/transactions/loans?${searchParams.toString()}`
      );
      return response.data || response;
    } catch (error) {
      console.error("API Error in getLoanTransactions:", error);
      throw error;
    }
  },

  async getPurchaseTransactions(
    params: TransactionQueryParams = {}
  ): Promise<TransactionsResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });

    try {
      const response = await apiClient.get<any>(
        `/admin/transactions/purchases?${searchParams.toString()}`
      );
      return response.data || response;
    } catch (error) {
      console.error("API Error in getPurchaseTransactions:", error);
      throw error;
    }
  },

  async getPayrollTransactions(
    params: TransactionQueryParams = {}
  ): Promise<TransactionsResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });

    try {
      const response = await apiClient.get<any>(
        `/admin/transactions/payroll?${searchParams.toString()}`
      );
      return response.data || response;
    } catch (error) {
      console.error("API Error in getPayrollTransactions:", error);
      throw error;
    }
  },

  async getOrganizationTransactions(
    params: TransactionQueryParams = {}
  ): Promise<TransactionsResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });

    try {
      const response = await apiClient.get<any>(
        `/admin/transactions/organization?${searchParams.toString()}`
      );
      return response.data || response;
    } catch (error) {
      console.error("API Error in getOrganizationTransactions:", error);
      throw error;
    }
  },

  async getTransactionStats(): Promise<TransactionStats> {
    try {
      const response = await apiClient.get<any>("/admin/transactions/stats");
      return response.data || response;
    } catch (error) {
      console.error("API Error in getTransactionStats:", error);
      throw error;
    }
  },

  async getUserTransactions(
    userId: string,
    params: TransactionQueryParams = {}
  ): Promise<TransactionsResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });

    try {
      const response = await apiClient.get<any>(
        `/admin/transactions/user/${userId}?${searchParams.toString()}`
      );
      return response.data || response;
    } catch (error) {
      console.error("API Error in getUserTransactions:", error);
      throw error;
    }
  },
};
