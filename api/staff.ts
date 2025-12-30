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
}

export interface StaffProfile extends Staff {
  balances?: StaffBalances;
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
      import.meta.env.VITE_API_URL || "http://localhost:3000";
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

    return response.json();
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

    return response.json();
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

  // Admin management endpoints - try both /staff and /admins/staff
  /**
   * Get all staff (admin only)
   */
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

    // Try /admins/staff first, fallback to /staff
    try {
      return await this.client.get<StaffResponse>(
        `/admins/staff?${queryString}`
      );
    } catch (error: any) {
      if (error.message?.includes("500") || error.message?.includes("404")) {
        const response: any = await this.client.get<PaginatedStaffResponse>(
          `/staff?${queryString}`
        );
        return response.data || response;
      }
      throw error;
    }
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
