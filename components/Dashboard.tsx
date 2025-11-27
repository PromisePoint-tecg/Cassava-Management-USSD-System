import React from 'react';
import { Scale, Wallet, Users, AlertCircle } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { KPIData } from '../types';

interface DashboardProps {
  kpiData: KPIData;
}

const CHART_DATA = [
  { name: 'Mon', kg: 4000 },
  { name: 'Tue', kg: 3000 },
  { name: 'Wed', kg: 2000 },
  { name: 'Thu', kg: 2780 },
  { name: 'Fri', kg: 1890 },
  { name: 'Sat', kg: 2390 },
  { name: 'Sun', kg: 3490 },
];

export const Dashboard: React.FC<DashboardProps> = ({ kpiData }) => {
  if (kpiData.totalWeight === 0 && kpiData.totalPaid === 0 && kpiData.activeFarmers === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-800">No activity yet</h3>
        <p className="text-sm text-gray-500 mt-2">No purchases or farmers have been recorded. Create products and record purchases to populate the dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Overview</h2>
        <div className="text-xs sm:text-sm text-gray-500">Last updated: Just now</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="Total Collected"
          value={`${kpiData.totalWeight.toLocaleString()} kg`}
          trend="+12% from last week"
          trendUp={true}
          icon={Scale}
          colorClass="bg-blue-600"
        />
        <StatsCard
          title="Total Paid"
          value={`₦${kpiData.totalPaid.toLocaleString()}`}
          trend="+8% from last week"
          trendUp={true}
          icon={Wallet}
          colorClass="bg-emerald-600"
        />
        <StatsCard
          title="Active Farmers"
          value={kpiData.activeFarmers.toString()}
          trend="+2 new today"
          trendUp={true}
          icon={Users}
          colorClass="bg-purple-600"
        />
        <StatsCard
          title="Outstanding Loans"
          value={`₦${kpiData.outstandingLoans.toLocaleString()}`}
          trend="-5% repayment rate"
          trendUp={false}
          icon={AlertCircle}
          colorClass="bg-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 sm:mb-6">Cassava Collection Volume (7 Days)</h3>
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA}>
                <defs>
                  <linearGradient id="colorKg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="kg" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorKg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500 mr-3"></div>
                <div>
                  <p className="text-sm text-gray-800 font-medium">Purchase recorded: 250kg</p>
                  <p className="text-xs text-gray-500">Amara Nnadi • 2 mins ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};