import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, cookieManager } from '../api';

interface AdminInfo {
  adminId: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  admin: AdminInfo | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const token = cookieManager.getToken();
      
      if (!token) {
        setIsAuthenticated(false);
        setAdmin(null);
        return false;
      }

      // Introspect token
      const response = await authAPI.introspect(token);
      
      if (response.active && response.adminId) {
        const adminInfo: AdminInfo = {
          adminId: response.adminId,
          email: response.email || '',
          role: response.role || '',
        };
        
        setAdmin(adminInfo);
        setIsAuthenticated(true);
        return true;
      } else {
        // Token invalid
        authAPI.logout();
        setIsAuthenticated(false);
        setAdmin(null);
        return false;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      authAPI.logout();
      setIsAuthenticated(false);
      setAdmin(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    const loginResponse = await authAPI.login({ email, password });
    await authAPI.introspect(loginResponse.accessToken);
    
    const adminInfo: AdminInfo = {
      adminId: loginResponse.adminId,
      email: loginResponse.email,
      role: loginResponse.role,
    };
    
    setAdmin(adminInfo);
    setIsAuthenticated(true);
  };

  const logout = () => {
    authAPI.logout();
    setIsAuthenticated(false);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        admin,
        isLoading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
