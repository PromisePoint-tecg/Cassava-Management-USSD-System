import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Scale, Wallet, Users, AlertCircle, RefreshCw, TrendingUp, TrendingDown, DollarSign, Percent, FileDown } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { purchasesApi, PurchaseKPIs, PurchaseItem } from '../services/purchases';
import { loansApi, LoanKPIs } from '../services/loans';
import { farmersApi } from '../services/farmers';
import { transactionsApi, TransactionStats, Transaction } from '../services/transactions';
import { adminApi, DashboardKpisResponse, DashboardKpiUnit } from '../services/admin';
import LeafInlineLoader from './Loader';



interface DashboardProps {
  userRole?: string;
}

// Role-based card visibility mapping
const ROLE_CARD_PERMISSIONS = {
  super_admin: {
    totalCollected: true,
    totalPaid: true,
    activeFarmers: true,
    outstandingLoans: true,
    averagePurchaseSize: true,
    loanDefaultRate: true,
    totalDisbursed: true,
    totalTransactions: true,
    purchaseVolumeChart: true,
    transactionBreakdown: true,
    recentPurchases: true,
    recentTransactions: true,
  },
  finance: {
    totalCollected: false,
    totalPaid: true,
    activeFarmers: false,
    outstandingLoans: true,
    averagePurchaseSize: false,
    loanDefaultRate: true,
    totalDisbursed: true,
    totalTransactions: true,
    purchaseVolumeChart: false,
    transactionBreakdown: true,
    recentPurchases: false,
    recentTransactions: true,
  },
  support: {
    totalCollected: true,
    totalPaid: true,
    activeFarmers: true,
    outstandingLoans: false,
    averagePurchaseSize: true,
    loanDefaultRate: false,
    totalDisbursed: false,
    totalTransactions: false,
    purchaseVolumeChart: true,
    transactionBreakdown: false,
    recentPurchases: true,
    recentTransactions: false,
  },
  verifier: {
    totalCollected: true,
    totalPaid: true,
    activeFarmers: true,
    outstandingLoans: true,
    averagePurchaseSize: true,
    loanDefaultRate: true,
    totalDisbursed: false,
    totalTransactions: false,
    purchaseVolumeChart: true,
    transactionBreakdown: false,
    recentPurchases: true,
    recentTransactions: false,
  },
};

interface DashboardData {
  purchaseKPIs: PurchaseKPIs | null;
  loanKPIs: LoanKPIs | null;
  dashboardKPIs: DashboardKpisResponse | null;
  activeFarmers: number;
  totalFarmers: number;
  transactionStats: TransactionStats | null;
  recentPurchases: PurchaseItem[];
  recentTransactions: Transaction[];
  loading: boolean;
  error: string | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ userRole = 'super_admin' }) => {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<DashboardData>({
    purchaseKPIs: null,
    loanKPIs: null,
    dashboardKPIs: null,
    activeFarmers: 0,
    totalFarmers: 0,
    transactionStats: null,
    recentPurchases: [],
    recentTransactions: [],
    loading: true,
    error: null,
  });
  // Get permissions for current role
const permissions = ROLE_CARD_PERMISSIONS[userRole.toLowerCase() as keyof typeof ROLE_CARD_PERMISSIONS] || ROLE_CARD_PERMISSIONS.super_admin;

  const loadDashboardData = async () => {
    setData(prev => ({ ...prev, loading: true, error: null }));
    try {
      const [purchaseKPIs, loanKPIs, farmersResponse, transactionStats, recentPurchases, recentTransactions, dashboardKPIs] = await Promise.allSettled([
        purchasesApi.getPurchaseKPIs(),
        loansApi.getLoanKPIs(),
        farmersApi.getAllFarmers({ page: 1, limit: 1, status: 'active' }),
        transactionsApi.getTransactionStats(),
        purchasesApi.getAllPurchases({ 
          page: 1, 
          limit: 100, 
          sortBy: 'createdAt', 
          sortOrder: 'desc'
        }),
        transactionsApi.getAllTransactions({ 
          page: 1, 
          limit: 10, 
          sortBy: 'createdAt', 
          sortOrder: 'desc' 
        }),
        adminApi.getDashboardKPIs(),
      ]);

      const activeFarmers = farmersResponse.status === 'fulfilled' ? farmersResponse.value.total : 0;
      let totalFarmers = activeFarmers;
      try {
        const totalFarmersResponse = await farmersApi.getAllFarmers({ page: 1, limit: 1 });
        totalFarmers = totalFarmersResponse?.total || activeFarmers;
      } catch (err) {
        console.warn('Could not fetch total farmers count:', err);
      }

      setData({
        purchaseKPIs: purchaseKPIs.status === 'fulfilled' ? purchaseKPIs.value : null,
        loanKPIs: loanKPIs.status === 'fulfilled' ? loanKPIs.value : null,
        dashboardKPIs: dashboardKPIs.status === 'fulfilled' ? dashboardKPIs.value : null,
        activeFarmers,
        totalFarmers,
        transactionStats: transactionStats.status === 'fulfilled' ? transactionStats.value : null,
        recentPurchases: recentPurchases.status === 'fulfilled' ? recentPurchases.value.purchases.slice(0, 5) : [],
        recentTransactions: recentTransactions.status === 'fulfilled' ? recentTransactions.value.transactions.slice(0, 5) : [],
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard data',
      }));
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const chartData = useMemo(() => {
    if (!data.recentPurchases || data.recentPurchases.length === 0) {
      return [];
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentPurchases = data.recentPurchases.filter(purchase => {
      try {
        const purchaseDate = new Date(purchase.createdAt);
        return !isNaN(purchaseDate.getTime()) && purchaseDate >= sevenDaysAgo;
      } catch {
        return false;
      }
    });

    if (recentPurchases.length === 0) {
      return [];
    }

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayData: { [key: string]: number } = {};
    
    days.forEach(day => {
      dayData[day] = 0;
    });

    recentPurchases.forEach(purchase => {
      try {
        const date = new Date(purchase.createdAt);
        if (!isNaN(date.getTime())) {
          const dayName = days[date.getDay()];
          if (dayData[dayName] !== undefined) {
            dayData[dayName] += purchase.weightKg || 0;
          }
        }
      } catch (e) {
        // Skip invalid dates
      }
    });

    return days.map(day => ({
      name: day,
      kg: Math.round(dayData[day] || 0),
    }));
  }, [data.recentPurchases]);

  const transactionBreakdown = useMemo(() => {
    if (!data.transactionStats) return [];
    return [
      { name: 'Wallet', value: data.transactionStats.byType?.wallet || 0, color: '#066f48' },
      { name: 'Loans', value: data.transactionStats.byType?.loan || 0, color: '#3b82f6' },
      { name: 'Purchases', value: data.transactionStats.byType?.purchase || 0, color: '#f59e0b' },
    ].filter(item => item.value > 0);
  }, [data.transactionStats]);

  const totalWeight = data.purchaseKPIs?.totalWeight || 0;
  const totalPaid = data.purchaseKPIs?.totalAmountSpent || 0;
  const outstandingLoans = data.loanKPIs?.totalOutstanding || 0;
  const averagePurchaseSize = data.purchaseKPIs?.totalPurchases 
    ? (data.purchaseKPIs.totalWeight / data.purchaseKPIs.totalPurchases) 
    : 0;
  const defaultRate = data.loanKPIs?.defaultRate || 0;
  const totalDisbursed = data.loanKPIs?.totalDisbursed || 0;
  const totalTransactions = data.transactionStats?.totalAmount || 0;
  const kpiRows = data.dashboardKPIs?.kpiTable?.rows ?? [];

  const exportDashboardPdf = () => {
    if (!dashboardRef.current) {
      return;
    }

    const html = dashboardRef.current.outerHTML;
    const styleTags = Array.from(
      document.querySelectorAll('style, link[rel="stylesheet"]'),
    )
      .map((el) => el.outerHTML)
      .join('\n');

    const printWindow = window.open('', '_blank', 'width=1280,height=900');
    if (!printWindow) {
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Dashboard Export</title>
          ${styleTags}
          <style>
            body { background: white; margin: 0; padding: 16px; }
            .no-print { display: none !important; }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 700);
  };

  if (data.loading) {
    return <LeafInlineLoader />;
  }

  if (data.error) {
    return (
      <ErrorMessage
        title="Error Loading Dashboard"
        message={data.error}
        onRetry={loadDashboardData}
      />
    );
  }

  if (totalWeight === 0 && totalPaid === 0 && data.activeFarmers === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-800">No activity yet</h3>
        <p className="text-sm text-gray-500 mt-2">No purchases or farmers have been recorded. Create products and record purchases to populate the dashboard.</p>
      </div>
    );
  }

  return (
    <div ref={dashboardRef} className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
            <p className="text-sm text-gray-600 mt-0.5">Real-time analytics and insights</p>
          </div>
          <div className="flex items-center gap-2 no-print">
            <button
              onClick={loadDashboardData}
              className="flex items-center px-4 py-2.5 text-sm text-gray-600 hover:text-[#066f48] bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-all duration-200"
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              <span>Refresh</span>
            </button>
            <button
              onClick={exportDashboardPdf}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:text-[#066f48] bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-all duration-200"
              title="Export full dashboard as PDF"
            >
              <FileDown className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {permissions.totalCollected && (
        <StatsCard
          title="Total Collected"
          value={`${totalWeight.toLocaleString()} kg`}
          trend={`${data.purchaseKPIs?.completedPurchases || 0} completed purchases`}
          trendUp={true}
          icon={Scale}
          colorClass="bg-blue-600"
        />
        )}
        {permissions.totalPaid && (
        <StatsCard
          title="Total Paid"
          value={`₦${totalPaid.toLocaleString()}`}
          trend={`${data.purchaseKPIs?.totalPurchases || 0} total purchases`}
          trendUp={true}
          icon={Wallet}
          colorClass="bg-emerald-600"
        />
        )}
        {permissions.activeFarmers && (
        <StatsCard
          title="Active Farmers"
          value={data.activeFarmers.toLocaleString()}
          trend={`${data.totalFarmers} total farmers`}
          trendUp={true}
          icon={Users}
          colorClass="bg-purple-600"
        />
        )}
        {permissions.outstandingLoans && (
        <StatsCard
          title="Outstanding Loans"
          value={`₦${outstandingLoans.toLocaleString()}`}
          trend={`${data.loanKPIs?.defaultedLoans || 0} defaulted`}
          trendUp={false}
          icon={AlertCircle}
          colorClass="bg-orange-600"
        />
        )}
      </div>

      {/* Secondary Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {permissions.averagePurchaseSize && (
        <StatsCard
          title="Average Purchase Size"
          value={`${Math.round(averagePurchaseSize).toLocaleString()} kg`}
          trend={`${data.purchaseKPIs?.averagePrice ? `₦${Math.round(data.purchaseKPIs.averagePrice)}/kg avg` : 'N/A'}`}
          trendUp={true}
          icon={TrendingUp}
          colorClass="bg-indigo-600"
        />
        )}
        {permissions.loanDefaultRate && (
        <StatsCard
          title="Loan Default Rate"
          value={`${defaultRate.toFixed(1)}%`}
          trend={`${data.loanKPIs?.defaultedLoans || 0} defaulted loans`}
          trendUp={defaultRate > 5}
          icon={Percent}
          colorClass={defaultRate > 5 ? "bg-red-600" : "bg-yellow-600"}
        />
        )}
        {permissions.totalDisbursed && (
        <StatsCard
          title="Total Disbursed"
          value={`₦${totalDisbursed.toLocaleString()}`}
          trend={`${data.loanKPIs?.activeLoans || 0} active loans`}
          trendUp={true}
          icon={DollarSign}
          colorClass="bg-teal-600"
        />
        )}
        {permissions.totalTransactions && (
        <StatsCard
          title="Total Transactions"
          value={`₦${totalTransactions.toLocaleString()}`}
          trend={`${data.transactionStats?.completedTransactions || 0} completed`}
          trendUp={true}
          icon={TrendingUp}
          colorClass="bg-pink-600"
        />
        )}
      </div>

      {/* KPI Table */}
      {kpiRows.length ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-800">KPI Summary</h3>
            <p className="text-xs text-gray-500">
              {data.dashboardKPIs?.kpiTable.period}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {kpiRows.map((row, index) => (
              <div
                key={`${row.kpi}-${index}`}
                className="rounded-xl border border-gray-200 bg-gradient-to-b from-[#f8faf9] to-white p-4 hover:shadow-sm transition-all"
              >
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-600">
                  {formatKpiLabel(row.kpi, row.unit)}
                </p>
                <p className="mt-2 text-2xl font-extrabold text-[#066f48] leading-tight">
                  {formatKpiValue(row.actual, row.unit)}
                </p>
                <span className="inline-block mt-3 px-2 py-1 text-[11px] font-semibold rounded-md border border-emerald-200 bg-emerald-50 text-[#066f48]">
                  {getKpiUnitLabel(row.unit)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Purchase Volume Chart */}
        {permissions.purchaseVolumeChart && (
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Purchase Volume (Last 7 Days)</h3>
          <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorKg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#066f48" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#066f48" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.3} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      borderRadius: '8px', 
                      border: '1px solid #e5e7eb', 
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' 
                    }}
                    formatter={(value: number) => [`${value.toLocaleString()} kg`, 'Weight']}
                  />
                  <Area type="monotone" dataKey="kg" stroke="#066f48" strokeWidth={3} fillOpacity={1} fill="url(#colorKg)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                No purchase data available for the last 7 days
              </div>
            )}
          </div>
        </div>
        )}

        {/* Transaction Breakdown */}
        {permissions.transactionBreakdown && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Transaction Breakdown</h3>
          <div className="h-64 w-full">
            {transactionBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={transactionBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {transactionBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value} transactions`, 'Count']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      borderRadius: '8px', 
                      border: '1px solid #e5e7eb', 
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' 
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                No transaction data available
              </div>
            )}
          </div>
        </div>
        )}
      </div>
      

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Purchases */}
        {permissions.recentPurchases && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Recent Purchases</h3>
          <div className="space-y-3">
            {data.recentPurchases.length > 0 ? (
              data.recentPurchases.map((purchase) => {
                const date = new Date(purchase.createdAt);
                const timeAgo = getTimeAgo(date);
                return (
                  <div key={purchase._id} className="bg-gray-50 rounded-lg p-3.5 border border-gray-100 hover:bg-gray-100 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-start">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-[#066f48] mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-sm text-gray-800 font-semibold truncate">
                            {purchase.weightKg.toLocaleString()}kg
                          </p>
                          <span className={`text-xs px-2.5 py-1 rounded-md flex-shrink-0 font-medium ${
                            purchase.status === 'completed' ? 'bg-green-100 text-green-700' :
                            purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {purchase.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate mb-1.5">
                          {purchase.farmerName}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-[#066f48] font-bold">
                            ₦{purchase.totalAmount.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">{timeAgo}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No recent purchases
              </div>
            )}
          </div>
        </div>
        )}

        {/* Recent Transactions */}
        {permissions.recentTransactions && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {data.recentTransactions.length > 0 ? (
              data.recentTransactions.map((transaction) => {
                const date = new Date(transaction.createdAt);
                const timeAgo = getTimeAgo(date);
                return (
                  <div key={transaction.id} className="bg-gray-50 rounded-lg p-3.5 border border-gray-100 hover:bg-gray-100 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-start">
                      <div className={`w-2 h-2 mt-1.5 rounded-full mr-3 flex-shrink-0 ${
                        transaction.status === 'completed' ? 'bg-[#066f48]' :
                        transaction.status === 'pending' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-sm text-gray-800 font-semibold truncate capitalize">
                            {transaction.type}
                          </p>
                          <span className={`text-xs px-2.5 py-1 rounded-md flex-shrink-0 font-medium ${
                            transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {transaction.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate mb-1.5">
                          {transaction.user?.name || 'Unknown'}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-[#066f48] font-bold">
                            ₦{transaction.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">{timeAgo}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No recent transactions
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

// Helper function to calculate time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

function formatKpiValue(value: number, unit: DashboardKpiUnit): string {
  if (unit === 'percent') {
    return `${value.toFixed(2)}%`;
  }
  if (unit === 'minutes') {
    return `${value.toFixed(2)} mins`;
  }
  return Math.round(value).toLocaleString();
}

function getKpiUnitLabel(unit: DashboardKpiUnit): string {
  if (unit === 'percent') return 'Percentage';
  if (unit === 'minutes') return 'Minutes';
  return 'Count';
}

function formatKpiLabel(label: string, unit: DashboardKpiUnit): string {
  if (unit === 'percent' && !label.includes('%')) {
    return `${label} (%)`;
  }
  if (unit === 'minutes' && !label.toLowerCase().includes('min')) {
    return `${label} (mins)`;
  }
  return label;
}
