import { ApiClient } from "./client";

export interface PurchaseItem {
  _id: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  weightKg: number;
  unit: "kg" | "ton";
  pricePerKg: number; // in naira
  totalAmount: number; // in naira
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  paymentMethod: "cash" | "bank_transfer" | "wallet";
  paymentStatus: "pending" | "processing" | "paid" | "failed";
  recordedBy: string;
  recordedById: string;
  location?: string;
  notes?: string;
  walletTransactionId?: string;
  organizationPurchaseWalletTransactionId?: string;
  organizationPurchaseWalletDebitedAmount?: number; // in naira
  loanDeductionAmount?: number; // in naira
  savingsDeductionAmount?: number; // in naira
  netAmountCredited?: number; // in naira
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseData {
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  weightKg: number;
  pricePerKg: number; // in naira
  unit: "kg" | "ton";
  paymentMethod: "cash" | "bank_transfer" | "wallet";
  location?: string;
  notes?: string;
}

export interface GetPurchasesQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: "pending" | "processing" | "completed" | "failed" | "cancelled";
  paymentStatus?: "pending" | "processing" | "paid" | "failed";
  farmerId?: string;
  sortBy?: "createdAt" | "totalAmount" | "weightKg" | "farmerName";
  sortOrder?: "asc" | "desc";
  startDate?: string;
  endDate?: string;
}

export interface PurchasesResponse {
  purchases: PurchaseItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PurchaseKPIs {
  totalPurchases: number;
  completedPurchases: number;
  pendingPurchases: number;
  failedPurchases: number;
  totalWeight: number;
  totalAmountSpent: number; // in naira
  averagePrice: number; // in naira
  totalLoanDeductions: number; // in naira
  totalSavingsDeductions: number; // in naira
  netAmountPaidToFarmers: number; // in naira
  purchaseWalletBalance: number; // in naira
}

export interface CassavaPricing {
  pricePerKg: number; // in naira
  pricePerTon: number; // in naira
  effectiveDate: Date;
  lastUpdated: Date;
}

export class PurchasesApi {
  private client: ApiClient;

  constructor() {
    this.client = new ApiClient();
  }

  private fromKobo(value?: number | null): number {
    return Number(((value || 0) / 100).toFixed(2));
  }

  private normalizePurchase = (purchase: any): PurchaseItem => ({
    ...purchase,
    _id: String(purchase?._id || purchase?.id || ""),
    pricePerKg: this.fromKobo(purchase?.pricePerKg),
    totalAmount: this.fromKobo(purchase?.totalAmount),
    organizationPurchaseWalletDebitedAmount:
      purchase?.organizationPurchaseWalletDebitedAmount !== undefined
        ? this.fromKobo(purchase.organizationPurchaseWalletDebitedAmount)
        : undefined,
    loanDeductionAmount:
      purchase?.loanDeductionAmount !== undefined
        ? this.fromKobo(purchase.loanDeductionAmount)
        : undefined,
    savingsDeductionAmount:
      purchase?.savingsDeductionAmount !== undefined
        ? this.fromKobo(purchase.savingsDeductionAmount)
        : undefined,
    netAmountCredited:
      purchase?.netAmountCredited !== undefined
        ? this.fromKobo(purchase.netAmountCredited)
        : undefined,
    createdAt: purchase?.createdAt || new Date().toISOString(),
    updatedAt: purchase?.updatedAt || new Date().toISOString(),
  });

  /**
   * Get all purchases with pagination and filters
   */
  async getAllPurchases(query?: GetPurchasesQuery): Promise<PurchasesResponse> {
    const queryParams = new URLSearchParams();

    if (query?.page) queryParams.append("page", query.page.toString());
    if (query?.limit) queryParams.append("limit", query.limit.toString());
    if (query?.search) queryParams.append("search", query.search);
    if (query?.status) queryParams.append("status", query.status);
    if (query?.paymentStatus)
      queryParams.append("paymentStatus", query.paymentStatus);
    if (query?.farmerId) queryParams.append("farmerId", query.farmerId);
    if (query?.sortBy) queryParams.append("sortBy", query.sortBy);
    if (query?.sortOrder) queryParams.append("sortOrder", query.sortOrder);
    if (query?.startDate) queryParams.append("startDate", query.startDate);
    if (query?.endDate) queryParams.append("endDate", query.endDate);

    const queryString = queryParams.toString();
    const url = `/purchases${queryString ? `?${queryString}` : ""}`;

    const response = await this.client.get<any>(url);
    const rawPurchases =
      response?.purchases || response?.data?.purchases || [];
    const pagination = response?.pagination || response?.data?.pagination || {};

    return {
      purchases: rawPurchases.map(this.normalizePurchase),
      total: pagination?.total ?? response?.total ?? 0,
      page: pagination?.page ?? response?.page ?? query?.page ?? 1,
      limit: pagination?.limit ?? response?.limit ?? query?.limit ?? 20,
      totalPages: pagination?.pages ?? response?.totalPages ?? 1,
    };
  }

  /**
   * Get purchase KPIs
   */
  async getPurchaseKPIs(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<PurchaseKPIs> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    const queryString = queryParams.toString();
    const url = `/purchases/kpis${queryString ? `?${queryString}` : ""}`;

    const response = await this.client.get<any>(url);
    return response?.data || response;
  }

  /**
   * Create a new purchase
   */
  async createPurchase(data: CreatePurchaseData): Promise<PurchaseItem> {
    const payload = {
      farmerId: data.farmerId,
      farmerPhone: data.farmerPhone,
      weightKg: data.weightKg,
      pricePerKg: data.pricePerKg, // naira
      unit: data.unit,
      paymentMethod: data.paymentMethod,
      location: data.location,
      notes: data.notes,
    };
    const response = await this.client.post<any>("/purchases", payload);
    return this.normalizePurchase(response);
  }

  /**
   * Get purchase by ID
   */
  async getPurchaseById(id: string): Promise<PurchaseItem> {
    const response = await this.client.get<any>(`/purchases/${id}`);
    return this.normalizePurchase(response?.data || response);
  }

  /**
   * Update purchase status
   */
  async updatePurchaseStatus(
    id: string,
    status: PurchaseItem["status"]
  ): Promise<PurchaseItem> {
    const response = await this.client.patch<any>(`/purchases/${id}/status`, {
      status,
    });
    return this.normalizePurchase(response?.data || response);
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    id: string,
    paymentStatus: PurchaseItem["paymentStatus"]
  ): Promise<PurchaseItem> {
    const response = await this.client.patch<any>(
      `/purchases/${id}/payment-status`,
      { paymentStatus }
    );
    return this.normalizePurchase(response?.data || response);
  }

  /**
   * Get current cassava pricing
   */
  async getCassavaPricing(): Promise<CassavaPricing> {
    try {
      const response = await this.client.get<{
        success: boolean;
        data: { cassavaPricePerKg: number; cassavaPricePerTon: number };
      }>("/settings/cassava-pricing");
      return {
        pricePerKg: response.data.cassavaPricePerKg,
        pricePerTon: response.data.cassavaPricePerTon,
        effectiveDate: new Date(),
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.warn(
        "Using fallback cassava pricing - backend endpoint not available"
      );
      return {
        pricePerKg: 500,
        pricePerTon: 450000,
        effectiveDate: new Date(),
        lastUpdated: new Date(),
      };
    }
  }

  /**
   * Update cassava pricing
   */
  async updateCassavaPricing(data: {
    pricePerKg: number;
    pricePerTon: number;
  }): Promise<CassavaPricing> {
    const response = await this.client.put<CassavaPricing>(
      "/admins/settings/cassava-pricing",
      data
    );
    return response;
  }

  /**
   * Delete purchase (admin only)
   */
  async deletePurchase(id: string): Promise<{ message: string }> {
    const response = await this.client.delete<{ message: string }>(
      `/purchases/${id}`
    );
    return response;
  }

  /**
   * Retry a failed purchase
   */
  async retryPurchase(
    id: string
  ): Promise<{ success: boolean; message: string; data: PurchaseItem }> {
    const response = await this.client.post<any>(`/purchases/${id}/retry`);
    return {
      success: response.success,
      message: response.message,
      data: this.normalizePurchase(response.data),
    };
  }
}

export const purchasesApi = new PurchasesApi();
