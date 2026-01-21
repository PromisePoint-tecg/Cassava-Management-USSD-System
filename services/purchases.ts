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
  status: "pending" | "completed" | "failed" | "cancelled";
  paymentMethod: "cash" | "bank_transfer" | "wallet";
  paymentStatus: "pending" | "paid" | "failed";
  recordedBy: string;
  recordedById: string;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePurchaseData {
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  weightKg: number;
  pricePerKg: number;
  unit: "kg" | "ton";
  paymentMethod: "cash" | "bank_transfer" | "wallet";
  location?: string;
  notes?: string;
}

export interface GetPurchasesQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: "pending" | "completed" | "failed" | "cancelled";
  paymentStatus?: "pending" | "paid" | "failed";
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
  totalWeight: number;
  totalAmountSpent: number; // in naira
  averagePrice: number;
  pendingPurchases: number;
  completedPurchases: number;
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

    const response = await this.client.get<PurchasesResponse>(url);
    return response;
  }

  /**
   * Get purchase KPIs
   */
  async getPurchaseKPIs(): Promise<PurchaseKPIs> {
    const response = await this.client.get<PurchaseKPIs>("/purchases/kpis");
    return response;
  }

  /**
   * Create a new purchase
   */
  async createPurchase(data: CreatePurchaseData): Promise<PurchaseItem> {
    const response = await this.client.post<PurchaseItem>("/purchases", data);
    return response;
  }

  /**
   * Get purchase by ID
   */
  async getPurchaseById(id: string): Promise<PurchaseItem> {
    const response = await this.client.get<PurchaseItem>(`/purchases/${id}`);
    return response;
  }

  /**
   * Update purchase status
   */
  async updatePurchaseStatus(
    id: string,
    status: PurchaseItem["status"]
  ): Promise<PurchaseItem> {
    const response = await this.client.patch<PurchaseItem>(
      `/purchases/${id}/status`,
      { status }
    );
    return response;
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    id: string,
    paymentStatus: PurchaseItem["paymentStatus"]
  ): Promise<PurchaseItem> {
    const response = await this.client.patch<PurchaseItem>(
      `/purchases/${id}/payment`,
      { paymentStatus }
    );
    return response;
  }

  /**
   * Get current cassava pricing
   */
  async getCassavaPricing(): Promise<CassavaPricing> {
    try {
      // Get from settings endpoint
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
      // Fallback to default pricing
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
    const response = await this.client.post<{
      success: boolean;
      message: string;
      data: PurchaseItem;
    }>(`/purchases/${id}/retry`);
    return response;
  }
}

export const purchasesApi = new PurchasesApi();
