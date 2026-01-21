import { apiClient } from './client';

export interface Product {
  id: string;
  productName: string;
  priceForFarmers: number;
  priceForMarket: number;
  size: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: string;
  sortBy?: string;
  sortOrder?: string;
}

export const productsApi = {
  getAll: async (filters: ProductFilters = {}): Promise<PaginatedProductsResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    const queryString = params.toString();
    const url = `/admins/products${queryString ? `?${queryString}` : ''}`;
    const res = await apiClient.get<PaginatedProductsResponse>(url);
    return res;
  },

  create: async (data: { productName: string; priceForFarmers: number; priceForMarket: number; size: string }) => {
    const res = await apiClient.post<Product>(`/admins/products`, data);
    return res;
  },

  getById: async (id: string): Promise<Product> => {
    const res = await apiClient.get<Product>(`/admins/products/${id}`);
    return res;
  },

  update: async (id: string, data: Partial<Product>) => {
    const res = await apiClient.patch<Product>(`/admins/products/${id}`, data);
    return res;
  },

  updateStatus: async (id: string, isActive: boolean) => {
    const res = await apiClient.patch<{ message: string }>(`/admins/products/${id}/status`, { isActive });
    return res;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/admins/products/${id}`);
    return res;
  },
};
