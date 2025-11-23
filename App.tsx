
import React, { useState, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { PurchasesView } from './components/PurchasesView';
import { LoansView } from './components/LoansView';
import { SettingsView } from './components/SettingsView';
import {
  MOCK_FARMERS,
  MOCK_LOANS,
  MOCK_PURCHASES,
  MOCK_USSD_SESSIONS,
  PRICE_PER_KG
} from './constants';
import { Farmer, KPIData, Purchase, TransactionStatus, NetworkOperator, USSDSession, Loan, LoanStatus, SystemSettings } from './types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Phone, RefreshCw, Signal, Pencil, X, Save } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [purchases, setPurchases] = useState<Purchase[]>(MOCK_PURCHASES);
  const [farmers, setFarmers] = useState<Farmer[]>(MOCK_FARMERS);
  const [loans, setLoans] = useState<Loan[]>(MOCK_LOANS);
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [ussdSessions] = useState<USSDSession[]>(MOCK_USSD_SESSIONS);

  // System Settings State
  const [settings, setSettings] = useState<SystemSettings>({
    pricePerKg: PRICE_PER_KG,
    transactionFeePercent: 1.5,
    smsNotifications: true,
    emailAlerts: true,
    autoApproveLoansUnder: 50000,
    maintenanceMode: false
  });

  // Derived State for KPIs
  const kpiData: KPIData = useMemo(() => {
    return {
      totalWeight: purchases.reduce((sum, p) => sum + p.weightKg, 0),
      totalPaid: purchases.reduce((sum, p) => sum + p.totalAmount, 0),
      activeFarmers: farmers.filter(f => f.status === 'Active').length,
      outstandingLoans: loans.reduce((sum, l) => sum + l.outstandingBalance, 0),
    };
  }, [purchases, farmers, loans]);

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

  const handleIssueLoan = (data: { farmerId: string; type: 'Input Credit' | 'Cash Loan'; principal: number; dueDate: string }) => {
    const farmer = farmers.find(f => f.id === data.farmerId);
    const newLoan: Loan = {
        id: `L${Math.floor(Math.random() * 10000)}`,
        farmerId: data.farmerId,
        farmerName: farmer ? farmer.name : 'Unknown',
        principal: data.principal,
        outstandingBalance: data.principal,
        type: data.type,
        status: LoanStatus.ACTIVE,
        dueDate: data.dueDate
    };
    setLoans([newLoan, ...loans]);
    alert(`Loan of ₦${newLoan.principal.toLocaleString()} issued to ${newLoan.farmerName}`);
  };

  const handleRepayLoan = (loanId: string, amount: number) => {
    setLoans(loans.map(loan => {
        if (loan.id === loanId) {
            const newBalance = Math.max(0, loan.outstandingBalance - amount);
            const newStatus = newBalance === 0 ? LoanStatus.PAID : loan.status;
            return { ...loan, outstandingBalance: newBalance, status: newStatus };
        }
        return loan;
    }));
    alert('Repayment recorded successfully');
  };

  const handleUpdateSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
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
          <LoansView 
            loans={loans} 
            farmers={farmers} 
            onIssueLoan={handleIssueLoan} 
            onRepayLoan={handleRepayLoan} 
          />
        );
      case 'settings':
        return (
          <SettingsView
            settings={settings}
            onSave={handleUpdateSettings}
          />
        );
      case 'farmers':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Farmers Directory</h2>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-700 font-medium uppercase text-xs">
                    <tr>
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">National ID</th>
                      <th className="px-6 py-4">Phone Number</th>
                      <th className="px-6 py-4">Wallet Number</th>
                      <th className="px-6 py-4">Branch</th>
                      <th className="px-6 py-4">Wallet Balance</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {farmers.map((farmer) => (
                      <tr key={farmer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono text-gray-500">{farmer.id}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{farmer.name}</td>
                        <td className="px-6 py-4 text-gray-500">{farmer.nationalId}</td>
                        <td className="px-6 py-4">{farmer.phone}</td>
                        <td className="px-6 py-4 font-mono text-gray-500">{farmer.walletNumber}</td>
                        <td className="px-6 py-4">{farmer.branch}</td>
                        <td className="px-6 py-4 text-emerald-700 font-bold">₦{farmer.walletBalance.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${farmer.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {farmer.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => setEditingFarmer(farmer)}
                            className="text-gray-400 hover:text-emerald-600 transition-colors"
                            title="Edit Farmer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Edit Farmer Modal */}
            {editingFarmer && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-emerald-50">
                    <h3 className="text-lg font-bold text-emerald-900">Edit Farmer Details</h3>
                    <button onClick={() => setEditingFarmer(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <form onSubmit={handleUpdateFarmer} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          className="w-full rounded-lg border-gray-300 border px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          value={editingFarmer.name}
                          onChange={(e) => setEditingFarmer({ ...editingFarmer, name: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                          type="text"
                          required
                          className="w-full rounded-lg border-gray-300 border px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          value={editingFarmer.phone}
                          onChange={(e) => setEditingFarmer({ ...editingFarmer, phone: e.target.value })}
                        />
                      </div>

                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                         <select
                           className="w-full rounded-lg border-gray-300 border px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                           value={editingFarmer.status}
                           onChange={(e) => setEditingFarmer({ ...editingFarmer, status: e.target.value as 'Active' | 'Inactive' })}
                         >
                           <option value="Active">Active</option>
                           <option value="Inactive">Inactive</option>
                         </select>
                      </div>

                      <div className="col-span-2">
                         <label className="block text-sm font-medium text-gray-700 mb-1">National ID</label>
                         <input
                           type="text"
                           required
                           className="w-full rounded-lg border-gray-300 border px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                           value={editingFarmer.nationalId}
                           onChange={(e) => setEditingFarmer({ ...editingFarmer, nationalId: e.target.value })}
                         />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Wallet Number</label>
                        <input
                          type="text"
                          required
                          className="w-full rounded-lg border-gray-300 border px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          value={editingFarmer.walletNumber}
                          onChange={(e) => setEditingFarmer({ ...editingFarmer, walletNumber: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                        <input
                          type="text"
                          required
                          className="w-full rounded-lg border-gray-300 border px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          value={editingFarmer.branch}
                          onChange={(e) => setEditingFarmer({ ...editingFarmer, branch: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingFarmer(null)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 flex items-center"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      case 'ussd':
         const networkData = [
            { name: 'MTN', value: 45, color: '#FFC400' }, // MTN Yellow
            { name: 'Airtel', value: 30, color: '#FF0000' }, // Airtel Red
            { name: 'Glo', value: 15, color: '#00AA00' }, // Glo Green
            { name: '9Mobile', value: 10, color: '#005500' }, // 9Mobile Green
         ];

         return (
             <div className="space-y-6">
                 <h2 className="text-2xl font-bold text-gray-800">USSD & Network Analytics</h2>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Traffic by Network Operator</h3>
                        <div className="h-64">
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
                    
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Sessions</h3>
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
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <main className="flex-1 ml-64">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
            <div className="flex items-center text-gray-500 text-sm">
                <span>Branch:</span>
                <span className="font-semibold text-gray-800 ml-2">Lagos North HQ</span>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold">
                    <Signal className="w-3 h-3 mr-1" />
                    System Operational
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold border border-gray-300">
                    SA
                </div>
            </div>
        </header>
        <div className="p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
