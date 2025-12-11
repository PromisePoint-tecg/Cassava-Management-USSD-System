import React, { useState, useEffect, useMemo } from 'react';
import { Phone, RefreshCw, TrendingUp, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ussdApi, USSDSession, USSDStats } from '../api/ussd';

interface USSDAnalyticsData {
  sessions: USSDSession[];
  stats: USSDStats | null;
  loading: boolean;
  error: string | null;
}

export const USSDAnalyticsView: React.FC = () => {
  const [data, setData] = useState<USSDAnalyticsData>({
    sessions: [],
    stats: null,
    loading: true,
    error: null,
  });

  const loadUSSDData = async () => {
    setData(prev => ({ ...prev, loading: true, error: null }));
    try {
      const [sessionsResponse, statsResponse] = await Promise.allSettled([
        ussdApi.getAllSessions({ page: 1, limit: 50, sortBy: 'createdAt', sortOrder: 'desc' }),
        ussdApi.getUSSDStats(),
      ]);

      setData({
        sessions: sessionsResponse.status === 'fulfilled' ? sessionsResponse.value.sessions : [],
        stats: statsResponse.status === 'fulfilled' ? statsResponse.value : null,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error loading USSD data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load USSD data',
      }));
    }
  };

  useEffect(() => {
    loadUSSDData();
  }, []);

  // Process network data from sessions
  const networkData = useMemo(() => {
    if (!data.sessions || data.sessions.length === 0) {
      return [];
    }

    const networkCounts: { [key: string]: number } = {};
    data.sessions.forEach(session => {
      const network = session.network || session.networkOperator || 'Unknown';
      const networkKey = network.toUpperCase();
      networkCounts[networkKey] = (networkCounts[networkKey] || 0) + 1;
    });

    const colors: { [key: string]: string } = {
      'MTN': '#FFC400',
      'AIRTEL': '#FF0000',
      'GLO': '#00AA00',
      '9MOBILE': '#005500',
      'NMOBILE': '#005500',
    };

    return Object.entries(networkCounts)
      .map(([name, value]) => ({
        name,
        value,
        color: colors[name] || '#6b7280',
      }))
      .sort((a, b) => b.value - a.value);
  }, [data.sessions]);

  // Process status data
  const statusData = useMemo(() => {
    if (!data.sessions || data.sessions.length === 0) {
      return { success: 0, failed: 0, timeout: 0, total: 0 };
    }

    let success = 0;
    let failed = 0;
    let timeout = 0;

    data.sessions.forEach(session => {
      const status = (session.status || '').toLowerCase();
      if (status === 'success' || status === 'completed') {
        success++;
      } else if (status === 'failed' || status === 'error') {
        failed++;
      } else if (status === 'timeout') {
        timeout++;
      }
    });

    return { success, failed, timeout, total: data.sessions.length };
  }, [data.sessions]);

  // Calculate average duration
  const averageDuration = useMemo(() => {
    if (!data.sessions || data.sessions.length === 0) return 0;
    const durations = data.sessions
      .map(s => s.duration || 0)
      .filter(d => d > 0);
    if (durations.length === 0) return 0;
    return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  }, [data.sessions]);

  // Process action data
  const actionData = useMemo(() => {
    if (!data.sessions || data.sessions.length === 0) {
      return [];
    }

    const actionCounts: { [key: string]: number } = {};
    data.sessions.forEach(session => {
      const action = session.action || session.menuOption || 'Unknown';
      actionCounts[action] = (actionCounts[action] || 0) + 1;
    });

    return Object.entries(actionCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [data.sessions]);

  // Get recent sessions
  const recentSessions = useMemo(() => {
    return data.sessions.slice(0, 10);
  }, [data.sessions]);

  if (data.loading) {
    return <LoadingSpinner message="Loading USSD analytics..." />;
  }

  if (data.error) {
    return (
      <ErrorMessage
        title="Error Loading USSD Data"
        message={data.error}
        onRetry={loadUSSDData}
      />
    );
  }

  const successRate = statusData.total > 0 
    ? ((statusData.success / statusData.total) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">USSD & Network Analytics</h2>
          <p className="text-xs text-gray-500">Real-time USSD session monitoring</p>
        </div>
        <button
          onClick={loadUSSDData}
          className="flex items-center px-2.5 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh data"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-blue-50">
              <Phone className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <h3 className="text-xs text-gray-500 font-medium mb-1">Total Sessions</h3>
          <p className="text-xl font-bold text-gray-900">{statusData.total.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-emerald-50">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <h3 className="text-xs text-gray-500 font-medium mb-1">Success Rate</h3>
          <p className="text-xl font-bold text-gray-900">{successRate}%</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-purple-50">
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <h3 className="text-xs text-gray-500 font-medium mb-1">Avg Duration</h3>
          <p className="text-xl font-bold text-gray-900">{averageDuration}s</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-red-50">
              <XCircle className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <h3 className="text-xs text-gray-500 font-medium mb-1">Failed Sessions</h3>
          <p className="text-xl font-bold text-gray-900">{statusData.failed.toLocaleString()}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Network Distribution */}
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Traffic by Network Operator</h3>
          <div className="h-56 w-full">
            {networkData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={networkData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {networkData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value} sessions`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                No network data available
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Session Status</h3>
          <div className="h-56 w-full">
            {statusData.total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Success', value: statusData.success, color: '#10b981' },
                      { name: 'Failed', value: statusData.failed, color: '#ef4444' },
                      { name: 'Timeout', value: statusData.timeout, color: '#f59e0b' },
                    ].filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[
                      { name: 'Success', value: statusData.success, color: '#10b981' },
                      { name: 'Failed', value: statusData.failed, color: '#ef4444' },
                      { name: 'Timeout', value: statusData.timeout, color: '#f59e0b' },
                    ].filter(item => item.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value} sessions`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                No status data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Distribution and Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Top Actions */}
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Top Actions</h3>
          <div className="h-56 w-full">
            {actionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={actionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} angle={-45} textAnchor="end" height={60} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    formatter={(value: number) => [`${value} sessions`, 'Count']}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                No action data available
              </div>
            )}
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Recent Sessions</h3>
          <div className="space-y-2.5 max-h-56 overflow-y-auto">
            {recentSessions.length > 0 ? (
              recentSessions.map((session) => {
                const date = new Date(session.timestamp || session.createdAt || new Date());
                const timeAgo = getTimeAgo(date);
                const network = session.network || session.networkOperator || 'Unknown';
                const status = (session.status || '').toLowerCase();
                const isSuccess = status === 'success' || status === 'completed';
                const isFailed = status === 'failed' || status === 'error';
                
                return (
                  <div key={session.id} className="flex items-start pb-2.5 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className={`w-1.5 h-1.5 mt-2 rounded-full mr-2.5 flex-shrink-0 ${
                      isSuccess ? 'bg-emerald-500' :
                      isFailed ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-gray-800 font-medium truncate">
                          {session.msisdn || session.phoneNumber || 'Unknown'}
                        </p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                          isSuccess ? 'bg-green-100 text-green-700' :
                          isFailed ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {network} • {session.action || session.menuOption || 'N/A'}
                      </p>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-gray-400">
                          {session.duration ? `${session.duration}s` : 'N/A'}
                        </p>
                        <p className="text-xs text-gray-400">{timeAgo}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-gray-500 text-xs">
                No USSD sessions found
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


