import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import StaffLoginPage from "./components/StaffLoginPage";
import { StaffPortal } from "./components/StaffPortal";
import { BalancesPage } from "./components/BalancesPage";
import { ProfilePage } from "./components/ProfilePage";
import { DocumentsPage } from "./components/DocumentsPage";
import { getStaffAuthToken, clearStaffAuthToken } from "./utils/cookies";
import { staffApi } from "./api/staff";
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
        try {
          // Validate token by making a test API call
          await staffApi.getProfile();
          setIsAuthenticated(true);
        } catch (err: any) {
          // Token is invalid, clear it
          clearStaffAuthToken();
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
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
    navigate("login", { replace: true });
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="login"
        element={<StaffLoginPage onLoginSuccess={handleLoginSuccess} />}
      />
      <Route
        path="dashboard"
        element={
          isAuthenticated ? (
            <StaffPortal onLogout={handleLogout} />
          ) : (
            <Navigate to="/staff/login" replace />
          )
        }
      />
      <Route
        path="balances"
        element={
          isAuthenticated ? (
            <BalancesPage onLogout={handleLogout} />
          ) : (
            <Navigate to="/staff/login" replace />
          )
        }
      />
      <Route
        path="profile"
        element={
          isAuthenticated ? (
            <ProfilePage onLogout={handleLogout} />
          ) : (
            <Navigate to="/staff/login" replace />
          )
        }
      />
      <Route
        path="documents"
        element={
          isAuthenticated ? (
            <DocumentsPage onLogout={handleLogout} />
          ) : (
            <Navigate to="/staff/login" replace />
          )
        }
      />
      <Route path="" element={<Navigate to="/staff/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/staff/dashboard" replace />} />
    </Routes>
  );
};

export default StaffApp;
