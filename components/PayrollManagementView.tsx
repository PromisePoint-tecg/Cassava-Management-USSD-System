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
} from "../api/payroll";
import { adminApi, type FundOrganizationWalletData } from "../api/admin";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorMessage } from "./ErrorMessage";
import { SuccessModal } from "./SuccessModal";

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
      console.log("Fetching organization wallet...");
      const wallet = await adminApi.getOrganizationWallet();
      console.log("Organization wallet received:", wallet);
      setOrganizationWallet(wallet);
    } catch (err: any) {
      console.error("Failed to fetch organization wallet:", err);
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
      console.log("Payroll API response:", response);
      setPayrolls(response.payrolls || []);
      setTotalPages(response.pages || 1);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load payrolls";
      setError(errorMessage);
      console.error("Error fetching payrolls:", err);
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
      console.error("Error creating payroll:", err);
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
      console.log("Funding organization wallet with:", data);
      const response = await adminApi.fundOrganizationWallet(data);
      console.log("Fund wallet response:", response);
      const newBalance = response?.wallet?.balance || response?.balance || 0;
      setSuccessMessage(
        `Organization wallet funded successfully! New balance: ₦${(
          newBalance / 100
        ).toLocaleString()}`
      );
      setShowSuccessModal(true);
      setShowFundWalletModal(false);
      // Refresh wallet balance
      await fetchOrganizationWallet();
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fund organization wallet";
      setError(errorMessage);
      console.error("Error funding organization wallet:", err);
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
      pending: (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          Pending
        </span>
      ),
      processing: (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
          Processing
        </span>
      ),
      completed: (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
          Completed
        </span>
      ),
      failed: (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          Failed
        </span>
      ),
    };
    return badges[status as keyof typeof badges] || status;
  };

  if (loading && payrolls.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payroll Management
        </h1>
        <p className="text-gray-600">
          Create and process monthly payroll for staff
        </p>
      </div>

      {/* Error Message with improved styling */}
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg animate-in fade-in duration-300">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-3 flex-shrink-0 text-red-500 hover:text-red-700"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Filter */}
          <div className="flex gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowFundWalletModal(true)}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap"
            >
              💰 Fund Payroll Wallet
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
            >
              + Create Payroll
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg shadow-sm border border-emerald-200 p-5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-emerald-700">Payroll Wallet Balance</div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          </div>
          <div className="mt-2">
            {walletLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                <span className="text-lg text-emerald-600 font-medium">Loading...</span>
              </div>
            ) : walletError ? (
              <div className="text-sm text-red-600 font-medium">{walletError}</div>
            ) : (
              <div className="text-2xl font-bold text-emerald-900 tracking-tight break-words">
                {formatCurrency(organizationWallet?.balance || 0)}
              </div>
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm text-gray-600">Pending</div>
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          </div>
          <div className="text-3xl font-bold text-gray-600">
            {payrolls.filter((p) => p.status === "pending").length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm text-gray-600">Completed</div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          </div>
          <div className="text-3xl font-bold text-emerald-600">
            {payrolls.filter((p) => p.status === "completed").length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm text-gray-600">Failed</div>
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
          </div>
          <div className="text-3xl font-bold text-gray-700">
            {payrolls.filter((p) => p.status === "failed").length}
          </div>
        </div>
      </div>

      {/* Payroll Table - Full width */}
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow overflow-hidden min-h-0">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Payroll Records</h2>
        </div>
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pension
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payrolls.map((payroll) => (
                <tr key={payroll.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {payroll.periodLabel}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(payroll.periodStart).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )}{" "}
                        -{" "}
                        {new Date(payroll.periodEnd).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {payroll.totalStaffCount}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="text-emerald-600">
                        ✓{payroll.processedStaffCount}
                      </span>{" "}
                      <span className="text-gray-600">
                        ✗{payroll.failedStaffCount}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(payroll.totalNetAmount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Gross: {formatCurrency(payroll.totalGrossAmount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-emerald-600 whitespace-nowrap">
                    {formatCurrency(payroll.totalPensionAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(payroll.status)}
                  </td>
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
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Page <span className="font-medium">{page}</span> of{" "}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showDetailsModal && selectedPayroll && (
        <PayrollDetailsModal
          payroll={selectedPayroll}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedPayroll(null);
          }}
        />
      )}

      {showTransactionsModal && selectedPayroll && (
        <PayrollTransactionsModal
          payrollId={selectedPayroll.id}
          periodLabel={selectedPayroll.periodLabel}
          onClose={() => {
            setShowTransactionsModal(false);
            setSelectedPayroll(null);
          }}
          onRetry={handleRetryTransaction}
        />
      )}

      {showCreateModal && (
        <CreatePayrollModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePayroll}
        />
      )}

      {showProcessModal && selectedPayroll && (
        <ProcessPayrollModal
          payroll={selectedPayroll}
          onClose={() => {
            setShowProcessModal(false);
            setSelectedPayroll(null);
          }}
          onConfirm={() => handleProcessPayroll(selectedPayroll.id)}
        />
      )}

      {showStatisticsModal && statistics && (
        <PayrollStatisticsModal
          statistics={statistics}
          onClose={() => {
            setShowStatisticsModal(false);
            setStatistics(null);
          }}
        />
      )}

      {showSuccessModal && (
        <SuccessModal
          isOpen={showSuccessModal}
          message={successMessage}
          onClose={() => setShowSuccessModal(false)}
        />
      )}

      {showFundWalletModal && (
        <FundWalletModal
          isOpen={showFundWalletModal}
          onClose={() => setShowFundWalletModal(false)}
          onSubmit={handleFundOrganizationWallet}
        />
      )}
    </div>
  );
};

// Payroll Details Modal
const PayrollDetailsModal: React.FC<{
  payroll: Payroll;
  onClose: () => void;
}> = ({ payroll, onClose }) => {
  const formatCurrency = (amount: number) => {
    const safeAmount =
      typeof amount === "number" && !isNaN(amount) ? amount : 0;
    return `₦${(safeAmount / 100).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Payroll Details
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Period Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Period Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Period Label</label>
                  <p className="text-sm font-medium text-gray-900">
                    {payroll.periodLabel}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Status</label>
                  <p className="text-sm font-medium text-gray-900">
                    {payroll.status}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Period Start</label>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(payroll.periodStart).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Period End</label>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(payroll.periodEnd).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Automated</label>
                  <p className="text-sm font-medium text-gray-900">
                    {payroll.isAutomated ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </div>

            {/* Staff Statistics */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Staff Statistics
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Total Staff</label>
                  <p className="text-sm font-medium text-gray-900">
                    {payroll.totalStaffCount}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Processed</label>
                  <p className="text-sm font-medium text-green-600">
                    {payroll.processedStaffCount}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Failed</label>
                  <p className="text-sm font-medium text-red-600">
                    {payroll.failedStaffCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Financial Summary
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">
                    Total Gross Amount
                  </label>
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(payroll.totalGrossAmount)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">
                    Total Net Amount
                  </label>
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(payroll.totalNetAmount)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Total Pension</label>
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(payroll.totalPensionAmount)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Total Tax</label>
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(payroll.totalTaxAmount)}
                  </p>
                </div>
              </div>
            </div>

            {/* Processing Details */}
            {payroll.processedAt && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Processing Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">
                      Processed At
                    </label>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(payroll.processedAt).toLocaleString()}
                    </p>
                  </div>
                  {payroll.completedAt && (
                    <div>
                      <label className="text-sm text-gray-600">
                        Completed At
                      </label>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(payroll.completedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error Logs */}
            {payroll.errorLogs && payroll.errorLogs.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Error Logs
                </h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-40 overflow-y-auto">
                  {payroll.errorLogs.map((log, idx) => (
                    <div key={idx} className="text-sm text-red-800 mb-2">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Payroll Transactions Modal
const PayrollTransactionsModal: React.FC<{
  payrollId: string;
  periodLabel: string;
  onClose: () => void;
  onRetry: (transactionId: string) => void;
}> = ({ payrollId, periodLabel, onClose, onRetry }) => {
  const [transactions, setTransactions] = useState<PayrollTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTransactions();
  }, [page]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await getPayrollTransactions(payrollId, {
        page,
        limit: 10,
      });
      setTransactions(response.transactions);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
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
      pending: (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          Pending
        </span>
      ),
      processing: (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
          Processing
        </span>
      ),
      completed: (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
          Completed
        </span>
      ),
      failed: (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          Failed
        </span>
      ),
    };
    return badges[status as keyof typeof badges] || status;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Payroll Transactions
              </h2>
              <p className="text-sm text-gray-600">{periodLabel}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="overflow-y-auto max-h-96">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Staff
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Net Salary
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                        Pension
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((txn) => (
                      <tr key={txn.id} className="hover:bg-gray-50">
                        <td className="px-3 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {txn.staffFullName}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {txn.staffEmployeeId}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(txn.netSalary)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Gross: {formatCurrency(txn.grossSalary)}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right text-sm text-gray-900 hidden md:table-cell">
                          {formatCurrency(txn.totalPensionContribution)}
                        </td>
                        <td className="px-3 py-3">
                          {getStatusBadge(txn.paymentStatus)}
                        </td>
                        <td className="px-3 py-3 text-sm font-medium">
                          {txn.paymentStatus === "failed" && (
                            <button
                              onClick={() => onRetry(txn.id)}
                              className="text-emerald-600 hover:text-emerald-900 text-xs"
                            >
                              Retry
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex justify-between items-center">
                <p className="text-sm text-gray-700">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Create Payroll Modal
const CreatePayrollModal: React.FC<{
  onClose: () => void;
  onSubmit: (data: CreatePayrollDto) => void;
}> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState<CreatePayrollDto>({
    period_start: "",
    period_end: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create Payroll</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Period Start
              </label>
              <input
                type="date"
                required
                value={formData.period_start}
                onChange={(e) =>
                  setFormData({ ...formData, period_start: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Period End
              </label>
              <input
                type="date"
                required
                value={formData.period_end}
                onChange={(e) =>
                  setFormData({ ...formData, period_end: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-sm text-emerald-800">
                This will create a payroll period for all active, approved staff
                members. The payroll will be in "pending" status and can be
                processed after creation.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Process Payroll Modal
const ProcessPayrollModal: React.FC<{
  payroll: Payroll;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ payroll, onClose, onConfirm }) => {
  const formatCurrency = (amount: number) => {
    const safeAmount =
      typeof amount === "number" && !isNaN(amount) ? amount : 0;
    return `₦${(safeAmount / 100).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Process Payroll
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-sm text-emerald-800 font-medium mb-2">
                Confirm Payroll Processing
              </p>
              <p className="text-sm text-emerald-700">
                You are about to process payroll for{" "}
                <strong>{payroll.periodLabel}</strong>
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Staff:</span>
                <span className="font-medium text-gray-900">
                  {payroll.totalStaffCount}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Net Amount:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(payroll.totalNetAmount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Pension Amount:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(payroll.totalPensionAmount)}
                </span>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                Make sure the organization wallet has sufficient funds before
                processing. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Confirm & Process
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Payroll Statistics Modal
const PayrollStatisticsModal: React.FC<{
  statistics: Stats;
  onClose: () => void;
}> = ({ statistics, onClose }) => {
  const formatCurrency = (amount: number) => {
    const safeAmount =
      typeof amount === "number" && !isNaN(amount) ? amount : 0;
    return `₦${(safeAmount / 100).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Payroll Statistics
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Staff Stats */}
            <div className="bg-emerald-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-emerald-900 mb-3">
                Staff Statistics
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-700">Total Staff:</span>
                  <span className="font-medium text-emerald-900">
                    {statistics.totalStaffCount || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-700">Processed:</span>
                  <span className="font-medium text-emerald-600">
                    {statistics.processedCount || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-700">Failed:</span>
                  <span className="font-medium text-gray-600">
                    {statistics.failedCount || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-700">Success Rate:</span>
                  <span className="font-medium text-emerald-900">
                    {(typeof statistics.successRate === "number"
                      ? statistics.successRate
                      : 0
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Stats */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-green-900 mb-3">
                Financial Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Gross Amount:</span>
                  <span className="font-medium text-green-900">
                    {formatCurrency(statistics.totalGrossAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Net Amount:</span>
                  <span className="font-medium text-green-900">
                    {formatCurrency(statistics.totalNetAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Pension:</span>
                  <span className="font-medium text-green-900">
                    {formatCurrency(statistics.totalPensionAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Tax:</span>
                  <span className="font-medium text-green-900">
                    {formatCurrency(statistics.totalTaxAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Averages */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-purple-900 mb-3">
                Average Amounts
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-purple-700">Avg Gross:</span>
                  <span className="font-medium text-purple-900">
                    {formatCurrency(statistics.averageGrossSalary)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-purple-700">Avg Net:</span>
                  <span className="font-medium text-purple-900">
                    {formatCurrency(statistics.averageNetSalary)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-purple-700">Avg Pension:</span>
                  <span className="font-medium text-purple-900">
                    {formatCurrency(statistics.averagePensionContribution)}
                  </span>
                </div>
              </div>
            </div>

            {/* Pension Breakdown */}
            <div className="bg-orange-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-orange-900 mb-3">
                Pension Breakdown
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-orange-700">Employee (8%):</span>
                  <span className="font-medium text-orange-900">
                    {formatCurrency(statistics.totalEmployeePension)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-orange-700">Employer (10%):</span>
                  <span className="font-medium text-orange-900">
                    {formatCurrency(statistics.totalEmployerPension)}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-orange-200 pt-2">
                  <span className="text-orange-700 font-semibold">Total:</span>
                  <span className="font-semibold text-orange-900">
                    {formatCurrency(statistics.totalPensionAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FundWalletModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FundOrganizationWalletData) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<FundOrganizationWalletData>({
    amount: 0,
    reason: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount < 1000) {
      alert("Minimum amount is ₦1,000");
      return;
    }
    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData({ amount: 0, reason: "" });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Fund Organization Wallet
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₦) *
              </label>
              <input
                type="number"
                required
                min="1000"
                step="100"
                value={formData.amount || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="Enter amount in Naira (minimum ₦1,000)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum: ₦1,000</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason (Optional)
              </label>
              <textarea
                value={formData.reason || ""}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="Describe why you're funding the organization wallet"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                disabled={loading || formData.amount < 1000}
              >
                {loading ? "Funding..." : "Fund Wallet"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PayrollManagementView;
