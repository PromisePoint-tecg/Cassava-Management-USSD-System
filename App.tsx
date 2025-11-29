
import React, { useState, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { FarmersDirectory } from './components/FarmersDirectory';
import { PurchasesView } from './components/PurchasesView';
import { LoansView } from './components/LoansView';
import { SettingsView } from './components/SettingsView';
import ProductsView from './components/ProductsView';
import LoginPage from './components/LoginPage';
import { TransactionsView } from './components/TransactionsView';
import { SuccessModal } from './components/SuccessModal';
import { settingsApi } from './api/settings';
import {
  MOCK_FARMERS,
  MOCK_PURCHASES,
  MOCK_USSD_SESSIONS,
  PRICE_PER_KG
} from './constants';
import { Farmer, KPIData, Purchase, TransactionStatus, NetworkOperator, USSDSession, SystemSettings } from './types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Phone, RefreshCw, Signal, Pencil, X, Save, Menu, LogOut } from 'lucide-react';
import { getAuthToken } from './utils/cookies';
import { introspect, logout as apiLogout } from './api/auth';
import type { AdminInfo } from './api/auth';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>(MOCK_PURCHASES);
  const [farmers, setFarmers] = useState<Farmer[]>(MOCK_FARMERS);
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [ussdSessions] = useState<USSDSession[]>(MOCK_USSD_SESSIONS);
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

  // Derived State for KPIs - must be at top level before any returns
  const kpiData: KPIData = useMemo(() => {
    return {
      totalWeight: purchases.reduce((sum, p) => sum + p.weightKg, 0),
      totalPaid: purchases.reduce((sum, p) => sum + p.totalAmount, 0),
      activeFarmers: farmers.filter(f => f.status === 'Active').length,
      outstandingLoans: 0, // Will be loaded from real data in LoansView component
    };
  }, [purchases, farmers]);

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

  const handleAddPurchase = (farmerId: string, weight: number) => {
    const farmer = farmers.find(f => f.id === farmerId);
    if (!farmer) return;

    const newPurchase: Purchase = {
      id: `P${Math.floor(Math.random() * 10000)}`,
      farmerId,
      farmerName: farmer.name,
      weightKg: weight,
      pricePerKg: settings.pricePerKg,
      totalAmount: weight * settings.pricePerKg,
      status: TransactionStatus.SUCCESS,
      timestamp: new Date().toISOString(),
      recordedBy: 'Current User'
    };

    setPurchases([newPurchase, ...purchases]);
    
    // Simple alert to simulate toast notification
    alert(`Purchase Successful! ₦${newPurchase.totalAmount.toLocaleString()} sent to ${farmer.name}'s wallet.`);
  };

  const handleUpdateFarmer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFarmer) return;

    setFarmers(farmers.map(f => f.id === editingFarmer.id ? editingFarmer : f));
    setEditingFarmer(null);
    // Simple alert
    alert(`Farmer details for ${editingFarmer.name} updated.`);
  };

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
        return <Dashboard kpiData={kpiData} />;
      case 'purchases':
        return (
          <PurchasesView 
            purchases={purchases} 
            farmers={farmers} 
            onAddPurchase={handleAddPurchase} 
            pricePerKg={settings.pricePerKg} 
          />
        );
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
         const networkData = [
            { name: 'MTN', value: 45, color: '#FFC400' }, // MTN Yellow
            { name: 'Airtel', value: 30, color: '#FF0000' }, // Airtel Red
            { name: 'Glo', value: 15, color: '#00AA00' }, // Glo Green
            { name: '9Mobile', value: 10, color: '#005500' }, // 9Mobile Green
         ];

         return (
             <div className="space-y-6">
                 <h2 className="text-xl sm:text-2xl font-bold text-gray-800">USSD & Network Analytics</h2>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Traffic by Network Operator</h3>
                        <div className="h-56 sm:h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={networkData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {networkData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    
                    <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Recent Sessions</h3>
                        <div className="space-y-4">
                            {ussdSessions.map((session) => (
                                <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-blue-100 rounded-full mr-3">
                                            <Phone className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{session.msisdn}</p>
                                            <p className="text-xs text-gray-500">{session.network} • {session.action}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            session.status === 'Success' ? 'bg-green-100 text-green-700' : 
                                            session.status === 'Failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {session.status}
                                        </span>
                                        <p className="text-xs text-gray-400 mt-1">{session.duration}s</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                 </div>
             </div>
         );
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
                <span className="font-semibold text-gray-800 ml-0 sm:ml-2">Lagos North HQ</span>
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
