// API Configuration and Authentication Service
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  adminId: string;
  email: string;
  role: string;
}

interface AdminInfo {
  adminId: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

interface IntrospectResponse {
  active: boolean;
  adminId?: string;
  email?: string;
  role?: string;
  type?: string;
  iat?: number;
  exp?: number;
}

// Cookie management
const TOKEN_COOKIE = 'admin_token';
const ADMIN_INFO_COOKIE = 'admin_info';

export const cookieManager = {
  setToken(token: string, expiresIn: number) {
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn);
    document.cookie = `${TOKEN_COOKIE}=${token}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
  },

  getToken(): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + TOKEN_COOKIE + '=([^;]+)'));
    return match ? match[2] : null;
  },

  setAdminInfo(info: AdminInfo) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7); // 7 days
    document.cookie = `${ADMIN_INFO_COOKIE}=${encodeURIComponent(JSON.stringify(info))}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
  },

  getAdminInfo(): AdminInfo | null {
    const match = document.cookie.match(new RegExp('(^| )' + ADMIN_INFO_COOKIE + '=([^;]+)'));
    if (match) {
      try {
        return JSON.parse(decodeURIComponent(match[2]));
      } catch {
        return null;
      }
    }
    return null;
  },

  clearAll() {
    document.cookie = `${TOKEN_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${ADMIN_INFO_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
};

// API Service
export const authAPI = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/admins/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message || 'Invalid credentials');
    }

    const data = await response.json();
    
    // Store token in cookie
    cookieManager.setToken(data.accessToken, data.expiresIn);
    
    return data;
  },

  async introspect(token?: string): Promise<IntrospectResponse> {
    const authToken = token || cookieManager.getToken();
    
    if (!authToken) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/admins/introspect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Token validation failed');
    }

    const data = await response.json();
    
    // Store admin info if token is active
    if (data.active && data.adminId) {
      cookieManager.setAdminInfo({
        adminId: data.adminId,
        email: data.email,
        role: data.role,
      });
    }
    
    return data;
  },

  logout() {
    cookieManager.clearAll();
  }
};
