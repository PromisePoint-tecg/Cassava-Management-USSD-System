import React, { useState, useEffect, useMemo } from 'react';
import { Scale, Wallet, Users, AlertCircle, RefreshCw, TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { purchasesApi, PurchaseKPIs, PurchaseItem } from '../services/purchases';
import { loansApi, LoanKPIs } from '../services/loans';
import { farmersApi } from '../services/farmers';
import { transactionsApi, TransactionStats, Transaction } from '../services/transactions';
import LeafInlineLoader from './Loader';

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
      const [purchaseKPIs, loanKPIs, farmersResponse, transactionStats, recentPurchases, recentTransactions] = await Promise.allSettled([
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
      <div className="bg-white/20 backdrop-blur-2xl rounded-[2rem] border border-white/30 shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_1px_3px_0_rgba(255,255,255,0.8)_inset] p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2/5 bg-gradient-to-b from-white/80 via-white/40 to-transparent rounded-t-[2rem] pointer-events-none blur-[1px]" />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/10 via-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/10 via-transparent to-cyan-400/10 rounded-[2rem] pointer-events-none" />
        <div className="absolute top-0 left-0 w-2/3 h-2/3 bg-gradient-to-br from-white/50 via-white/20 to-transparent blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-[#066f48]/15 to-transparent blur-2xl rounded-full pointer-events-none" />
        <h3 className="text-lg font-semibold text-gray-800 relative z-10">No activity yet</h3>
        <p className="text-sm text-gray-500 mt-2 relative z-10">No purchases or farmers have been recorded. Create products and record purchases to populate the dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header - Liquid Glass Container */}
      <div className="bg-white/20 backdrop-blur-2xl rounded-[2rem] border border-white/30 shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_1px_3px_0_rgba(255,255,255,0.8)_inset] p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2/5 bg-gradient-to-b from-white/80 via-white/40 to-transparent rounded-t-[2rem] pointer-events-none blur-[1px]" />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/10 via-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/10 via-transparent to-cyan-400/10 rounded-[2rem] pointer-events-none" />
        <div className="absolute top-0 left-0 w-2/3 h-2/3 bg-gradient-to-br from-white/50 via-white/20 to-transparent blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-[#066f48]/15 to-transparent blur-2xl rounded-full pointer-events-none" />
        
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
            <p className="text-sm text-gray-600 mt-0.5">Real-time analytics and insights</p>
          </div>
          <button
            onClick={loadDashboardData}
            className="flex items-center px-4 py-2.5 text-sm text-gray-600 hover:text-[#066f48] bg-white/50 hover:bg-white/70 backdrop-blur-lg rounded-xl border border-white/70 hover:border-[#066f48]/30 transition-all duration-300 shadow-sm hover:shadow-md relative overflow-hidden group"
            title="Refresh data"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
            <RefreshCw className="w-4 h-4 mr-2 relative z-10" />
            <span className="relative z-10">Refresh</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Purchase Volume Chart - Liquid Glass */}
        <div className="lg:col-span-2 bg-white/20 backdrop-blur-2xl rounded-[2rem] border border-white/30 shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_1px_3px_0_rgba(255,255,255,0.8)_inset] p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2/5 bg-gradient-to-b from-white/80 via-white/40 to-transparent rounded-t-[2rem] pointer-events-none blur-[1px]" />
          <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/10 via-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/10 via-transparent to-cyan-400/10 rounded-[2rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-2/3 h-2/3 bg-gradient-to-br from-white/50 via-white/20 to-transparent blur-3xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-[#066f48]/15 to-transparent blur-2xl rounded-full pointer-events-none" />
          
          <h3 className="text-base font-semibold text-gray-800 mb-4 relative z-10">Purchase Volume (Last 7 Days)</h3>
          <div className="h-64 w-full relative z-10">
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
                      backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                      backdropFilter: 'blur(12px)',
                      borderRadius: '12px', 
                      border: '1px solid rgba(255, 255, 255, 0.6)', 
                      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)' 
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

        {/* Transaction Breakdown - Liquid Glass */}
        <div className="bg-white/20 backdrop-blur-2xl rounded-[2rem] border border-white/30 shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_1px_3px_0_rgba(255,255,255,0.8)_inset] p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2/5 bg-gradient-to-b from-white/80 via-white/40 to-transparent rounded-t-[2rem] pointer-events-none blur-[1px]" />
          <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/10 via-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/10 via-transparent to-cyan-400/10 rounded-[2rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-2/3 h-2/3 bg-gradient-to-br from-white/50 via-white/20 to-transparent blur-3xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-[#066f48]/15 to-transparent blur-2xl rounded-full pointer-events-none" />
          
          <h3 className="text-base font-semibold text-gray-800 mb-4 relative z-10">Transaction Breakdown</h3>
          <div className="h-64 w-full relative z-10">
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
                      backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                      backdropFilter: 'blur(12px)',
                      borderRadius: '12px', 
                      border: '1px solid rgba(255, 255, 255, 0.6)', 
                      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)' 
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
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Purchases - Liquid Glass */}
        <div className="bg-white/20 backdrop-blur-2xl rounded-[2rem] border border-white/30 shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_1px_3px_0_rgba(255,255,255,0.8)_inset] p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2/5 bg-gradient-to-b from-white/80 via-white/40 to-transparent rounded-t-[2rem] pointer-events-none blur-[1px]" />
          <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/10 via-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/10 via-transparent to-cyan-400/10 rounded-[2rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-2/3 h-2/3 bg-gradient-to-br from-white/50 via-white/20 to-transparent blur-3xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-[#066f48]/15 to-transparent blur-2xl rounded-full pointer-events-none" />
          
          <h3 className="text-base font-semibold text-gray-800 mb-4 relative z-10">Recent Purchases</h3>
          <div className="space-y-3 relative z-10">
            {data.recentPurchases.length > 0 ? (
              data.recentPurchases.map((purchase) => {
                const date = new Date(purchase.createdAt);
                const timeAgo = getTimeAgo(date);
                return (
                  <div key={purchase._id} className="bg-white/30 backdrop-blur-xl rounded-[1.25rem] p-3.5 border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05),0_1px_2px_rgba(255,255,255,0.6)_inset] hover:bg-white/40 hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/60 via-white/25 to-transparent rounded-t-[1.25rem] pointer-events-none blur-[0.5px]" />
                    <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/40 blur-2xl rounded-full pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-[#066f48]/10 blur-xl rounded-full pointer-events-none" />
                    
                    <div className="flex items-start relative z-10">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-[#066f48] mr-3 flex-shrink-0 group-hover:scale-125 transition-transform shadow-sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-sm text-gray-800 font-semibold truncate">
                            {purchase.weightKg.toLocaleString()}kg
                          </p>
                          <span className={`text-xs px-2.5 py-1 rounded-lg flex-shrink-0 backdrop-blur-sm font-medium ${
                            purchase.status === 'completed' ? 'bg-green-100/90 text-green-700' :
                            purchase.status === 'pending' ? 'bg-yellow-100/90 text-yellow-700' :
                            'bg-red-100/90 text-red-700'
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

        {/* Recent Transactions - Liquid Glass */}
        <div className="bg-white/20 backdrop-blur-2xl rounded-[2rem] border border-white/30 shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_1px_3px_0_rgba(255,255,255,0.8)_inset] p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2/5 bg-gradient-to-b from-white/80 via-white/40 to-transparent rounded-t-[2rem] pointer-events-none blur-[1px]" />
          <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/10 via-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/10 via-transparent to-cyan-400/10 rounded-[2rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-2/3 h-2/3 bg-gradient-to-br from-white/50 via-white/20 to-transparent blur-3xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-[#066f48]/15 to-transparent blur-2xl rounded-full pointer-events-none" />
          
          <h3 className="text-base font-semibold text-gray-800 mb-4 relative z-10">Recent Transactions</h3>
          <div className="space-y-3 relative z-10">
            {data.recentTransactions.length > 0 ? (
              data.recentTransactions.map((transaction) => {
                const date = new Date(transaction.createdAt);
                const timeAgo = getTimeAgo(date);
                return (
                  <div key={transaction.id} className="bg-white/30 backdrop-blur-xl rounded-[1.25rem] p-3.5 border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05),0_1px_2px_rgba(255,255,255,0.6)_inset] hover:bg-white/40 hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/60 via-white/25 to-transparent rounded-t-[1.25rem] pointer-events-none blur-[0.5px]" />
                    <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/40 blur-2xl rounded-full pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-[#066f48]/10 blur-xl rounded-full pointer-events-none" />
                    
                    <div className="flex items-start relative z-10">
                      <div className={`w-2 h-2 mt-1.5 rounded-full mr-3 flex-shrink-0 group-hover:scale-125 transition-transform shadow-sm ${
                        transaction.status === 'completed' ? 'bg-[#066f48]' :
                        transaction.status === 'pending' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-sm text-gray-800 font-semibold truncate capitalize">
                            {transaction.type}
                          </p>
                          <span className={`text-xs px-2.5 py-1 rounded-lg flex-shrink-0 backdrop-blur-sm font-medium ${
                            transaction.status === 'completed' ? 'bg-green-100/90 text-green-700' :
                            transaction.status === 'pending' ? 'bg-yellow-100/90 text-yellow-700' :
                            'bg-red-100/90 text-red-700'
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