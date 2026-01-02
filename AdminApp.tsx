import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { FarmersDirectory } from "./components/FarmersDirectory";
import { PurchasesView } from "./components/PurchasesView";
import { LoansView } from "./components/LoansView";
import { SettingsView } from "./components/SettingsView";
import ProductsView from "./components/ProductsView";
import LoginPage from "./components/LoginPage";
import { TransactionsView } from "./components/TransactionsView";
import { AdminManagementView } from "./components/AdminManagementView";
import StaffManagementView from "./components/StaffManagementView";
import { USSDAnalyticsView } from "./components/USSDAnalyticsView";
import PayrollManagementView from "./components/PayrollManagementView";
import PensionManagementView from "./components/PensionManagementView";
import { AdminProfilePage } from "./components/AdminProfilePage";
import { settingsApi } from "./api/settings";
import { SystemSettings } from "./types";
import { Signal, Menu } from "lucide-react";
import { getAuthToken } from "./utils/cookies";
import { introspect, logout as apiLogout } from "./api/auth";
import type { AdminInfo } from "./api/auth";
import SuccessModal from "./components/SuccessModal";

const AdminApp: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
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
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, []);

  const handleLoginSuccess = (admin: AdminInfo) => {
    setAdminInfo(admin);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    apiLogout();
    setAdminInfo(null);
    setIsAuthenticated(false);
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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />
      <main className="flex-1 lg:ml-64">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center bg-emerald-50 text-emerald-700 px-2 sm:px-3 py-1.5 rounded-full text-xs font-bold">
              <Signal className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">System Operational</span>
              <span className="sm:hidden">Operational</span>
            </div>
            <button
              onClick={() => navigate("/profile")}
              className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold border border-gray-300 hover:bg-gray-300 transition-colors cursor-pointer"
              title="View Profile"
            >
              SA
            </button>
          </div>
        </header>
        <div className="p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/farmers" element={<FarmersDirectory />} />
            <Route path="/products" element={<ProductsView />} />
            <Route path="/purchases" element={<PurchasesView />} />
            <Route path="/loans" element={<LoansView />} />
            <Route path="/transactions" element={<TransactionsView />} />
            <Route path="/admins" element={<AdminManagementView />} />
            <Route path="/staff" element={<StaffManagementView />} />
            <Route path="/payroll" element={<PayrollManagementView />} />
            <Route path="/pension" element={<PensionManagementView />} />
            <Route path="/ussd" element={<USSDAnalyticsView />} />
            <Route path="/profile" element={<AdminProfilePage />} />
            <Route
              path="/settings"
              element={
                <SettingsView
                  settings={settings}
                  onSave={handleUpdateSettings}
                  loading={settingsLoading}
                />
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
