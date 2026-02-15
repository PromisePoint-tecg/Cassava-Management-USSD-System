/**
 * Staff Management API functions
 */

import { apiClient } from "./client";
import { getStaffAuthToken } from "../utils/cookies";

export interface Staff {
  id: string;
  userId?: string;
  email?: string;
  phone: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  lga?: string;
  role: string;
  department?: string;
  employeeId?: string;
  isActive?: boolean;
  status?: "active" | "inactive";
  isApproved?: boolean;
  dateApproved?: string;
  approvedBy?: string;
  monthlySalary?: number;
  profilePicture?: string;
  totalSalaryPaid?: number;
  pensionContributions?: number;
  performanceRating?: number;
  deactivationReason?: string;
  deactivatedAt?: string;
  nin?: string;
  bvn?: string;
  ninDocumentUrl?: string;
  bvnDocumentUrl?: string;
  wallet?: {
    balance: number;
    pensionBalance: number;
    totalEarned: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface StaffBalances {
  savings: number;
  pension: number;
  wallet: number;
  bonus: number;
}

export interface StaffProfile extends Staff {
  balances?: StaffBalances;
  hasBvn?: boolean;
  hasNin?: boolean;
}

export interface StaffLoginResponse {
  token: string;
  staff: Staff;
}

export interface RegisterStaffDto {
  phone: string;
  firstName: string;
  lastName: string;
  lga: string;
  role: string;
  department: string;
  monthlySalary: number;
}

export interface ApproveStaffDto {
  approved_by?: string;
  monthly_salary?: number;
  profile_picture?: string;
  notes?: string;
}

export interface UpdateStaffDto {
  firstName?: string;
  lastName?: string;
  lga?: string;
  role?: string;
  department?: string;
  monthlySalary?: number;
  profilePicture?: string;
}

export interface DeactivateStaffDto {
  reason: string;
}

// Loan-related interfaces
export interface LoanType {
  id: string;
  name: string;
  user_type: "farmer" | "staff";
  description: string;
  category: string;
  interest_rate: number;
  duration_months: number;
  min_amount?: number;
  max_amount?: number;
  is_active: boolean;
  times_issued: number;
  createdAt: string;
  updatedAt: string;
}

export interface LoanItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  description?: string;
}

export interface StaffLoanRequest {
  loanTypeId: string;
  principalAmount: number;
  interestRate: number;
  purpose: string;
  durationMonths: number;
  pickupLocation?: string;
  pickupDate?: string;
}

export interface StaffTaskPickupItem {
  name: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  note?: string;
}

export interface StaffTaskPickup {
  id: string;
  farmer_name: string;
  farmer_phone: string;
  status: "requested" | "approved" | "staff_updated" | "processed" | "cancelled";
  scheduled_date?: string;
  request_notes?: string;
  approved_notes?: string;
  assigned_staff_name?: string;
  staff_notes?: string;
  pickup_items?: StaffTaskPickupItem[];
  proposed_weight_kg?: number;
  proposed_price_per_kg?: number;
  createdAt: string;
}

export interface StaffTaskLoanDelivery {
  id: string;
  reference: string;
  farmer_name: string;
  farmer_phone: string;
  pickup_date?: string;
  pickup_location?: string;
  delivery_status?: "pending" | "delivered";
  principal_amount: number;
  items?: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

// Admin management interfaces
export interface StaffFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: "active" | "inactive" | "all";
  department?: string;
  is_approved?: boolean;
}

export interface StaffResponse {
  staff: Staff[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedStaffResponse {
  staff: Staff[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateStaffData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
}

export interface UpdateStaffData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
}

export interface StaffActionResponse {
  message: string;
  staff: Staff;
}

class StaffApi {
  private client: typeof apiClient;

  constructor() {
    this.client = apiClient;
  }

  /**
   * Staff login
   */
  async login(phone: string, pin: string): Promise<StaffLoginResponse> {
    const API_BASE_URL =
      import.meta.env.VITE_API_URL || "http://localhost:3000";
    const response = await fetch(`${API_BASE_URL}/staff/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone, pin }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Login failed" }));
      throw new Error(error.message || "Login failed");
    }

    const data = await response.json();

    // The API returns { success, data: { accessToken, staff, ... }, ... }
    if (data && data.data && data.data.accessToken && data.data.staff) {
      return {
        token: data.data.accessToken,
        staff: data.data.staff,
      };
    }
    // fallback to old format
    return data;
  }

  /**
   * Get staff profile
   */
  async getProfile(): Promise<StaffProfile> {
    const token = getStaffAuthToken();
    const API_BASE_URL =
      import.meta.env.VITE_API_URL || "http://localhost:3001";
    const response = await fetch(`${API_BASE_URL}/staff/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to get profile" }));
      throw new Error(error.message || "Failed to get profile");
    }

    const data = await response.json();

    // Handle both wrapped and direct response formats
    const profile = data && data.data ? data.data : data;

    // Transform wallet data to balances format expected by the component
    // Convert from kobo to NGN (divide by 100)
    if (profile && profile.wallet) {
      profile.balances = {
        savings: (profile.wallet.savings_balance || 0) / 100,
        pension: (profile.wallet.escrow_balance || 0) / 100,
        wallet: (profile.wallet.balance || 0) / 100,
        bonus: (profile.wallet.bonus_balance || 0) / 100,
      };
    }

    return profile;
  }

  /**
   * Get staff balances
   */
  async getBalances(): Promise<StaffBalances> {
    const token = getStaffAuthToken();
    const API_BASE_URL =
      import.meta.env.VITE_API_URL || "http://localhost:3000";
    const response = await fetch(`${API_BASE_URL}/staff/balances`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to get balances" }));
      throw new Error(error.message || "Failed to get balances");
    }

    const data = await response.json();

    // Handle wrapped response format
    const balances = data && data.data ? data.data : data;

    // Transform if needed to match StaffBalances interface
    // Convert from kobo to NGN (divide by 100)
    return {
      savings: (balances.savings_balance || balances.savings || 0) / 100,
      pension: (balances.escrow_balance || balances.pension || 0) / 100,
      wallet: (balances.balance || balances.wallet || 0) / 100,
      bonus: (balances.bonus_balance || balances.bonus || 0) / 100,
    };
  }

  /**
   * Upload NIN document
   */
  async uploadNIN(
    file: File
  ): Promise<{ ninDocumentUrl: string; message: string }> {
    const formData = new FormData();
    formData.append("nin", file);

    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("authToken="))
      ?.split("=")[1];

    const API_BASE_URL =
      import.meta.env.VITE_API_URL || "http://localhost:3000";
    const response = await fetch(`${API_BASE_URL}/staff/upload/nin`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to upload NIN" }));
      throw new Error(error.message || "Failed to upload NIN");
    }

    return response.json();
  }

  /**
   * Upload BVN document
   */
  async uploadBVN(
    file: File
  ): Promise<{ bvnDocumentUrl: string; message: string }> {
    const formData = new FormData();
    formData.append("bvn", file);

    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("authToken="))
      ?.split("=")[1];

    const API_BASE_URL =
      import.meta.env.VITE_API_URL || "http://localhost:3000";
    const response = await fetch(`${API_BASE_URL}/staff/upload/bvn`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to upload BVN" }));
      throw new Error(error.message || "Failed to upload BVN");
    }

    return response.json();
  }

  /**
   * Add BVN number
   */
  async addBVN(bvn: string): Promise<{ message: string }> {
    const token = getStaffAuthToken();
    const API_BASE_URL =
      import.meta.env.VITE_API_URL || "http://localhost:3000";
    const response = await fetch(`${API_BASE_URL}/staff/add-bvn`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ bvn }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to add BVN" }));
      throw new Error(error.message || "Failed to add BVN");
    }

    const data = await response.json();
    return data;
  }

  /**
   * Upload file to Cloudinary
   */
  async uploadToCloudinary(file: File): Promise<string> {
    const CLOUD_NAME = "ddbs7m7nt";
    const UPLOAD_PRESET = "presetOne";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to upload to Cloudinary");
    }

    const data = await response.json();
    return data.secure_url;
  }

  /**
   * Add NIN number with document URL
   */
  async addNIN(ninUrl: string): Promise<{ message: string }> {
    const token = getStaffAuthToken();
    const API_BASE_URL =
      import.meta.env.VITE_API_URL || "http://localhost:3000";
    const response = await fetch(`${API_BASE_URL}/staff/add-nin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ nin: ninUrl }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to add NIN" }));
      throw new Error(error.message || "Failed to add NIN");
    }

    const data = await response.json();
    return data;
  }

  /**
   * Upload NIN document to Cloudinary and add NIN
   */
  async uploadNINToCloudinary(file: File): Promise<{ message: string }> {
    try {
      // First upload to Cloudinary
      const cloudinaryUrl = await this.uploadToCloudinary(file);

      // Then add NIN with the Cloudinary URL
      return await this.addNIN(cloudinaryUrl);
    } catch (error) {
      throw new Error(
        `Failed to upload NIN: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Admin management endpoints - use /staff
  async getAllStaff(filters: StaffFilters = {}): Promise<StaffResponse> {
    const params = new URLSearchParams();
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.search) params.append("search", filters.search);
    if (filters.role) params.append("role", filters.role);
    if (filters.status) params.append("status", filters.status);
    if (filters.department) params.append("department", filters.department);
    if (filters.is_approved !== undefined)
      params.append("is_approved", filters.is_approved.toString());

    const queryString = params.toString();

    const response: any = await this.client.get<PaginatedStaffResponse>(
      `/staff?${queryString}`
    );

    return response.data || response;
  }

  /**
   * Get staff by ID (admin only)
   */
  async getStaffById(staffId: string): Promise<StaffProfile> {
    try {
      return await this.client.get<StaffProfile>(`/admins/staff/${staffId}`);
    } catch (error: any) {
      if (error.message?.includes("404")) {
        const response: any = await this.client.get<Staff>(`/staff/${staffId}`);
        return { ...(response.data || response), balances: undefined };
      }
      throw error;
    }
  }

  /**
   * Create new staff (admin only)
   */
  async createStaff(data: CreateStaffData): Promise<Staff> {
    try {
      return await this.client.post<Staff>("/admins/staff", data);
    } catch (error: any) {
      // Fallback to register endpoint if create fails
      if (error.message?.includes("404") || error.message?.includes("500")) {
        const registerData: RegisterStaffDto = {
          phone: data.phone,
          firstName: data.firstName,
          lastName: data.lastName,
          lga: "",
          role: data.role,
          department: "",
          monthlySalary: 0,
        };
        const response: any = await this.client.post<Staff>(
          "/staff/register",
          registerData
        );
        return response.data || response;
      }
      throw error;
    }
  }

  /**
   * Update staff (admin only)
   */
  async updateStaff(
    staffId: string,
    data: UpdateStaffData | UpdateStaffDto
  ): Promise<Staff> {
    try {
      return await this.client.patch<Staff>(`/admins/staff/${staffId}`, data);
    } catch (error: any) {
      if (error.message?.includes("404")) {
        const response: any = await this.client.patch<Staff>(
          `/staff/${staffId}`,
          data
        );
        return response.data || response;
      }
      throw error;
    }
  }

  /**
   * Activate staff (admin only)
   */
  async activateStaff(staffId: string): Promise<StaffActionResponse> {
    try {
      return await this.client.patch<StaffActionResponse>(
        `/admins/staff/${staffId}/activate`,
        {}
      );
    } catch (error: any) {
      if (error.message?.includes("404")) {
        const response: any = await this.client.post<Staff>(
          `/staff/${staffId}/reactivate`
        );
        return { message: "Staff activated", staff: response.data || response };
      }
      throw error;
    }
  }

  /**
   * Deactivate staff (admin only)
   */
  async deactivateStaff(
    staffId: string,
    reason?: string
  ): Promise<StaffActionResponse> {
    try {
      return await this.client.patch<StaffActionResponse>(
        `/admins/staff/${staffId}/deactivate`,
        {}
      );
    } catch (error: any) {
      if (error.message?.includes("404")) {
        const response: any = await this.client.post<Staff>(
          `/staff/${staffId}/deactivate`,
          { reason: reason || "Deactivated by admin" }
        );
        return {
          message: "Staff deactivated",
          staff: response.data || response,
        };
      }
      throw error;
    }
  }

  /**
   * Delete staff (admin only)
   */
  async deleteStaff(staffId: string): Promise<void> {
    return this.client.delete<void>(`/admins/staff/${staffId}`);
  }

  /**
   * Register new staff (legacy endpoint)
   */
  async registerStaff(data: RegisterStaffDto): Promise<Staff> {
    const response: any = await this.client.post<Staff>(
      "/staff/register",
      data
    );
    return response.data || response;
  }

  /**
   * Approve staff registration
   */
  async approveStaff(staffId: string, data: ApproveStaffDto): Promise<Staff> {
    const response: any = await this.client.post<Staff>(
      `/staff/${staffId}/approve`,
      data
    );
    return response.data || response;
  }

  /**
   * Reactivate staff (legacy endpoint)
   */
  async reactivateStaff(staffId: string): Promise<Staff> {
    const response: any = await this.client.post<Staff>(
      `/staff/${staffId}/reactivate`
    );
    return response.data || response;
  }

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(
    file: File
  ): Promise<{ url: string; publicId: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const response: any = await this.client.post(
      "/upload/profile-picture",
      formData
    );
    return response.data || response;
  }

  /**
   * Get loan types
   */
  async getLoanTypes(): Promise<LoanType[]> {
    const token = getStaffAuthToken();
    const API_BASE_URL =
      import.meta.env.VITE_API_URL || "http://localhost:3000";
    const response = await fetch(`${API_BASE_URL}/loans/types`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to get loan types" }));
      throw new Error(error.message || "Failed to get loan types");
    }

    const data = await response.json();
    return data && data.data ? data.data : data;
  }

  /**
   * Request a loan
   */
  async requestLoan(staffId: string, data: StaffLoanRequest): Promise<any> {
    const token = getStaffAuthToken();
    const API_BASE_URL =
      import.meta.env.VITE_API_URL || "http://localhost:3000";
    const response = await fetch(
      `${API_BASE_URL}/staff/${staffId}/request-loan`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to request loan" }));
      throw new Error(error.message || "Failed to request loan");
    }

    const result = await response.json();
    return result && result.data ? result.data : result;
  }

  /**
   * Get supported banks
   */
  async getSupportedBanks(): Promise<any[]> {
    const token = getStaffAuthToken();
    const API_BASE_URL =
      import.meta.env.VITE_API_URL || "http://localhost:3000";
    const response = await fetch(`${API_BASE_URL}/staff/wallet/banks`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to get banks" }));
      throw new Error(error.message || "Failed to get banks");
    }

    const result = await response.json();
    return result && result.data ? result.data : result;
  }

  /**
   * Verify bank account
   */
  async verifyBankAccount(data: {
    accountNumber: string;
    bankCode: string;
  }): Promise<any> {
    const token = getStaffAuthToken();
    const API_BASE_URL =
      import.meta.env.VITE_API_URL || "http://localhost:3000";
    const response = await fetch(
      `${API_BASE_URL}/staff/wallet/verify-account`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to verify account" }));
      throw new Error(error.message || "Failed to verify account");
    }

    const result = await response.json();
    return result && result.data ? result.data : result;
  }

  /**
   * Set withdrawal account
   */
  async setWithdrawalAccount(data: any): Promise<any> {
    const token = getStaffAuthToken();
    const API_BASE_URL =
      import.meta.env.VITE_API_URL || "http://localhost:3000";
    const response = await fetch(`${API_BASE_URL}/staff/wallet/set-account`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to set account" }));
      throw new Error(error.message || "Failed to set account");
    }

    const result = await response.json();
    return result && result.data ? result.data : result;
  }

  /**
   * Get saved withdrawal account
   */
  async getWithdrawalAccount(): Promise<any> {
    const token = getStaffAuthToken();
    const API_BASE_URL =
      import.meta.env.VITE_API_URL || "http://localhost:3000";
    const response = await fetch(`${API_BASE_URL}/staff/wallet/account`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to get account" }));
      throw new Error(error.message || "Failed to get account");
    }

    const result = await response.json();
    return result && result.data ? result.data : result;
  }

  /**
   * Request withdrawal
   */
  async requestWithdrawal(data: {
    amount: number;
    pin: string;
    bankName?: string;
    bankCode?: string;
    accountNumber?: string;
    accountName?: string;
    idempotencyKey?: string;
  }): Promise<any> {
    const token = getStaffAuthToken();
    const API_BASE_URL =
      import.meta.env.VITE_API_URL || "http://localhost:3000";
    const response = await fetch(`${API_BASE_URL}/staff/wallet/withdraw`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to request withdrawal" }));
      throw new Error(error.message || "Failed to request withdrawal");
    }

    const result = await response.json();
    return result && result.data ? result.data : result;
  }

  /**
   * Get pickup and delivery tasks assigned to logged-in staff
   */
  async getPickupDeliveryTasks(params?: {
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    pickups: StaffTaskPickup[];
    loanDeliveries: StaffTaskLoanDelivery[];
  }> {
    const token = getStaffAuthToken();
    const API_BASE_URL =
      import.meta.env.VITE_API_URL || "http://localhost:3000";

    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);

    const response = await fetch(
      `${API_BASE_URL}/ops/staff/tasks${query.toString() ? `?${query.toString()}` : ""}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to load staff tasks" }));
      throw new Error(error.message || "Failed to load staff tasks");
    }

    return response.json();
  }

  /**
   * Staff updates pickup details after field operation
   */
  async updatePickupTask(
    pickupId: string,
    data: {
      pickup_items?: StaffTaskPickupItem[];
      proposed_weight_kg?: number;
      proposed_price_per_kg?: number;
      staff_notes?: string;
    }
  ): Promise<StaffTaskPickup> {
    const token = getStaffAuthToken();
    const API_BASE_URL =
      import.meta.env.VITE_API_URL || "http://localhost:3000";
    const response = await fetch(
      `${API_BASE_URL}/ops/staff/pickups/${pickupId}/update`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to update pickup task" }));
      throw new Error(error.message || "Failed to update pickup task");
    }

    return response.json();
  }

  /**
   * Request PIN reset - sends OTP to phone
   */
  async requestPinReset(phone: string): Promise<{ message: string }> {
    const API_BASE_URL =
      import.meta.env.VITE_API_URL || "http://localhost:3000";
    const response = await fetch(`${API_BASE_URL}/staff/request-pin-reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to request PIN reset" }));
      throw new Error(error.message || "Failed to request PIN reset");
    }

    const result = await response.json();
    return result && result.data ? result.data : result;
  }

  /**
   * Verify PIN reset with OTP and set new PIN
   */
  async verifyPinReset(
    phone: string,
    otp: string,
    newPin: string
  ): Promise<{ message: string }> {
    const API_BASE_URL =
      import.meta.env.VITE_API_URL || "http://localhost:3000";
    const response = await fetch(`${API_BASE_URL}/staff/verify-pin-reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone, otp, newPin }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to verify PIN reset" }));
      throw new Error(error.message || "Failed to verify PIN reset");
    }

    const result = await response.json();
    return result && result.data ? result.data : result;
  }
}

export const staffApi = new StaffApi();

// Legacy function exports for backward compatibility
export const getAllStaff = async (
  params?: StaffFilters
): Promise<PaginatedStaffResponse> => {
  return staffApi.getAllStaff(params);
};

export const getStaffById = async (staffId: string): Promise<Staff> => {
  return staffApi.getStaffById(staffId);
};

export const registerStaff = async (data: RegisterStaffDto): Promise<Staff> => {
  return staffApi.registerStaff(data);
};

export const approveStaff = async (
  staffId: string,
  data: ApproveStaffDto
): Promise<Staff> => {
  return staffApi.approveStaff(staffId, data);
};

export const updateStaff = async (
  staffId: string,
  data: UpdateStaffDto
): Promise<Staff> => {
  return staffApi.updateStaff(staffId, data);
};

export const deactivateStaff = async (
  staffId: string,
  data: DeactivateStaffDto
): Promise<Staff> => {
  const response = await staffApi.deactivateStaff(staffId, data.reason);
  return response.staff;
};

export const reactivateStaff = async (staffId: string): Promise<Staff> => {
  return staffApi.reactivateStaff(staffId);
};

export const uploadProfilePicture = async (
  file: File
): Promise<{ url: string; publicId: string }> => {
  return staffApi.uploadProfilePicture(file);
};
