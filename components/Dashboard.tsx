import React, { useState, useEffect, useMemo } from 'react';
import { Scale, Wallet, Users, AlertCircle, RefreshCw, TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { purchasesApi, PurchaseKPIs, PurchaseItem } from '../api/purchases';
import { loansApi, LoanKPIs } from '../api/loans';
import { farmersApi } from '../api/farmers';
import { transactionsApi, TransactionStats, Transaction } from '../api/transactions';

interface DashboardData {
  purchaseKPIs: PurchaseKPIs | null;
  loanKPIs: LoanKPIs | null;
  activeFarmers: number;
  totalFarmers: number;
  transactionStats: TransactionStats | null;
  recentPurchases: PurchaseItem[];
  recentTransactions: Transaction[];
  loading: boolean;
  error: string | null;
}

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData>({
    purchaseKPIs: null,
    loanKPIs: null,
    activeFarmers: 0,
    totalFarmers: 0,
    transactionStats: null,
    recentPurchases: [],
    recentTransactions: [],
    loading: true,
    error: null,
  });

  const loadDashboardData = async () => {
    setData(prev => ({ ...prev, loading: true, error: null }));
    try {
      // Fetch data - make date filters optional to avoid API errors
      const [purchaseKPIs, loanKPIs, farmersResponse, transactionStats, recentPurchases, recentTransactions] = await Promise.allSettled([
        purchasesApi.getPurchaseKPIs(),
        loansApi.getLoanKPIs(),
        farmersApi.getAllFarmers({ page: 1, limit: 1, status: 'active' }),
        transactionsApi.getTransactionStats(),
        // Get recent purchases without date filter - we'll filter client-side
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
      ]);

      const activeFarmers = farmersResponse.status === 'fulfilled' ? farmersResponse.value.total : 0;
      // Get total farmers count (try without status filter)
      let totalFarmers = activeFarmers;
      try {
        const totalFarmersResponse = await farmersApi.getAllFarmers({ page: 1, limit: 1 });
        totalFarmers = totalFarmersResponse?.total || activeFarmers;
      } catch (err) {
        // If it fails, use active farmers count
        console.warn('Could not fetch total farmers count:', err);
      }

      setData({
        purchaseKPIs: purchaseKPIs.status === 'fulfilled' ? purchaseKPIs.value : null,
        loanKPIs: loanKPIs.status === 'fulfilled' ? loanKPIs.value : null,
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

  // Process purchase data for 7-day chart - MUST be before any conditional returns
  const chartData = useMemo(() => {
    if (!data.recentPurchases || data.recentPurchases.length === 0) {
      return [];
    }

    // Filter purchases from last 7 days
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
    
    // Initialize all days with 0
    days.forEach(day => {
      dayData[day] = 0;
    });

    // Group purchases by day
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

  // Transaction breakdown for pie chart - MUST be before any conditional returns
  const transactionBreakdown = useMemo(() => {
    if (!data.transactionStats) return [];
    return [
      { name: 'Wallet', value: data.transactionStats.byType?.wallet || 0, color: '#10b981' },
      { name: 'Loans', value: data.transactionStats.byType?.loan || 0, color: '#3b82f6' },
      { name: 'Purchases', value: data.transactionStats.byType?.purchase || 0, color: '#f59e0b' },
    ].filter(item => item.value > 0);
  }, [data.transactionStats]);

  // Calculate metrics - MUST be before any conditional returns
  const totalWeight = data.purchaseKPIs?.totalWeight || 0;
  const totalPaid = data.purchaseKPIs?.totalAmountSpent || 0;
  const outstandingLoans = data.loanKPIs?.totalOutstanding || 0;
  const averagePurchaseSize = data.purchaseKPIs?.totalPurchases 
    ? (data.purchaseKPIs.totalWeight / data.purchaseKPIs.totalPurchases) 
    : 0;
  const defaultRate = data.loanKPIs?.defaultRate || 0;
  const totalDisbursed = data.loanKPIs?.totalDisbursed || 0;
  const totalTransactions = data.transactionStats?.totalAmount || 0;

  // Now we can do conditional returns after all hooks
  if (data.loading) {
    return <LoadingSpinner message="Loading dashboard data..." />;
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
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">Dashboard Overview</h2>
          <p className="text-xs text-gray-500">Real-time analytics and insights</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="flex items-center px-2.5 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh data"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard
          title="Total Collected"
          value={`${totalWeight.toLocaleString()} kg`}
          trend={`${data.purchaseKPIs?.completedPurchases || 0} completed purchases`}
          trendUp={true}
          icon={Scale}
          colorClass="bg-blue-600"
        />
        <StatsCard
          title="Total Paid"
          value={`₦${totalPaid.toLocaleString()}`}
          trend={`${data.purchaseKPIs?.totalPurchases || 0} total purchases`}
          trendUp={true}
          icon={Wallet}
          colorClass="bg-emerald-600"
        />
        <StatsCard
          title="Active Farmers"
          value={data.activeFarmers.toLocaleString()}
          trend={`${data.totalFarmers} total farmers`}
          trendUp={true}
          icon={Users}
          colorClass="bg-purple-600"
        />
        <StatsCard
          title="Outstanding Loans"
          value={`₦${outstandingLoans.toLocaleString()}`}
          trend={`${data.loanKPIs?.defaultedLoans || 0} defaulted`}
          trendUp={false}
          icon={AlertCircle}
          colorClass="bg-orange-600"
        />
      </div>

      {/* Secondary Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard
          title="Average Purchase Size"
          value={`${Math.round(averagePurchaseSize).toLocaleString()} kg`}
          trend={`${data.purchaseKPIs?.averagePrice ? `₦${Math.round(data.purchaseKPIs.averagePrice)}/kg avg` : 'N/A'}`}
          trendUp={true}
          icon={TrendingUp}
          colorClass="bg-indigo-600"
        />
        <StatsCard
          title="Loan Default Rate"
          value={`${defaultRate.toFixed(1)}%`}
          trend={`${data.loanKPIs?.defaultedLoans || 0} defaulted loans`}
          trendUp={defaultRate > 5}
          icon={Percent}
          colorClass={defaultRate > 5 ? "bg-red-600" : "bg-yellow-600"}
        />
        <StatsCard
          title="Total Disbursed"
          value={`₦${totalDisbursed.toLocaleString()}`}
          trend={`${data.loanKPIs?.activeLoans || 0} active loans`}
          trendUp={true}
          icon={DollarSign}
          colorClass="bg-teal-600"
        />
        <StatsCard
          title="Total Transactions"
          value={`₦${totalTransactions.toLocaleString()}`}
          trend={`${data.transactionStats?.completedTransactions || 0} completed`}
          trendUp={true}
          icon={TrendingUp}
          colorClass="bg-pink-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Purchase Volume Chart */}
        <div className="lg:col-span-2 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Purchase Volume (Last 7 Days)</h3>
          <div className="h-56 w-full">
            {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorKg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value.toLocaleString()} kg`, 'Weight']}
                />
                <Area type="monotone" dataKey="kg" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorKg)" />
              </AreaChart>
            </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                No purchase data available for the last 7 days
              </div>
            )}
          </div>
        </div>

        {/* Transaction Breakdown */}
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Transaction Breakdown</h3>
          <div className="h-56 w-full">
            {transactionBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={transactionBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {transactionBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value} transactions`, 'Count']}
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
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Recent Purchases */}
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Recent Purchases</h3>
          <div className="space-y-2.5">
            {data.recentPurchases.length > 0 ? (
              data.recentPurchases.map((purchase) => {
                const date = new Date(purchase.createdAt);
                const timeAgo = getTimeAgo(date);
                return (
                  <div key={purchase._id} className="flex items-start pb-2.5 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className="w-1.5 h-1.5 mt-2 rounded-full bg-emerald-500 mr-2.5 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-gray-800 font-medium truncate">
                          {purchase.weightKg.toLocaleString()}kg
                        </p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                          purchase.status === 'completed' ? 'bg-green-100 text-green-700' :
                          purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {purchase.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {purchase.farmerName}
                      </p>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-emerald-600 font-medium">
                          ₦{purchase.totalAmount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">{timeAgo}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-gray-500 text-xs">
                No recent purchases
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Recent Transactions</h3>
          <div className="space-y-2.5">
            {data.recentTransactions.length > 0 ? (
              data.recentTransactions.map((transaction) => {
                const date = new Date(transaction.createdAt);
                const timeAgo = getTimeAgo(date);
                return (
                  <div key={transaction.id} className="flex items-start pb-2.5 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className={`w-1.5 h-1.5 mt-2 rounded-full mr-2.5 flex-shrink-0 ${
                      transaction.status === 'completed' ? 'bg-emerald-500' :
                      transaction.status === 'pending' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-gray-800 font-medium truncate">
                          {transaction.type}
                        </p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                          transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                          transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {transaction.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {transaction.user?.name || 'Unknown'}
                      </p>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-emerald-600 font-medium">
                          ₦{transaction.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">{timeAgo}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-gray-500 text-xs">
                No recent transactions
              </div>
            )}
          </div>
        </div>
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