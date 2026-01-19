import React, { useState, useEffect, useMemo } from "react";
import {
  Phone,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Leaf,
} from "lucide-react";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorMessage } from "./ErrorMessage";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ussdApi,
  USSDSession,
  USSDStats,
  USSDAnalytics,
  GetUSSDAnalyticsParams,
} from "../services/ussd";
import { LeafInlineLoader } from "./Loader";

interface USSDAnalyticsData {
  analytics: USSDAnalytics | null;
  loading: boolean;
  error: string | null;
}

export const USSDAnalyticsView: React.FC = () => {
  const [data, setData] = useState<USSDAnalyticsData>({
    analytics: null,
    loading: true,
    error: null,
  });

  const [filters, setFilters] = useState<GetUSSDAnalyticsParams>({
    timeRange: "month",
  });

  const loadUSSDData = async () => {
    setData((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const analytics = await ussdApi.getUSSDAnalytics(filters);
      setData({
        analytics,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error loading USSD analytics:", error);
      setData((prev) => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load USSD analytics",
      }));
    }
  };

  useEffect(() => {
    loadUSSDData();
  }, []);

  useEffect(() => {
    loadUSSDData();
  }, [filters]);

  const networkData = useMemo(() => {
    if (!data.analytics?.networkTraffic) {
      return [];
    }

    const colors: { [key: string]: string } = {
      MTN: "#FFC400",
      AIRTEL: "#FF0000",
      GLO: "#00AA00",
      "9MOBILE": "#005500",
      NMOBILE: "#005500",
    };

    return data.analytics.networkTraffic.map((item) => ({
      name: item.network,
      value: item.sessions,
      color: colors[item.network] || "#6b7280",
    }));
  }, [data.analytics?.networkTraffic]);

  const statusData = useMemo(() => {
    if (!data.analytics?.sessionStatus) {
      return { success: 0, failed: 0, timeout: 0, total: 0 };
    }

    const statusMap: { [key: string]: number } = {};
    data.analytics.sessionStatus.forEach((item) => {
      statusMap[item.status] = item.count;
    });

    return {
      success: statusMap.completed || 0,
      failed: statusMap.failed || 0,
      timeout: statusMap.timeout || 0,
      total: data.analytics.totalSessions,
    };
  }, [data.analytics?.sessionStatus, data.analytics?.totalSessions]);

  const averageDuration = useMemo(() => {
    return data.analytics?.avgDuration || 0;
  }, [data.analytics?.avgDuration]);

  const actionData = useMemo(() => {
    if (!data.analytics?.topActions) {
      return [];
    }

    return data.analytics.topActions.map((item) => ({
      name: item.action,
      value: item.count,
    }));
  }, [data.analytics?.topActions]);

  const recentSessions = useMemo(() => {
    return data.analytics?.recentSessions || [];
  }, [data.analytics?.recentSessions]);

  if (data.loading) {
    return <LeafInlineLoader />;
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

  const successRate = data.analytics?.successRate || 0;

  return (
    <div className="space-y-5">
      {/* Header - Liquid Glass */}
      <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] border border-white/60 shadow-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-400/5 rounded-[2rem] pointer-events-none" />
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-blue-600/10 to-transparent blur-2xl rounded-full pointer-events-none" />
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-600 shadow-lg">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">USSD & Network Analytics</h2>
              <p className="text-sm text-gray-600">Real-time USSD session monitoring</p>
            </div>
          </div>
          <button
            onClick={loadUSSDData}
            className="flex items-center px-4 py-2 text-sm text-gray-700 bg-white/40 backdrop-blur-md border border-white/60 rounded-xl hover:bg-white/50 transition-all shadow-sm"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters - Liquid Glass */}
      <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] border border-white/60 shadow-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-400/5 rounded-[2rem] pointer-events-none" />
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
        
        <h3 className="text-sm font-semibold text-gray-800 mb-3 relative z-10">Filters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Time Range
            </label>
            <select
              value={filters.timeRange || ""}
              onChange={(e) => {
                const value = e.target
                  .value as GetUSSDAnalyticsParams["timeRange"];
                setFilters((prev) => ({
                  ...prev,
                  timeRange: value || undefined,
                  startDate: value ? undefined : prev.startDate,
                  endDate: value ? undefined : prev.endDate,
                }));
              }}
              className="w-full px-3 py-2 text-sm border border-white/50 bg-white/40 backdrop-blur-md rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/50 transition-all text-gray-800"
            >
              <option value="">Custom Range</option>
              <option value="realtime">Real-time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="datetime-local"
              value={filters.startDate || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  startDate: e.target.value || undefined,
                  timeRange: undefined,
                }))
              }
              disabled={!!filters.timeRange}
              className="w-full px-3 py-2 text-sm border border-white/50 bg-white/40 backdrop-blur-md rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-gray-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="datetime-local"
              value={filters.endDate || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  endDate: e.target.value || undefined,
                  timeRange: undefined,
                }))
              }
              disabled={!!filters.timeRange}
              className="w-full px-3 py-2 text-sm border border-white/50 bg-white/40 backdrop-blur-md rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-gray-800"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ timeRange: "month" })}
              className="px-4 py-2 text-sm text-gray-700 bg-white/40 backdrop-blur-md border border-white/60 rounded-xl hover:bg-white/50 transition-all"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards - Liquid Glass */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur-lg rounded-[1.5rem] border border-white/60 shadow-lg p-4 relative overflow-hidden hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[1.5rem] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none rounded-[1.5rem]" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/25 blur-2xl rounded-full pointer-events-none" />
          
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="p-2 rounded-xl bg-blue-500/20 backdrop-blur-sm border border-blue-200/30">
              <Phone className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <h3 className="text-xs text-gray-600 font-medium mb-1 relative z-10">
            Total Sessions
          </h3>
          <p className="text-xl font-bold text-gray-800 relative z-10">
            {(data.analytics?.totalSessions || 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-[1.5rem] border border-white/60 shadow-lg p-4 relative overflow-hidden hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[1.5rem] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none rounded-[1.5rem]" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/25 blur-2xl rounded-full pointer-events-none" />
          
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="p-2 rounded-xl bg-emerald-500/20 backdrop-blur-sm border border-emerald-200/30">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <h3 className="text-xs text-gray-600 font-medium mb-1 relative z-10">
            Success Rate
          </h3>
          <p className="text-xl font-bold text-gray-800 relative z-10">{successRate}%</p>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-[1.5rem] border border-white/60 shadow-lg p-4 relative overflow-hidden hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[1.5rem] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none rounded-[1.5rem]" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/25 blur-2xl rounded-full pointer-events-none" />
          
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="p-2 rounded-xl bg-purple-500/20 backdrop-blur-sm border border-purple-200/30">
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <h3 className="text-xs text-gray-600 font-medium mb-1 relative z-10">
            Avg Duration
          </h3>
          <p className="text-xl font-bold text-gray-800 relative z-10">{averageDuration}s</p>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-[1.5rem] border border-white/60 shadow-lg p-4 relative overflow-hidden hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[1.5rem] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none rounded-[1.5rem]" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/25 blur-2xl rounded-full pointer-events-none" />
          
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="p-2 rounded-xl bg-red-500/20 backdrop-blur-sm border border-red-200/30">
              <XCircle className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <h3 className="text-xs text-gray-600 font-medium mb-1 relative z-10">
            Failed Sessions
          </h3>
          <p className="text-xl font-bold text-gray-800 relative z-10">
            {(data.analytics?.failedSessions || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Charts Section - Liquid Glass */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Network Distribution */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] border border-white/60 shadow-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-400/5 rounded-[2rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
          
          <h3 className="text-sm font-semibold text-gray-800 mb-3 relative z-10">
            Traffic by Network Operator
          </h3>
          <div className="h-56 w-full relative z-10">
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
                  <Tooltip
                    formatter={(value: number) => [
                      `${value} sessions`,
                      "Count",
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-600 text-xs">
                No network data available
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] border border-white/60 shadow-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-400/5 rounded-[2rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
          
          <h3 className="text-sm font-semibold text-gray-800 mb-3 relative z-10">
            Session Status
          </h3>
          <div className="h-56 w-full relative z-10">
            {statusData.total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: "Success",
                        value: statusData.success,
                        color: "#10b981",
                      },
                      {
                        name: "Failed",
                        value: statusData.failed,
                        color: "#ef4444",
                      },
                      {
                        name: "Timeout",
                        value: statusData.timeout,
                        color: "#f59e0b",
                      },
                    ].filter((item) => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[
                      {
                        name: "Success",
                        value: statusData.success,
                        color: "#10b981",
                      },
                      {
                        name: "Failed",
                        value: statusData.failed,
                        color: "#ef4444",
                      },
                      {
                        name: "Timeout",
                        value: statusData.timeout,
                        color: "#f59e0b",
                      },
                    ]
                      .filter((item) => item.value > 0)
                      .map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [
                      `${value} sessions`,
                      "Count",
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-600 text-xs">
                No status data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Distribution and Recent Sessions - Liquid Glass */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Actions */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] border border-white/60 shadow-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-400/5 rounded-[2rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
          
          <h3 className="text-sm font-semibold text-gray-800 mb-3 relative z-10">
            Top Actions
          </h3>
          <div className="h-56 w-full relative z-10">
            {actionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={actionData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [
                      `${value} sessions`,
                      "Count",
                    ]}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-600 text-xs">
                No action data available
              </div>
            )}
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] border border-white/60 shadow-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-400/5 rounded-[2rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
          
          <h3 className="text-sm font-semibold text-gray-800 mb-3 relative z-10">
            Recent Sessions
          </h3>
          <div className="space-y-2.5 max-h-56 overflow-y-auto relative z-10">
            {recentSessions.length > 0 ? (
              recentSessions.map((session) => {
                const date = new Date(session.startTime);
                const timeAgo = getTimeAgo(date);
                const network = session.network;
                const isSuccess = session.status === "completed";
                const isFailed = session.status === "failed";

                return (
                  <div
                    key={session.id}
                    className="flex items-start pb-2.5 border-b border-white/20 last:border-0 last:pb-0"
                  >
                    <div
                      className={`w-1.5 h-1.5 mt-2 rounded-full mr-2.5 flex-shrink-0 ${
                        isSuccess
                          ? "bg-emerald-500"
                          : isFailed
                          ? "bg-red-500"
                          : "bg-yellow-500"
                      }`}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-gray-800 font-medium truncate">
                          {session.phoneNumber}
                        </p>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 backdrop-blur-sm ${
                            isSuccess
                              ? "bg-green-100/80 text-green-700 border border-green-200/50"
                              : isFailed
                              ? "bg-red-100/80 text-red-700 border border-red-200/50"
                              : "bg-yellow-100/80 text-yellow-700 border border-yellow-200/50"
                          }`}
                        >
                          {session.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 truncate">
                        {network} • {session.action}
                      </p>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-gray-500">
                          {session.duration}s
                        </p>
                        <p className="text-xs text-gray-500">{timeAgo}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-gray-600 text-xs">
                No USSD sessions found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}