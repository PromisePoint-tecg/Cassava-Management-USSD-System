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
    user_type: "farmer" | "staff";
    category: string;
    description?: string;
    interest_rate: number;
    duration_months: number;
    max_amount?: number; // for staff loans
    min_amount?: number; // for staff loans
    is_active: boolean;
    created_by?: string;
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
    delivery_status?: "pending" | "delivered";
    delivery_confirmed_at?: Date;
    delivered_by_staff_id?: string;
    delivered_by_staff_name?: string;
    delivery_notes?: string;
    due_date: Date;
    completed_at?: Date;
    defaulted_at?: Date;
    createdAt: Date;
    updatedAt: Date;
    items: LoanItem[];
    farmer_name?: string;
    farmer_phone?: string;
    staff_name?: string;
    staff_phone?: string;
}

export interface GetLoansQuery {
    page?: number;
    limit?: number;
    search?: string;
    status?: "requested" | "approved" | "active" | "completed" | "defaulted";
    user_type?: "farmer" | "staff";
    startDate?: string;
    endDate?: string;
    sortBy?: "createdAt" | "due_date" | "principal_amount" | "farmer_name" | "staff_name";
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
    user_type: "farmer" | "staff";
    farmer_id?: string;
    staff_id?: string;
    loan_type_id: string;
    principal_amount: number; // in kobo
    items?: LoanItem[];
    purpose?: string;
    due_date: string;
    monthly_payment?: number; // in kobo
    notes?: string;
}

export interface CreateLoanTypeData {
    name: string;
    description: string;
    user_type: "farmer" | "staff";
    category: string;
    interest_rate: number;
    duration_months: number;
    min_amount?: number; // for staff loans (in kobo)
    max_amount?: number; // for staff loans (in kobo)
}

export interface ApproveLoanData {
    pickup_date: string; // ISO 8601
    pickup_location?: string;
    admin_notes?: string;
}

export interface DeliveryLoanItemData {
    name: string;
    quantity: number;
    unit_price: number; // in kobo
    total_price: number; // in kobo
    description?: string;
}

export interface RecordLoanDeliveryData {
    items: DeliveryLoanItemData[];
    delivered_by_staff_id?: string;
    delivery_notes?: string;
}

export interface LoanDeliveriesResponse {
    loans: AdminLoanResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface PickupDeliveryKpisResponse {
    period: {
        startDate: string | null;
        endDate: string | null;
    };
    deliveries: {
        pending: number;
        delivered: number;
    };
    pickups: {
        total: number;
        requested: number;
        approved: number;
        staffUpdated: number;
        processed: number;
        cancelled: number;
    };
}

export interface PickupItem {
    name: string;
    quantity?: number;
    unit_price?: number;
    total_price?: number;
    note?: string;
}

export interface PickupRequest {
    id: string;
    farmer_id: string;
    farmer_name: string;
    farmer_phone: string;
    status: "requested" | "approved" | "staff_updated" | "processed" | "cancelled";
    channel: "ussd" | "admin";
    request_notes?: string;
    approved_notes?: string;
    scheduled_date?: string;
    assigned_staff_id?: string;
    assigned_staff_name?: string;
    staff_notes?: string;
    pickup_items?: PickupItem[];
    proposed_weight_kg?: number;
    proposed_price_per_kg?: number;
    linked_purchase_id?: string;
    processed_at?: string;
    createdAt: string;
    updatedAt: string;
}

export interface PickupRequestsResponse {
    pickups: PickupRequest[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface GetPickupRequestsQuery {
    page?: number;
    limit?: number;
    status?: PickupRequest["status"];
    search?: string;
    startDate?: string;
    endDate?: string;
}

export interface ApprovePickupRequestData {
    scheduled_date?: string;
    approved_notes?: string;
    assigned_staff_id?: string;
}

export interface ProcessPickupToPurchaseData {
    weightKg?: number;
    pricePerKg?: number; // in naira
    location?: string;
    notes?: string;
}

export interface GetPickupDeliveryKpisQuery {
    startDate?: string;
    endDate?: string;
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
        filters: { category?: string; is_active?: boolean; user_type?: "farmer" | "staff" } = {}
    ): Promise<LoanType[]> {
        const params = new URLSearchParams();
        if (filters.category) params.append("category", filters.category);
        if (filters.is_active !== undefined)
            params.append("is_active", filters.is_active.toString());
        if (filters.user_type) params.append("user_type", filters.user_type);

        return this.client.get<LoanType[]>(`/loans/types?${params.toString()}`);
    }

    /**
     * Create a new loan type
     */
    async createLoanType(data: CreateLoanTypeData): Promise<LoanType> {
        return this.client.post<LoanType>("/loans/types", data);
    }

    /**
     * Update a loan type
     */
    async updateLoanType(
        id: string,
        data: Partial<CreateLoanTypeData>
    ): Promise<LoanType> {
        return this.client.put<LoanType>(`/loans/types/${id}`, data);
    }

    /**
     * Delete a loan type
     */
    async deleteLoanType(id: string): Promise<{ message: string }> {
        return this.client.delete<{ message: string }>(`/loans/types/${id}`);
    }

    /**
     * Toggle loan type active status
     */
    async toggleLoanTypeActive(id: string): Promise<LoanType> {
        return this.client.patch<LoanType>(`/loans/types/${id}/toggle-active`, {});
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
        if (query.user_type) params.append("user_type", query.user_type);
        if (query.startDate) params.append("startDate", query.startDate);
        if (query.endDate) params.append("endDate", query.endDate);
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
        if (query.status) params.append("status", query.status);
        if (query.user_type) params.append("user_type", query.user_type);
        if (query.startDate) params.append("startDate", query.startDate);
        if (query.endDate) params.append("endDate", query.endDate);
        if (query.sortBy) params.append("sortBy", query.sortBy);
        if (query.sortOrder) params.append("sortOrder", query.sortOrder);

        const queryString = params.toString();
        const endpoint = `/admins/loan-requests${queryString ? `?${queryString}` : ""
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

    async getLoanDeliveries(
        query: GetLoansQuery = {}
    ): Promise<LoanDeliveriesResponse> {
        const params = new URLSearchParams();
        if (query.page) params.append("page", query.page.toString());
        if (query.limit) params.append("limit", query.limit.toString());
        if (query.search) params.append("search", query.search);
        if (query.startDate) params.append("startDate", query.startDate);
        if (query.endDate) params.append("endDate", query.endDate);
        if (query.status && (query.status === "approved" || query.status === "active")) {
            params.append(
                "delivery_status",
                query.status === "active" ? "delivered" : "pending"
            );
        }
        const queryString = params.toString();
        return this.client.get<LoanDeliveriesResponse>(
            `/ops/loan-deliveries${queryString ? `?${queryString}` : ""}`
        );
    }

    async getPickupDeliveryKpis(
        query: GetPickupDeliveryKpisQuery = {}
    ): Promise<PickupDeliveryKpisResponse> {
        const params = new URLSearchParams();
        if (query.startDate) params.append("startDate", query.startDate);
        if (query.endDate) params.append("endDate", query.endDate);
        const queryString = params.toString();
        return this.client.get<PickupDeliveryKpisResponse>(
            `/ops/kpis${queryString ? `?${queryString}` : ""}`
        );
    }

    async recordLoanDelivery(
        id: string,
        data: RecordLoanDeliveryData
    ): Promise<AdminLoanResponse> {
        return this.client.patch<AdminLoanResponse>(
            `/ops/loan-deliveries/${id}/record`,
            data
        );
    }

    async getPickupRequests(
        query: GetPickupRequestsQuery = {}
    ): Promise<PickupRequestsResponse> {
        const params = new URLSearchParams();
        if (query.page) params.append("page", query.page.toString());
        if (query.limit) params.append("limit", query.limit.toString());
        if (query.search) params.append("search", query.search);
        if (query.status) params.append("status", query.status);
        if (query.startDate) params.append("startDate", query.startDate);
        if (query.endDate) params.append("endDate", query.endDate);

        const queryString = params.toString();
        return this.client.get<PickupRequestsResponse>(
            `/ops/pickups${queryString ? `?${queryString}` : ""}`
        );
    }

    async approvePickupRequest(
        id: string,
        data: ApprovePickupRequestData
    ): Promise<PickupRequest> {
        return this.client.patch<PickupRequest>(`/ops/pickups/${id}/approve`, data);
    }

    async processPickupToPurchase(
        id: string,
        data: ProcessPickupToPurchaseData
    ): Promise<{ pickup: PickupRequest; purchase: any }> {
        return this.client.patch<{ pickup: PickupRequest; purchase: any }>(
            `/ops/pickups/${id}/process`,
            data
        );
    }
}

// Export singleton instance
export const loansApi = new LoansApi();
