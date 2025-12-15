/**
 * Staff Management API functions
 */

import { apiClient } from './client';

export interface Staff {
  id: string;
  userId: string;
  phone: string;
  firstName: string;
  lastName: string;
  fullName: string;
  lga: string;
  role: string;
  department: string;
  employeeId: string;
  isActive: boolean;
  isApproved: boolean;
  dateApproved?: string;
  approvedBy?: string;
  monthlySalary: number;
  profilePicture?: string;
  totalSalaryPaid: number;
  pensionContributions: number;
  performanceRating: number;
  deactivationReason?: string;
  deactivatedAt?: string;
  wallet?: {
    balance: number;
    pensionBalance: number;
    totalEarned: number;
  };
  createdAt: string;
  updatedAt: string;
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
  approved_by?: string; // Optional - will be automatically set from authenticated user
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

export interface PaginatedStaffResponse {
  staff: Staff[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Get all staff with pagination and filters
 */
export const getAllStaff = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
  department?: string;
  is_approved?: boolean;
}): Promise<PaginatedStaffResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.role) queryParams.append('role', params.role);
  if (params?.department) queryParams.append('department', params.department);
  if (params?.is_approved !== undefined) queryParams.append('is_approved', params.is_approved.toString());

  const response: any = await apiClient.get<PaginatedStaffResponse>(`/staff?${queryParams.toString()}`);
  // Backend returns { data: { staff, total, page, ... } }
  return response.data || response;
};

/**
 * Get staff by ID
 */
export const getStaffById = async (staffId: string): Promise<Staff> => {
  const response: any = await apiClient.get<Staff>(`/staff/${staffId}`);
  return response.data || response;
};

/**
 * Register new staff
 */
export const registerStaff = async (data: RegisterStaffDto): Promise<Staff> => {
  const response: any = await apiClient.post<Staff>('/staff/register', data);
  return response.data || response;
};

/**
 * Approve staff registration
 */
export const approveStaff = async (staffId: string, data: ApproveStaffDto): Promise<Staff> => {
  const response: any = await apiClient.post<Staff>(`/staff/${staffId}/approve`, data);
  return response.data || response;
};

/**
 * Update staff information
 */
export const updateStaff = async (staffId: string, data: UpdateStaffDto): Promise<Staff> => {
  const response: any = await apiClient.patch<Staff>(`/staff/${staffId}`, data);
  return response.data || response;
};

/**
 * Deactivate staff
 */
export const deactivateStaff = async (staffId: string, data: DeactivateStaffDto): Promise<Staff> => {
  const response: any = await apiClient.post<Staff>(`/staff/${staffId}/deactivate`, data);
  return response.data || response;
};

/**
 * Reactivate staff
 */
export const reactivateStaff = async (staffId: string): Promise<Staff> => {
  const response: any = await apiClient.post<Staff>(`/staff/${staffId}/reactivate`);
  return response.data || response;
};

/**
 * Upload profile picture to Cloudinary
 */
export const uploadProfilePicture = async (file: File): Promise<{ url: string; publicId: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const response: any = await apiClient.upload('/upload/profile-picture', formData);
  return response.data || response;
};
