import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Dashboard } from "./components/Dashboard";
import { FarmersDirectory } from "./components/FarmersDirectory";
import { StudentFarmersDirectory } from "./components/StudentFarmersDirectory";
import { PurchasesView } from "./components/PurchasesView";
import { LoansView } from "./components/LoansView";
import { PickupDeliveryView } from "./components/PickupDeliveryView";
import { SettingsView } from "./components/SettingsView";
import ProductsView from "./components/ProductsView";
import LoginPage from "./components/LoginPage";
import { TransactionsView } from "./components/TransactionsView";
import { AdminManagementView } from "./components/AdminManagementView";
import StaffManagementView from "./components/StaffManagementView";
import { USSDAnalyticsView } from "./components/USSDAnalyticsView";
import PayrollManagementView from "./components/PayrollManagementView";
import PensionManagementView from "./components/PensionManagementView";
import BonusManagementView from "./components/BonusManagementView";
import FinanceView from "./components/FinanceView";
import { AdminProfilePage } from "./components/AdminProfilePage";
import AdminForgotPassword from "./components/AdminForgotPassword";
import { settingsApi } from "./services/settings";
import { SystemSettings } from "./types";
import { Signal, Menu } from "lucide-react";
import { getAuthToken } from "./utils/cookies";
import {
  introspect,
  logout as apiLogout,
  getProfile,
  AdminProfile,
} from "./services/auth";
import type { AdminInfo } from "./services/auth";
import SuccessModal from "./components/SuccessModal";
import { LeafLoader } from "./components/Loader";

const AdminApp: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState<{
    isOpen: boolean;
    message: string;
  }>({ isOpen: false, message: "" });

  // System Settings State
  const [settings, setSettings] = useState<SystemSettings>({
    cassavaPricePerKg: 500,
    cassavaPricePerTon: 450000,
  });

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();

      if (token) {
        try {
          const admin = await introspect();
          setAdminInfo(admin);
          setIsAuthenticated(true);

          // Fetch profile for avatar initials
          try {
            const profile = await getProfile();
            setAdminProfile(profile);
          } catch (profileError) {
            console.warn("Failed to fetch profile:", profileError);
          }
        } catch (error) {
          console.error("Token validation failed:", error);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }

      setIsCheckingAuth(false);
    };

    checkAuth();

    // Listen for unauthorized events (401 errors)
    const handleUnauthorized = () => {
      setIsAuthenticated(false);
      setAdminInfo(null);
      setAdminProfile(null);
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, []);

  const handleLoginSuccess = async (admin: AdminInfo) => {
    setAdminInfo(admin);
    setIsAuthenticated(true);

    // Fetch profile for avatar initials
    try {
      const profile = await getProfile();
      setAdminProfile(profile);
    } catch (profileError) {
      console.warn("Failed to fetch profile:", profileError);
    }
  };

  const handleLogout = () => {
    apiLogout();
    setAdminInfo(null);
    setAdminProfile(null);
    setIsAuthenticated(false);
  };

  // Generate initials from profile
  const getInitials = () => {
    if (adminProfile?.firstName && adminProfile?.lastName) {
      return `${adminProfile.firstName.charAt(0)}${adminProfile.lastName.charAt(
        0
      )}`.toUpperCase();
    }
    if (adminInfo?.email) {
      return adminInfo.email.charAt(0).toUpperCase();
    }
    return "A"; // Default fallback
  };

  const handleUpdateSettings = async (newSettings: SystemSettings) => {
    try {
      setSettingsLoading(true);
      const response = await settingsApi.updateSettings(newSettings);

      if (response.success) {
        setSettings(newSettings);
        setSettingsSuccess({
          isOpen: true,
          message:
            response.message ||
            "Settings saved successfully! Cassava pricing has been updated.",
        });
      } else {
        throw new Error(response.message || "Failed to save settings");
      }
    } catch (error: any) {
      console.error("Failed to save settings:", error);
      alert(
        `Failed to save settings: ${error.message || "Unknown error occurred"}`
      );
    } finally {
      setSettingsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <LeafLoader />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (showForgotPassword) {
      return (
        <AdminForgotPassword
          onBackToLogin={() => setShowForgotPassword(false)}
        />
      );
    }
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onForgotPassword={() => setShowForgotPassword(true)}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        userRole={adminInfo?.role} // Pass the user role to Sidebar
      />
      <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <header className="bg-slate-50 h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-sm text-gray-600">
              Role: <strong className="text-gray-800">{adminInfo?.role || 'Unknown'}</strong>
            </div>
            <button
              onClick={() => navigate("/profile")}
              className="w-9 h-9 rounded-full bg-[#066f48] flex items-center justify-center text-white font-semibold hover:bg-[#055a3a] transition-colors cursor-pointer text-sm"
              title="View Profile"
            >
              {getInitials()}
            </button>
          </div>
        </header>
        <div className="p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            
            {/* Dashboard - All roles have access */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute userRole={adminInfo?.role} requiredPermissions={["dashboard"]}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Farmers - Support, Verifier, Super Admin */}
            <Route 
              path="/farmers" 
              element={
                <ProtectedRoute userRole={adminInfo?.role} requiredPermissions={["farmers"]}>
                  <FarmersDirectory />
                </ProtectedRoute>
              } 
            />

            {/* Student Farmers - Support, Verifier, Super Admin */}
            <Route
              path="/student-farmers"
              element={
                <ProtectedRoute
                  userRole={adminInfo?.role}
                  requiredPermissions={["student-farmers"]}
                >
                  <StudentFarmersDirectory />
                </ProtectedRoute>
              }
            />
            
            {/* Products - Finance, Support, Verifier, Super Admin */}
            <Route 
              path="/products" 
              element={
                <ProtectedRoute userRole={adminInfo?.role} requiredPermissions={["products"]}>
                  <ProductsView />
                </ProtectedRoute>
              } 
            />
            
            {/* Purchases - Finance, Support, Verifier, Super Admin */}
            <Route 
              path="/purchases" 
              element={
                <ProtectedRoute userRole={adminInfo?.role} requiredPermissions={["purchases"]}>
                  <PurchasesView />
                </ProtectedRoute>
              } 
            />
            
            {/* Loans - Verifier, Super Admin */}
            <Route 
              path="/loans" 
              element={
                <ProtectedRoute userRole={adminInfo?.role} requiredPermissions={["loans"]}>
                  <LoansView />
                </ProtectedRoute>
              } 
            />

            {/* Pickup & Delivery - Verifier, Support, Super Admin */}
            <Route
              path="/pickup-delivery"
              element={
                <ProtectedRoute
                  userRole={adminInfo?.role}
                  requiredPermissions={["pickup-delivery"]}
                >
                  <PickupDeliveryView />
                </ProtectedRoute>
              }
            />
            
            {/* Transactions - Finance, Super Admin */}
            <Route 
              path="/transactions" 
              element={
                <ProtectedRoute userRole={adminInfo?.role} requiredPermissions={["transactions"]}>
                  <TransactionsView />
                </ProtectedRoute>
              } 
            />

            {/* Finance Ops - Finance, Super Admin */}
            <Route
              path="/finance"
              element={
                <ProtectedRoute userRole={adminInfo?.role} requiredPermissions={["finance"]}>
                  <FinanceView />
                </ProtectedRoute>
              }
            />
            
            {/* Admins - Super Admin only */}
            <Route 
              path="/admins" 
              element={
                <ProtectedRoute userRole={adminInfo?.role} requiredPermissions={["admins"]}>
                  <AdminManagementView />
                </ProtectedRoute>
              } 
            />
            
            {/* Staff Management - Finance, Super Admin */}
            <Route 
              path="/staff-management" 
              element={
                <ProtectedRoute userRole={adminInfo?.role} requiredPermissions={["staff-management"]}>
                  <StaffManagementView adminId={adminInfo?.id || ""} />
                </ProtectedRoute>
              } 
            />
            
            {/* Payroll - Finance, Super Admin */}
            <Route 
              path="/payroll" 
              element={
                <ProtectedRoute userRole={adminInfo?.role} requiredPermissions={["payroll"]}>
                  <PayrollManagementView />
                </ProtectedRoute>
              } 
            />
            
            {/* Bonus - Finance, Super Admin */}
            <Route 
              path="/bonus" 
              element={
                <ProtectedRoute userRole={adminInfo?.role} requiredPermissions={["bonus"]}>
                  <BonusManagementView />
                </ProtectedRoute>
              } 
            />
            
            {/* Pension - Finance, Super Admin */}
            <Route 
              path="/pension" 
              element={
                <ProtectedRoute userRole={adminInfo?.role} requiredPermissions={["pension"]}>
                  <PensionManagementView />
                </ProtectedRoute>
              } 
            />
            
            {/* USSD - Support, Super Admin */}
            <Route 
              path="/ussd" 
              element={
                <ProtectedRoute userRole={adminInfo?.role} requiredPermissions={["ussd"]}>
                  <USSDAnalyticsView />
                </ProtectedRoute>
              } 
            />
            
            {/* Profile - All roles can access their own profile */}
            <Route path="/profile" element={<AdminProfilePage />} />
            
            {/* Settings - Super Admin only */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute userRole={adminInfo?.role} requiredPermissions={["settings"]}>
                  <SettingsView
                    settings={settings}
                    onSave={handleUpdateSettings}
                    loading={settingsLoading}
                  />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </main>

      {/* Settings Success Modal */}
      <SuccessModal
        isOpen={settingsSuccess.isOpen}
        onClose={() => setSettingsSuccess({ isOpen: false, message: "" })}
        title="Settings Saved!"
        message={settingsSuccess.message}
      />
    </div>
  );
};

export default AdminApp;
