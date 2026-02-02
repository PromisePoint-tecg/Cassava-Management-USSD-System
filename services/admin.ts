import { getAuthToken } from "../utils/cookies";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Types and Enums
export enum AdminRole {
  SUPER_ADMIN = "super_admin",
  SUPPORT = "support",
  VERIFIER = "verifier",
  FINANCE = "finance",
}

export interface Admin {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: AdminRole;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface AdminFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: AdminRole | "";
  status?: "active" | "inactive" | "all";
}

export interface AdminsResponse {
  admins: Admin[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateAdminData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: AdminRole;
  permissions?: string[];
  createdBy?: string;
}

export interface ActivateAdminData {
  reason?: string;
}

export interface AdminActionResponse {
  message: string;
  admin: Admin;
}

export interface FundOrganizationWalletData {
  amount: number;
  reason?: string;
}

export interface FundOrganizationWalletResponse {
  message: string;
  wallet: {
    balance: number;
    totalDeposited: number;
  };
}

export interface OrganizationWallet {
  id: string;
  type: string;
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

class AdminAPI {
  private getHeaders() {
    const token = getAuthToken();
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getAllAdmins(filters: AdminFilters = {}): Promise<AdminsResponse> {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.search) params.append("search", filters.search);
    if (filters.role) params.append("role", filters.role);
    if (filters.status) params.append("status", filters.status);

    const response = await fetch(`${API_BASE_URL}/admins?${params}`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to fetch admins" }));
      throw new Error(error.message || "Failed to fetch admins");
    }

    return response.json();
  }

  async createAdmin(data: CreateAdminData): Promise<Admin> {
    const response = await fetch(`${API_BASE_URL}/admins`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to create admin" }));
      throw new Error(error.message || "Failed to create admin");
    }

    return response.json();
  }

  async activateAdmin(
    adminId: string,
    data: ActivateAdminData = {}
  ): Promise<AdminActionResponse> {
    const response = await fetch(`${API_BASE_URL}/admins/${adminId}/activate`, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to activate admin" }));
      throw new Error(error.message || "Failed to activate admin");
    }

    return response.json();
  }

  async deactivateAdmin(
    adminId: string,
    data: ActivateAdminData = {}
  ): Promise<AdminActionResponse> {
    const response = await fetch(
      `${API_BASE_URL}/admins/${adminId}/deactivate`,
      {
        method: "PATCH",
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to deactivate admin" }));
      throw new Error(error.message || "Failed to deactivate admin");
    }

    return response.json();
  }

  async deleteAdmin(adminId: string): Promise<Admin> {
    const response = await fetch(`${API_BASE_URL}/admins/${adminId}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to delete admin" }));
      throw new Error(error.message || "Failed to delete admin");
    }

    return response.json();
  }

  async getOrganizationWallet(): Promise<OrganizationWallet> {
    const response = await fetch(
      `${API_BASE_URL}/admins/wallet/organization`,
      {
        method: "GET",
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to get organization wallet" }));
      throw new Error(error.message || "Failed to get organization wallet");
    }

    const result = await response.json();
    // Handle both direct wallet response and wrapped response
    return result.data || result;
  }

  async fundOrganizationWallet(
    data: FundOrganizationWalletData
  ): Promise<FundOrganizationWalletResponse> {
    const response = await fetch(
      `${API_BASE_URL}/admins/wallet/organization/fund`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to fund organization wallet" }));
      throw new Error(error.message || "Failed to fund organization wallet");
    }

    const result = await response.json();
    return result.data || result;
  }

  // Role utility functions
  getRoleDisplayName(role: AdminRole): string {
    switch (role) {
      case AdminRole.SUPER_ADMIN:
        return "Super Admin";
      case AdminRole.SUPPORT:
        return "Support";
      case AdminRole.VERIFIER:
        return "Verifier";
      case AdminRole.FINANCE:
        return "Finance";
      default:
        return role;
    }
  }

  getRoleColor(role: AdminRole): string {
    switch (role) {
      case AdminRole.SUPER_ADMIN:
        return "bg-purple-100 text-purple-800";
      case AdminRole.SUPPORT:
        return "bg-blue-100 text-blue-800";
      case AdminRole.VERIFIER:
        return "bg-green-100 text-green-800";
      case AdminRole.FINANCE:
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }
}

export const adminApi = new AdminAPI();
