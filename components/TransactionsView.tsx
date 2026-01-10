import React, { useState, useEffect } from "react";
import { Search, Filter, Download, Eye, X, User, Wallet } from "lucide-react";
import {
  transactionsApi,
  Transaction,
  TransactionStats,
  TransactionQueryParams,
} from "../api/transactions";
import { farmersApi, UserFinancialDetails } from "../api/farmers";
import {
  getAllPayrollTransactions,
  PayrollTransaction,
  PaginatedTransactionResponse,
} from "../api/payroll";

// Small helpers
const formatCurrency = (value: number | undefined) => {
  if (value == null) return "₦0";
  return `₦${(value / 100).toLocaleString()}`;
};

const getPageWindow = (current: number, total: number, maxButtons = 5) => {
  if (total <= maxButtons)
    return Array.from({ length: total }, (_, i) => i + 1);
  const half = Math.floor(maxButtons / 2);
  let start = Math.max(1, current - half);
  let end = start + maxButtons - 1;
  if (end > total) {
    end = total;
    start = total - maxButtons + 1;
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Transaction["user"] | null;
  userId: string;
}

const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  user,
  userId,
}) => {
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [userFinancialDetails, setUserFinancialDetails] =
    useState<UserFinancialDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      loadUserData();
    }
  }, [isOpen, userId]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setDetailsLoading(true);

      const [transactionsResponse, financialDetails] = await Promise.all([
        transactionsApi.getUserTransactions(userId, { limit: 5 }),
        user?.type === "farmer"
          ? farmersApi.getFarmerFinancialStatus(userId)
          : Promise.resolve(null),
      ]);

      setUserTransactions(transactionsResponse.transactions);
      setUserFinancialDetails(financialDetails);
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setLoading(false);
      setDetailsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">User Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {user ? (
          <div className="space-y-6">
            {/* User Basic Info */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-green-700" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">{user.name}</h4>
                <p className="text-sm text-gray-600 capitalize">{user.type}</p>
              </div>
            </div>

            {/* Minimalized wallet/financial sections - keep them compact */}
            {detailsLoading ? (
              <div className="p-4 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mb-2"></div>
                <p className="text-sm text-gray-600">
                  Loading wallet information...
                </p>
              </div>
            ) : userFinancialDetails?.wallet ? (
              <div className="border-t pt-4">
                <h5 className="font-medium text-gray-800 mb-3 flex items-center">
                  <Wallet className="w-4 h-4 mr-2" />
                  Wallet Information
                </h5>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Current Balance
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(userFinancialDetails.wallet.balance)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-gray-600">Status</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        userFinancialDetails.wallet.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {userFinancialDetails.wallet.isActive
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              userFinancialDetails && (
                <div className="border-t pt-4">
                  <h5 className="font-medium text-gray-800 mb-3 flex items-center">
                    <Wallet className="w-4 h-4 mr-2" />
                    Wallet Information
                  </h5>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <p className="text-gray-600 text-sm">
                      No wallet found for this user
                    </p>
                  </div>
                </div>
              )
            )}

            {/* Other sections (loans, recent purchases, transactions) kept as is but compact */}

            <div className="border-t pt-4">
              <h5 className="font-medium text-gray-800 mb-2">
                All User Transactions
              </h5>
              {loading ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {userTransactions.length > 0 ? (
                    userTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="p-2 bg-gray-50 rounded text-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-800 capitalize">
                              {transaction.type.replace("_", " ")}
                            </p>
                            <p className="text-gray-600">
                              {transaction.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-800">
                              {formatCurrency(transaction.amount)}
                            </p>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                transaction.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : transaction.status === "pending"
                                  ? "bg-green-50 text-green-700"
                                  : "bg-gray-200 text-gray-800"
                              }`}
                            >
                              {transaction.status}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-400 text-xs mt-1">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No recent transactions
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            User information not available
          </p>
        )}
      </div>
    </div>
  );
};

interface TransactionRowProps {
  transaction: Transaction;
  onUserClick: (user: Transaction["user"], userId: string) => void;
}

// Desktop table row with expandable/truncatable reference
const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  onUserClick,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50 align-top">
        <td className="px-4 py-3 align-top">
          <div className="text-sm text-gray-800 max-w-[220px]">
            <div className="flex items-center">
              <span className="truncate" title={transaction.reference}>
                {transaction.reference}
              </span>
              <button
                onClick={() => setExpanded((s) => !s)}
                className="ml-2 text-gray-400 hover:text-gray-600"
                aria-expanded={expanded}
                aria-label={
                  expanded ? "Collapse reference" : "View full reference"
                }
              >
                {expanded ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {new Date(transaction.createdAt).toLocaleDateString()}
          </div>
        </td>

        <td className="px-4 py-3 align-top">
          {transaction.user ? (
            <button
              onClick={() => onUserClick(transaction.user, transaction.userId)}
              className="text-left hover:text-green-700 transition-colors"
            >
              <div className="text-sm font-medium text-gray-800">
                {transaction.user.name}
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {transaction.user.type}
              </div>
            </button>
          ) : (
            <div className="text-sm text-gray-500">Unknown User</div>
          )}
        </td>

        <td className="px-4 py-3 align-top">
          <div className="text-sm text-gray-800 capitalize">
            {transaction.type.replace("_", " ")}
          </div>
        </td>

        <td className="px-4 py-3 align-top">
          <div className="text-sm font-medium text-gray-800">
            {formatCurrency(transaction.amount)}
          </div>
        </td>

        <td className="px-4 py-3 align-top">
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              transaction.status === "completed"
                ? "bg-green-100 text-green-800"
                : transaction.status === "pending"
                ? "bg-green-50 text-green-700"
                : transaction.status === "failed"
                ? "bg-gray-200 text-gray-800"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {transaction.status}
          </span>
        </td>

        <td className="px-4 py-3 align-top max-w-xs break-words">
          <div className="text-sm text-gray-600">{transaction.description}</div>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-gray-50">
          <td
            colSpan={6}
            className="px-4 py-2 text-sm text-gray-700 break-words"
          >
            <div className="font-medium text-gray-800 mb-1">Full reference</div>
            <div className="text-xs text-gray-700">{transaction.reference}</div>
          </td>
        </tr>
      )}
    </>
  );
};

// Mobile card component so each card can manage its own expanded state
const MobileTxCard: React.FC<{
  tx: Transaction;
  onUserClick: (u: Transaction["user"], id: string) => void;
}> = ({ tx, onUserClick }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-3 bg-gray-50 rounded-lg shadow-sm">
      <div className="flex justify-between items-start">
        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <div
              className="text-sm font-medium text-gray-800 truncate max-w-[160px]"
              title={tx.reference}
            >
              {!expanded ? tx.reference : tx.reference}
            </div>
            <button
              onClick={() => setExpanded((s) => !s)}
              className="text-gray-400 hover:text-gray-600"
            >
              {expanded ? (
                <X className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {expanded && (
            <div className="text-xs text-gray-600 mt-2 break-words">
              {tx.reference}
            </div>
          )}

          <div className="text-xs text-gray-500 truncate mt-1">
            {tx.description}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {new Date(tx.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div className="text-right ml-4">
          <div className="text-sm font-semibold">
            {formatCurrency(tx.amount)}
          </div>
          <div className="text-xs mt-1">
            <span
              className={`inline-block text-xs px-2 py-1 rounded-full ${
                tx.status === "completed"
                  ? "bg-green-100 text-green-800"
                  : tx.status === "pending"
                  ? "bg-green-50 text-green-700"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {tx.status}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <button
          onClick={() => onUserClick(tx.user, tx.userId)}
          className="text-xs text-green-700"
        >
          View user
        </button>
        <div className="text-xs text-gray-500">
          {tx.user?.name || "Unknown"}
        </div>
      </div>
    </div>
  );
};

// Payroll transaction components
const PayrollTransactionRow: React.FC<{ transaction: PayrollTransaction }> = ({
  transaction,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50 align-top">
        <td className="px-4 py-3 align-top">
          <div className="text-sm text-gray-800 max-w-[220px]">
            <div className="flex items-center">
              <span
                className="truncate"
                title={transaction.paymentReference || transaction.id}
              >
                {transaction.paymentReference || transaction.id}
              </span>
              <button
                onClick={() => setExpanded((s) => !s)}
                className="ml-2 text-gray-400 hover:text-gray-600"
                aria-expanded={expanded}
                aria-label={
                  expanded ? "Collapse reference" : "View full reference"
                }
              >
                {expanded ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {new Date(transaction.createdAt).toLocaleDateString()}
          </div>
        </td>

        <td className="px-4 py-3 align-top">
          <div className="text-sm font-medium text-gray-800">
            {transaction.staffName}
          </div>
          <div className="text-xs text-gray-500">{transaction.employeeId}</div>
          <div className="text-xs text-gray-500">{transaction.role}</div>
        </td>

        <td className="px-4 py-3 align-top">
          <div className="text-sm text-gray-800">Payroll</div>
        </td>

        <td className="px-4 py-3 align-top">
          <div className="text-sm font-medium text-gray-800">
            {formatCurrency(transaction.netSalary)}
          </div>
          <div className="text-xs text-gray-500">
            Gross: {formatCurrency(transaction.grossSalary)}
          </div>
        </td>

        <td className="px-4 py-3 align-top">
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              transaction.paymentStatus === "success" ||
              transaction.status === "completed"
                ? "bg-green-100 text-green-800"
                : transaction.paymentStatus === "pending" ||
                  transaction.status === "pending"
                ? "bg-green-50 text-green-700"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            {transaction.paymentStatus || transaction.status}
          </span>
        </td>

        <td className="px-4 py-3 align-top max-w-xs break-words">
          <div className="text-sm text-gray-600">
            Period: {transaction.payrollPeriodLabel}
            {transaction.failedReason && (
              <div className="text-xs text-green-900 mt-1">
                Failed: {transaction.failedReason}
              </div>
            )}
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-gray-50">
          <td colSpan={6} className="px-4 py-2 text-sm text-gray-700">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Gross Salary:</strong>{" "}
                {formatCurrency(transaction.grossSalary)}
              </div>
              <div>
                <strong>Net Salary:</strong>{" "}
                {formatCurrency(transaction.netSalary)}
              </div>
              <div>
                <strong>Pension (Employee):</strong>{" "}
                {formatCurrency(transaction.pensionEmployeeContribution)}
              </div>
              <div>
                <strong>Pension (Employer):</strong>{" "}
                {formatCurrency(transaction.pensionEmployerContribution)}
              </div>
              <div>
                <strong>Tax Deduction:</strong>{" "}
                {formatCurrency(transaction.taxDeduction)}
              </div>
              <div>
                <strong>Other Deductions:</strong>{" "}
                {formatCurrency(transaction.otherDeductions)}
              </div>
              <div>
                <strong>Savings Deduction:</strong>{" "}
                {formatCurrency(transaction.savingsDeduction)}
              </div>
              <div>
                <strong>Payment Reference:</strong>{" "}
                {transaction.paymentReference}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const PayrollMobileTxCard: React.FC<{ tx: PayrollTransaction }> = ({ tx }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-3 bg-gray-50 rounded-lg shadow-sm">
      <div className="flex justify-between items-start">
        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <div
              className="text-sm font-medium text-gray-800 truncate max-w-[160px]"
              title={tx.paymentReference || tx.id}
            >
              {!expanded
                ? tx.paymentReference || tx.id
                : tx.paymentReference || tx.id}
            </div>
            <button
              onClick={() => setExpanded((s) => !s)}
              className="text-gray-400 hover:text-gray-600"
            >
              {expanded ? (
                <X className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {expanded && (
            <div className="text-xs text-gray-600 mt-2 break-words">
              {tx.paymentReference || tx.id}
            </div>
          )}

          <div className="text-xs text-gray-500 truncate mt-1">
            {tx.staffName} - {tx.role}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Period: {tx.payrollPeriodLabel}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {new Date(tx.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div className="text-right ml-4">
          <div className="text-sm font-semibold">
            {formatCurrency(tx.netSalary)}
          </div>
          <div className="text-xs text-gray-500">
            Gross: {formatCurrency(tx.grossSalary)}
          </div>
          <div className="text-xs mt-1">
            <span
              className={`inline-block text-xs px-2 py-1 rounded-full ${
                tx.paymentStatus === "success" || tx.status === "completed"
                  ? "bg-green-100 text-green-800"
                  : tx.paymentStatus === "pending" || tx.status === "pending"
                  ? "bg-green-50 text-green-700"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {tx.paymentStatus || tx.status}
            </span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <strong>Pension (Emp):</strong>{" "}
              {formatCurrency(tx.pensionEmployeeContribution)}
            </div>
            <div>
              <strong>Pension (Empr):</strong>{" "}
              {formatCurrency(tx.pensionEmployerContribution)}
            </div>
            <div>
              <strong>Tax:</strong> {formatCurrency(tx.taxDeduction)}
            </div>
            <div>
              <strong>Other Ded:</strong> {formatCurrency(tx.otherDeductions)}
            </div>
            <div>
              <strong>Savings:</strong> {formatCurrency(tx.savingsDeduction)}
            </div>
            <div>
              <strong>Employee ID:</strong> {tx.employeeId}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const TransactionsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "all" | "wallet" | "loans" | "purchases" | "payroll"
  >("all");
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data cache for all tabs
  const [transactionsCache, setTransactionsCache] = useState<{
    all?: { transactions: Transaction[]; pagination: any };
    wallet?: { transactions: Transaction[]; pagination: any };
    loans?: { transactions: Transaction[]; pagination: any };
    purchases?: { transactions: Transaction[]; pagination: any };
    payroll?: { transactions: Transaction[]; pagination: any };
  }>({});

  const [payrollTransactions, setPayrollTransactions] = useState<
    PayrollTransaction[]
  >([]);
  const [payrollPagination, setPayrollPagination] = useState<any>({
    total: 0,
    totalPages: 1,
    currentPage: 1,
  });

  // Filter state
  const [filters, setFilters] = useState<TransactionQueryParams>({
    page: 1,
    limit: 20,
    search: "",
    status: "",
    type: "",
    userType: "",
    startDate: "",
    endDate: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Modal state
  const [selectedUser, setSelectedUser] = useState<{
    user: Transaction["user"];
    userId: string;
  } | null>(null);

  // Filter panel state
  const [showFilters, setShowFilters] = useState(false);

  // Get current tab data
  const currentTabData = transactionsCache[activeTab];
  const transactions =
    activeTab === "payroll"
      ? payrollTransactions
      : currentTabData?.transactions || [];
  const pagination =
    activeTab === "payroll"
      ? payrollPagination
      : currentTabData?.pagination || {
          total: 0,
          totalPages: 1,
          currentPage: 1,
        };

  // Initial load - fetch all data at once (keeps previous behavior)
  useEffect(() => {
    loadAllTransactionsAndStats();
  }, []);

  // Load current tab when filters change
  useEffect(() => {
    if (!initialLoading) {
      loadCurrentTabTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // When user switches tab, load that tab if not cached
  useEffect(() => {
    if (!transactionsCache[activeTab]) {
      loadCurrentTabTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadAllTransactionsAndStats = async () => {
    try {
      setInitialLoading(true);
      setError(null);

      const [
        statsResponse,
        allTransactionsResponse,
        walletTransactionsResponse,
        loanTransactionsResponse,
        purchaseTransactionsResponse,
        payrollTransactionsResponse,
      ] = await Promise.all([
        transactionsApi.getTransactionStats(),
        transactionsApi.getAllTransactions(filters),
        transactionsApi.getWalletTransactions(filters),
        transactionsApi.getLoanTransactions(filters),
        transactionsApi.getPurchaseTransactions(filters),
        getAllPayrollTransactions(filters),
      ]);

      setStats(statsResponse);
      setTransactionsCache({
        all: {
          transactions: allTransactionsResponse.transactions,
          pagination: {
            total: allTransactionsResponse.total,
            totalPages: allTransactionsResponse.totalPages,
            currentPage: allTransactionsResponse.page,
          },
        },
        wallet: {
          transactions: walletTransactionsResponse.transactions,
          pagination: {
            total: walletTransactionsResponse.total,
            totalPages: walletTransactionsResponse.totalPages,
            currentPage: walletTransactionsResponse.page,
          },
        },
        loans: {
          transactions: loanTransactionsResponse.transactions,
          pagination: {
            total: loanTransactionsResponse.total,
            totalPages: loanTransactionsResponse.totalPages,
            currentPage: loanTransactionsResponse.page,
          },
        },
        purchases: {
          transactions: purchaseTransactionsResponse.transactions,
          pagination: {
            total: purchaseTransactionsResponse.total,
            totalPages: purchaseTransactionsResponse.totalPages,
            currentPage: purchaseTransactionsResponse.page,
          },
        },
        payroll: {
          transactions: payrollTransactionsResponse.transactions,
          pagination: {
            total: payrollTransactionsResponse.total,
            totalPages: payrollTransactionsResponse.totalPages,
            currentPage: payrollTransactionsResponse.page,
          },
        },
      });

      // Set payroll state separately since it has different structure
      setPayrollTransactions(payrollTransactionsResponse.transactions);
      setPayrollPagination({
        total: payrollTransactionsResponse.total,
        totalPages: payrollTransactionsResponse.totalPages,
        currentPage: payrollTransactionsResponse.page,
      });
    } catch (error: any) {
      console.error("Failed to load transaction data:", error);
      setError("Failed to load transactions. Please try again.");
    } finally {
      setInitialLoading(false);
    }
  };

  const loadCurrentTabTransactions = async () => {
    try {
      setTabLoading(true);
      setError(null);

      let response;
      switch (activeTab) {
        case "wallet":
          response = await transactionsApi.getWalletTransactions(filters);
          break;
        case "loans":
          response = await transactionsApi.getLoanTransactions(filters);
          break;
        case "purchases":
          response = await transactionsApi.getPurchaseTransactions(filters);
          break;
        case "payroll":
          const payrollResponse = await getAllPayrollTransactions(filters);
          setPayrollTransactions(payrollResponse.transactions);
          setPayrollPagination({
            total: payrollResponse.total,
            totalPages: payrollResponse.totalPages,
            currentPage: payrollResponse.page,
          });
          setTabLoading(false);
          return; // Early return since we handle payroll differently
        default:
          response = await transactionsApi.getAllTransactions(filters);
      }

      setTransactionsCache((prev) => ({
        ...prev,
        [activeTab]: {
          transactions: response.transactions,
          pagination: {
            total: response.total,
            totalPages: response.totalPages,
            currentPage: response.page,
          },
        },
      }));
    } catch (error: any) {
      console.error("Failed to load transactions:", error);
      setError("Failed to load transactions. Please try again.");
    } finally {
      setTabLoading(false);
    }
  };

  const handleFilterChange = (
    key: keyof TransactionQueryParams,
    value: string
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  const handleUserClick = (user: Transaction["user"], userId: string) => {
    setSelectedUser({ user, userId });
  };

  const tabs = [
    {
      id: "all",
      label: "All Transactions",
      count: stats?.totalTransactions || 0,
    },
    { id: "wallet", label: "Wallet", count: stats?.byType?.wallet || 0 },
    { id: "loans", label: "Loans", count: stats?.byType?.loan || 0 },
    {
      id: "purchases",
      label: "Purchases",
      count: stats?.byType?.purchase || 0,
    },
    { id: "payroll", label: "Payroll", count: stats?.byType?.payroll || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
          Transactions
        </h2>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>

          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">Total Transactions</div>
            <div className="text-2xl font-bold text-gray-800">
              {stats.totalTransactions.toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">Total Amount</div>
            <div className="text-2xl font-bold text-gray-800">
              {formatCurrency(stats.totalAmount)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">Completed</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.completedTransactions.toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">Pending</div>
            <div className="text-2xl font-bold text-green-500">
              {stats.pendingTransactions.toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">Failed</div>
            <div className="text-2xl font-bold text-green-900">
              {stats.failedTransactions.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search reference, description..."
                  value={filters.search || ""}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status || ""}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Type
              </label>
              <select
                value={filters.userType || ""}
                onChange={(e) => handleFilterChange("userType", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Users</option>
                <option value="farmer">Farmers</option>
                <option value="buyer">Buyers</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={filters.startDate || ""}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <input
                  type="date"
                  value={filters.endDate || ""}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-green-600 text-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {tab.count.toLocaleString()}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Transactions Table / Cards - responsive: cards on small screens to prevent horizontal scroll */}
      <div className="bg-white rounded-lg border border-gray-200">
        {error && (
          <div className="p-4 bg-green-50 border-b border-green-200">
            <p className="text-green-900 text-sm">{error}</p>
          </div>
        )}

        {initialLoading || tabLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4"></div>
            <p className="text-gray-600">
              {initialLoading ? "Loading transactions..." : "Updating..."}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile: simple cards */}
            <div className="block md:hidden space-y-3 p-3">
              {transactions.length > 0 ? (
                activeTab === "payroll" ? (
                  (transactions as PayrollTransaction[]).map((tx) => (
                    <PayrollMobileTxCard key={tx.id} tx={tx} />
                  ))
                ) : (
                  (transactions as Transaction[]).map((tx) => (
                    <MobileTxCard
                      key={tx.id}
                      tx={tx}
                      onUserClick={handleUserClick}
                    />
                  ))
                )
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No transactions found
                </div>
              )}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block w-full overflow-visible">
              <table className="w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {activeTab === "payroll"
                        ? "Payment Reference"
                        : "Reference"}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {activeTab === "payroll" ? "Staff Member" : "User"}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {activeTab === "payroll" ? "Net Salary" : "Amount"}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {activeTab === "payroll"
                        ? "Payroll Period"
                        : "Description"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length > 0 ? (
                    activeTab === "payroll" ? (
                      (transactions as PayrollTransaction[]).map(
                        (transaction) => (
                          <PayrollTransactionRow
                            key={transaction.id}
                            transaction={transaction}
                          />
                        )
                      )
                    ) : (
                      (transactions as Transaction[]).map((transaction) => (
                        <TransactionRow
                          key={transaction.id}
                          transaction={transaction}
                          onUserClick={handleUserClick}
                        />
                      ))
                    )
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        No transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="text-sm text-gray-500 w-full md:w-auto">
                  Showing{" "}
                  {(pagination.currentPage - 1) * (filters.limit || 20) + 1} to{" "}
                  {Math.min(
                    pagination.currentPage * (filters.limit || 20),
                    pagination.total
                  )}{" "}
                  of {pagination.total} transactions
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-3 py-1 rounded border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {getPageWindow(
                    pagination.currentPage,
                    pagination.totalPages
                  ).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 rounded text-sm ${
                        page === pagination.currentPage
                          ? "bg-green-600 text-white"
                          : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-3 py-1 rounded border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Modal */}
      <UserModal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        user={selectedUser?.user || null}
        userId={selectedUser?.userId || ""}
      />
    </div>
  );
};

export default TransactionsView;
