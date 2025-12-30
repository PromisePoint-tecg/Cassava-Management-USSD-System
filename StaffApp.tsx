import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import StaffLoginPage from "./components/StaffLoginPage";
import { StaffPortal } from "./components/StaffPortal";
import { getStaffAuthToken, clearStaffAuthToken } from "./utils/cookies";
import type { Staff } from "./api/staff";

const StaffApp: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [staffInfo, setStaffInfo] = useState<Staff | null>(null);
  const navigate = useNavigate();

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getStaffAuthToken();
      if (token) {
        // For staff, we'll assume the token is valid if present
        // In a real app, you might want to validate the token
        setIsAuthenticated(true);
      }
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = (staff: Staff) => {
    setStaffInfo(staff);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    clearStaffAuthToken();
    setIsAuthenticated(false);
    setStaffInfo(null);
    navigate("login");
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="login"
        element={
          isAuthenticated ? (
            <Navigate to="dashboard" replace />
          ) : (
            <StaffLoginPage onLoginSuccess={handleLoginSuccess} />
          )
        }
      />
      <Route
        path="*"
        element={
          isAuthenticated ? (
            <StaffPortal onLogout={handleLogout} />
          ) : (
            <Navigate to="login" replace />
          )
        }
      />
      <Route path="" element={<Navigate to="login" replace />} />
    </Routes>
  );
};

export default StaffApp;
