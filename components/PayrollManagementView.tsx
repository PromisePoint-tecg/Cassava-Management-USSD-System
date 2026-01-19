import React, { useState, useEffect } from "react";
import {
  getAllPayrolls,
  getPayrollById,
  getPayrollTransactions,
  createPayroll,
  processPayroll,
  retryFailedTransaction,
  getPayrollStatistics,
  type Payroll,
  type PayrollTransaction,
  type PayrollStatistics as Stats,
  type CreatePayrollDto,
} from "../services/payroll";
import { adminApi, type FundOrganizationWalletData } from "../services/admin";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorMessage } from "./ErrorMessage";
import { SuccessModal } from "./SuccessModal";
import { Wallet, Users, CheckCircle, XCircle, Eye, RefreshCw } from "lucide-react";
import LeafButtonLoader from "./Loader";

const PayrollManagementView: React.FC = () => {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState("all");
  const [statistics, setStatistics] = useState<Stats | null>(null);

  const [organizationWallet, setOrganizationWallet] = useState<{ balance: number; organizationName: string } | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState<string | null>(null);

  // Modals
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showStatisticsModal, setShowStatisticsModal] = useState(false);
  const [showFundWalletModal, setShowFundWalletModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchPayrolls();
    fetchOrganizationWallet();
  }, [page, filterStatus]);

  const fetchOrganizationWallet = async () => {
    try {
      setWalletLoading(true);
      setWalletError(null);
      const wallet = await adminApi.getOrganizationWallet();
      setOrganizationWallet(wallet);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || "Wallet not found";
      if (errorMsg.includes("not found") || errorMsg.includes("not a function")) {
        setWalletError("No payroll wallet. Click 'Fund Payroll Wallet' to create one.");
      } else {
        setWalletError(errorMsg);
      }
      setOrganizationWallet(null);
    } finally {
      setWalletLoading(false);
    }
  };

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page,
        limit: 20,
      };

      if (filterStatus !== "all") params.status = filterStatus;

      const response = await getAllPayrolls(params);
      setPayrolls(response.payrolls || []);
      setTotalPages(response.pages || 1);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load payrolls";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayroll = async (data: CreatePayrollDto) => {
    try {
      setError(null);
      await createPayroll(data);
      setSuccessMessage("Payroll created successfully!");
      setShowSuccessModal(true);
      setShowCreateModal(false);
      fetchPayrolls();
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create payroll";
      setError(errorMessage);
    }
  };

  const handleProcessPayroll = async (payrollId: string) => {
    try {
      const response = await processPayroll(payrollId);
      setSuccessMessage(
        `Payroll processed: ${response.processed} successful, ${response.failed} failed`
      );
      setShowSuccessModal(true);
      setShowProcessModal(false);
      fetchPayrolls();
    } catch (err) {
      setError("Failed to process payroll. Please try again.");
    }
  };

  const handleRetryTransaction = async (transactionId: string) => {
    try {
      await retryFailedTransaction(transactionId);
      setSuccessMessage("Transaction retry initiated successfully!");
      setShowSuccessModal(true);
      fetchPayrolls();
    } catch (err) {
      setError("Failed to retry transaction. Please try again.");
    }
  };

  const handleFundOrganizationWallet = async (
    data: FundOrganizationWalletData
  ) => {
    try {
      setError(null);
      const response = await adminApi.fundOrganizationWallet(data);
      const newBalance = response?.wallet?.balance || response?.balance || 0;
      setSuccessMessage(
        `Organization wallet funded successfully! New balance: ₦${(
          newBalance / 100
        ).toLocaleString()}`
      );
      setShowSuccessModal(true);
      setShowFundWalletModal(false);
      await fetchOrganizationWallet();
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fund organization wallet";
      setError(errorMessage);
    }
  };

  const formatCurrency = (amount: number) => {
    const safeAmount =
      typeof amount === "number" && !isNaN(amount) ? amount : 0;
    return `₦${(safeAmount / 100).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: <span className="px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm bg-gray-100/90 text-gray-700 border border-gray-200/50">Pending</span>,
      processing: <span className="px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm bg-blue-100/90 text-blue-700 border border-blue-200/50">Processing</span>,
      completed: <span className="px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm bg-green-100/90 text-green-700 border border-green-200/50">Completed</span>,
      failed: <span className="px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm bg-red-100/90 text-red-700 border border-red-200/50">Failed</span>,
    };
    return badges[status as keyof typeof badges] || status;
  };

  if (loading && payrolls.length === 0) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LeafButtonLoader />
    </div>
  );
}
  return (
    <div className="space-y-5">
      {/* Header - Liquid Glass */}
      <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/5 via-transparent to-cyan-400/5 rounded-[2rem] pointer-events-none" />
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-[#066f48]/10 to-transparent blur-2xl rounded-full pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#066f48] shadow-lg">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Payroll Management</h2>
              <p className="text-sm text-gray-600">Create and process monthly payroll for staff</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50/90 backdrop-blur-sm border border-red-200/50 rounded-[1.5rem] p-4 flex items-center gap-3 shadow-sm">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800 text-sm flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            ✕
          </button>
        </div>
      )}

      {/* Actions Bar - Liquid Glass */}
      <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-white/30 to-transparent blur-2xl rounded-full pointer-events-none" />
        
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center relative z-10">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowFundWalletModal(true)}
              className="px-6 py-2.5 bg-emerald-600/80 backdrop-blur-md border border-white/30 text-white font-medium rounded-xl hover:bg-emerald-600 transition-all shadow-lg whitespace-nowrap flex items-center justify-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              Fund Payroll Wallet
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2.5 bg-green-600/80 backdrop-blur-md border border-white/30 text-white font-medium rounded-xl hover:bg-green-600 transition-all shadow-lg whitespace-nowrap flex items-center justify-center gap-2"
            >
              + Create Payroll
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Wallet Balance Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent rounded-[2rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/25 blur-2xl rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700">Payroll Wallet</div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            </div>
            {walletLoading ? (
              <div className="text-lg text-gray-600 font-medium">Loading...</div>
            ) : walletError ? (
              <div className="text-sm text-red-600 font-medium">{walletError}</div>
            ) : (
              <div className="text-2xl font-bold text-gray-800 break-words">
                {formatCurrency(organizationWallet?.balance || 0)}
              </div>
            )}
          </div>
        </div>

        {/* Pending Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/25 blur-2xl rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Pending</div>
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            </div>
            <div className="text-3xl font-bold text-gray-700">
              {payrolls.filter((p) => p.status === "pending").length}
            </div>
          </div>
        </div>

        {/* Completed Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent rounded-[2rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/25 blur-2xl rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Completed</div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            </div>
            <div className="text-3xl font-bold text-emerald-700">
              {payrolls.filter((p) => p.status === "completed").length}
            </div>
          </div>
        </div>

        {/* Failed Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/25 blur-2xl rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Failed</div>
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            </div>
            <div className="text-3xl font-bold text-gray-700">
              {payrolls.filter((p) => p.status === "failed").length}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {payrolls.map((payroll) => (
          <div key={payroll.id} className="bg-white/15 backdrop-blur-lg rounded-[1.5rem] border border-white/50 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_2px_rgba(255,255,255,0.4)_inset] p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[1.5rem] pointer-events-none" />
            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/25 blur-2xl rounded-full pointer-events-none" />
            
            <div className="relative z-10 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800">{payroll.periodLabel}</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(payroll.periodStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {new Date(payroll.periodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
                {getStatusBadge(payroll.status)}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Staff:</span>
                  <p className="font-medium text-gray-800">{payroll.totalStaffCount}</p>
                </div>
                <div>
                  <span className="text-gray-500">Net Amount:</span>
                  <p className="font-medium text-gray-800">{formatCurrency(payroll.totalNetAmount)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Processed:</span>
                  <p className="font-medium text-green-600">{payroll.processedStaffCount}</p>
                </div>
                <div>
                  <span className="text-gray-500">Failed:</span>
                  <p className="font-medium text-red-600">{payroll.failedStaffCount}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-white/30">
                <button
                  onClick={() => {
                    setSelectedPayroll(payroll);
                    setShowDetailsModal(true);
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-white/30 backdrop-blur-md border border-white/50 rounded-lg text-gray-700 hover:bg-white/40 transition-all flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
                {(payroll.status === "pending" || payroll.status === "failed") && (
                  <button
                    onClick={() => {
                      setSelectedPayroll(payroll);
                      setShowProcessModal(true);
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-emerald-600/80 backdrop-blur-md border border-white/30 rounded-lg text-white hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {payroll.status === "failed" ? "Retry" : "Process"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table - Liquid Glass */}
      <div className="hidden lg:block bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/5 via-transparent to-cyan-400/5 rounded-[2rem] pointer-events-none" />
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
        
        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-white/20 backdrop-blur-md text-gray-700 font-medium uppercase text-xs border-b border-white/30">
              <tr>
                <th className="px-6 py-3">Period</th>
                <th className="px-6 py-3">Staff</th>
                <th className="px-6 py-3 text-right">Net Amount</th>
                <th className="px-6 py-3 text-right">Pension</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/15">
              {payrolls.map((payroll) => (
                <tr key={payroll.id} className="hover:bg-white/10 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-800">{payroll.periodLabel}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(payroll.periodStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {new Date(payroll.periodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-800">{payroll.totalStaffCount}</div>
                    <div className="text-xs text-gray-500">
                      <span className="text-emerald-600">✓{payroll.processedStaffCount}</span> <span className="text-red-600">✗{payroll.failedStaffCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-800">{formatCurrency(payroll.totalNetAmount)}</div>
                    <div className="text-xs text-gray-500">Gross: {formatCurrency(payroll.totalGrossAmount)}</div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-emerald-600 whitespace-nowrap">
                    {formatCurrency(payroll.totalPensionAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(payroll.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => {
                          setSelectedPayroll(payroll);
                          setShowDetailsModal(true);
                        }}
                        className="text-emerald-600 hover:text-emerald-900 text-left"
                      >
                        View Details
                      </button>
                      {(payroll.status === "pending" || payroll.status === "failed") && (
                        <button
                          onClick={() => {
                            setSelectedPayroll(payroll);
                            setShowProcessModal(true);
                          }}
                          className="text-emerald-600 hover:text-emerald-900 font-medium text-left"
                        >
                          {payroll.status === "failed" ? "Retry Processing" : "Process Now"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white/20 backdrop-blur-md px-4 py-3 flex items-center justify-between border-t border-white/30 relative z-10">
          <p className="text-sm text-gray-700">
            Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white/25 backdrop-blur-md border border-white/50 rounded-xl hover:bg-white/35 disabled:opacity-50 text-gray-700 text-sm"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white/25 backdrop-blur-md border border-white/50 rounded-xl hover:bg-white/35 disabled:opacity-50 text-gray-700 text-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modals - Keep existing modals as is */}
      {showSuccessModal && (
        <SuccessModal
          isOpen={showSuccessModal}
          message={successMessage}
          onClose={() => setShowSuccessModal(false)}
        />
      )}
    </div>
  );
};

export default PayrollManagementView;