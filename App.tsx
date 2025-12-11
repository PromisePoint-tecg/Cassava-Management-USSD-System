
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { FarmersDirectory } from './components/FarmersDirectory';
import { PurchasesView } from './components/PurchasesView';
import { LoansView } from './components/LoansView';
import { SettingsView } from './components/SettingsView';
import ProductsView from './components/ProductsView';
import LoginPage from './components/LoginPage';
import { TransactionsView } from './components/TransactionsView';
import { AdminManagementView } from './components/AdminManagementView';
import { USSDAnalyticsView } from './components/USSDAnalyticsView';
import { SuccessModal } from './components/SuccessModal';
import { settingsApi } from './api/settings';
import { SystemSettings } from './types';
import { Signal, Menu } from 'lucide-react';
import { getAuthToken } from './utils/cookies';
import { introspect, logout as apiLogout } from './api/auth';
import type { AdminInfo } from './api/auth';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState<{
    isOpen: boolean;
    message: string;
  }>({ isOpen: false, message: '' });
  
  // System Settings State - must be at top level, not inside conditional
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
          console.error('Token validation failed:', error);
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
      setCurrentView('dashboard');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
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
    setCurrentView('dashboard');
  };

  // Show loading state while checking authentication
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

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }


  const handleUpdateSettings = async (newSettings: SystemSettings) => {
    try {
      setSettingsLoading(true);
      const response = await settingsApi.updateSettings(newSettings);
      
      if (response.success) {
        setSettings(newSettings);
        setSettingsSuccess({
          isOpen: true,
          message: response.message || 'Settings saved successfully! Cassava pricing has been updated.'
        });
      } else {
        throw new Error(response.message || 'Failed to save settings');
      }
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      alert(`Failed to save settings: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setSettingsLoading(false);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'purchases':
        return <PurchasesView />;
      case 'loans':
        return (
          <LoansView />
        );
      case 'transactions':
        return (
          <TransactionsView />
        );
      case 'settings':
        return (
          <SettingsView
            settings={settings}
            onSave={handleUpdateSettings}
            loading={settingsLoading}
          />
        );
      case 'products':
        return <ProductsView />;
      case 'farmers':
        return <FarmersDirectory />;
      case 'ussd':
        return <USSDAnalyticsView />;
      case 'admins':
        return <AdminManagementView />;
      default:
        return <div className="p-10 text-center text-gray-500">Module under construction</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
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
              <div className="flex items-center text-gray-500 text-sm">
                <span className="hidden sm:inline">Branch:</span>
                <span className="font-semibold text-gray-800 ml-0 sm:ml-2">Ogun State HQ</span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center bg-emerald-50 text-emerald-700 px-2 sm:px-3 py-1.5 rounded-full text-xs font-bold">
                    <Signal className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">System Operational</span>
                    <span className="sm:hidden">Operational</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold border border-gray-300">
                    SA
                </div>
            </div>
        </header>
        <div className="p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </div>
      </main>

      {/* Settings Success Modal */}
      <SuccessModal
        isOpen={settingsSuccess.isOpen}
        onClose={() => setSettingsSuccess({ isOpen: false, message: '' })}
        title="Settings Saved!"
        message={settingsSuccess.message}
      />
    </div>
  );
};

export default App;
