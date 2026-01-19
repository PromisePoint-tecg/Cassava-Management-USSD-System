import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  X, 
  User, 
  Wallet, 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
  Loader2
} from "lucide-react";

// Mock API functions for demo
const transactionsApi = {
  getTransactionStats: async () => ({
    totalTransactions: 1250,
    totalAmount: 45000000,
    completedTransactions: 980,
    pendingTransactions: 150,
    failedTransactions: 120,
    byType: {
      wallet: 450,
      loan: 320,
      purchase: 280,
      payroll: 150,
      organization: 50,
    },
  }),
  getAllTransactions: async (filters: any) => ({
    transactions: generateMockTransactions(20),
    total: 1250,
    totalPages: 63,
    page: filters.page || 1,
  }),
  getWalletTransactions: async (filters: any) => ({
    transactions: generateMockTransactions(15, "wallet"),
    total: 450,
    totalPages: 23,
    page: filters.page || 1,
  }),
  getLoanTransactions: async (filters: any) => ({
    transactions: generateMockTransactions(15, "loan"),
    total: 320,
    totalPages: 16,
    page: filters.page || 1,
  }),
  getPurchaseTransactions: async (filters: any) => ({
    transactions: generateMockTransactions(15, "purchase"),
    total: 280,
    totalPages: 14,
    page: filters.page || 1,
  }),
  getOrganizationTransactions: async (filters: any) => ({
    transactions: generateMockTransactions(10, "organization"),
    total: 50,
    totalPages: 3,
    page: filters.page || 1,
  }),
  getUserTransactions: async (userId: string, params: any) => ({
    transactions: generateMockTransactions(5),
    total: 5,
  }),
};

const farmersApi = {
  getFarmerFinancialStatus: async (userId: string) => ({
    wallet: {
      balance: 2500000,
      isActive: true,
    },
  }),
};

const getAllPayrollTransactions = async (filters: any) => ({
  transactions: generateMockPayrollTransactions(15),
  total: 150,
  totalPages: 8,
  page: filters.page || 1,
});

function generateMockTransactions(count: number, type?: string) {
  const types = type ? [type] : ["wallet", "loan", "purchase", "organization"];
  const statuses = ["completed", "pending", "failed"];
  const users = [
    { name: "John Doe", type: "farmer" },
    { name: "Jane Smith", type: "buyer" },
    { name: "Bob Johnson", type: "farmer" },
    { name: "Alice Williams", type: "buyer" },
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `txn_${Date.now()}_${i}`,
    reference: `REF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    userId: `user_${i}`,
    user: users[i % users.length],
    type: types[Math.floor(Math.random() * types.length)],
    amount: Math.floor(Math.random() * 500000) + 10000,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    description: `Transaction for ${types[Math.floor(Math.random() * types.length)]} service`,
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}

function generateMockPayrollTransactions(count: number) {
  const statuses = ["success", "pending", "failed"];
  const roles = ["Farm Manager", "Accountant", "Field Worker", "Administrator"];

  return Array.from({ length: count }, (_, i) => ({
    id: `pay_${Date.now()}_${i}`,
    paymentReference: `PAY-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    employeeId: `EMP-${1000 + i}`,
    staffName: `Employee ${i + 1}`,
    role: roles[i % roles.length],
    grossSalary: Math.floor(Math.random() * 300000) + 100000,
    netSalary: Math.floor(Math.random() * 250000) + 80000,
    pensionEmployeeContribution: 5000,
    pensionEmployerContribution: 7000,
    taxDeduction: 15000,
    otherDeductions: 2000,
    savingsDeduction: 10000,
    paymentStatus: statuses[Math.floor(Math.random() * statuses.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    payrollPeriodLabel: "December 2024",
    failedReason: i % 5 === 0 ? "Insufficient funds" : null,
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}

// Helper functions
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
  user: any | null;
  userId: string;
}

const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  user,
  userId,
}) => {
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  const [userFinancialDetails, setUserFinancialDetails] = useState<any | null>(null);
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden border border-white/60 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none rounded-[2rem]" />
        <div className="px-6 py-4 border-b border-white/40 bg-gradient-to-r from-[#066f48]/15 to-cyan-400/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1/2 h-full bg-white/20 blur-xl rounded-full pointer-events-none" />
          <div className="flex justify-between items-center relative z-10">
            <h3 className="text-lg font-bold text-[#066f48]">User Details</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-white/50 rounded-lg transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-6 relative z-10 max-h-[80vh] overflow-y-auto">
          {user ? (
            <div className="space-y-6">
              {/* User Basic Info */}
              <div className="flex items-center space-x-3 p-4 bg-white/40 backdrop-blur-md rounded-xl border border-white/30">
                <div className="w-12 h-12 bg-[#066f48]/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-[#066f48]" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-medium text-gray-800 truncate">{user.name}</h4>
                  <p className="text-sm text-gray-600 capitalize">{user.type}</p>
                </div>
              </div>

              {/* Wallet Information */}
              {detailsLoading ? (
                <div className="p-4 text-center bg-white/30 rounded-xl">
                  <Loader2 className="w-6 h-6 animate-spin text-[#066f48] mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Loading wallet...</p>
                </div>
              ) : userFinancialDetails?.wallet ? (
                <div className="border-t border-white/20 pt-4">
                  <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-[#066f48]" />
                    Wallet Information
                  </h5>
                  <div className="bg-green-50/80 p-3 rounded-xl backdrop-blur-sm border border-green-200/50">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Current Balance</span>
                      <span className="text-lg font-bold text-green-700">
                        {formatCurrency(userFinancialDetails.wallet.balance)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        userFinancialDetails.wallet.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {userFinancialDetails.wallet.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                userFinancialDetails && (
                  <div className="border-t border-white/20 pt-4">
                    <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-[#066f48]" />
                      Wallet Information
                    </h5>
                    <div className="bg-gray-50/80 p-3 rounded-xl text-center backdrop-blur-sm border border-gray-200/50">
                      <p className="text-gray-600 text-sm">No wallet found</p>
                    </div>
                  </div>
                )
              )}

              {/* Recent Transactions */}
              <div className="border-t border-white/20 pt-4">
                <h5 className="font-medium text-gray-800 mb-2">Recent Transactions</h5>
                {loading ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-[#066f48] mx-auto" />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {userTransactions.length > 0 ? (
                      userTransactions.map((transaction: any) => (
                        <div key={transaction.id} className="p-3 bg-white/40 backdrop-blur-sm rounded-xl border border-white/30 text-sm">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-800 capitalize truncate">{transaction.type.replace("_", " ")}</p>
                              <p className="text-gray-600 text-xs truncate">{transaction.description}</p>
                              <p className="text-gray-400 text-xs mt-1">{new Date(transaction.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-medium text-gray-800 whitespace-nowrap">{formatCurrency(transaction.amount)}</p>
                              <span className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${
                                transaction.status === "completed" ? "bg-green-100 text-green-800" 
                                : transaction.status === "pending" ? "bg-yellow-100 text-yellow-700" 
                                : "bg-red-100 text-red-800"
                              }`}>
                                {transaction.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No recent transactions</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">User information not available</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Mobile card with expandable details
const MobileTxCard: React.FC<{
  tx: any;
  onUserClick: (u: any, id: string) => void;
}> = ({ tx, onUserClick }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white/15 backdrop-blur-lg rounded-[1.5rem] border border-white/50 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_2px_rgba(255,255,255,0.4)_inset] p-4 relative overflow-hidden hover:bg-white/20 transition-all duration-300">
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[1.5rem] pointer-events-none" />
      <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/25 blur-2xl rounded-full pointer-events-none" />
      
      {/* Top section - always visible */}
      <div className="space-y-2.5 relative z-10">
        {/* Reference and amount */}
        <div className="flex justify-between items-start gap-2 min-w-0">
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-gray-800 truncate" title={tx.reference}>
                {tx.reference}
              </p>
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                aria-label={expanded ? "Show less" : "Show more"}
              >
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-0.5">
              {new Date(tx.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right flex-shrink-0 ml-2">
            <p className="text-sm font-bold text-gray-800 whitespace-nowrap">
              {formatCurrency(tx.amount)}
            </p>
            <span className={`inline-block text-xs px-1.5 py-0.5 rounded-full mt-1 ${
              tx.status === "completed" ? "bg-green-100 text-green-800" 
              : tx.status === "pending" ? "bg-yellow-100 text-yellow-700" 
              : "bg-red-100 text-red-800"
            }`}>
              {tx.status}
            </span>
          </div>
        </div>

        {/* Type and User */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/20 min-w-0">
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-xs text-gray-500">Type</p>
            <p className="text-sm text-gray-800 capitalize truncate">
              {tx.type.replace("_", " ")}
            </p>
          </div>
          <button
            onClick={() => onUserClick(tx.user, tx.userId)}
            className="text-xs text-[#066f48] hover:text-[#066f48]/80 font-medium flex-shrink-0 whitespace-nowrap"
          >
            View User →
          </button>
        </div>
      </div>

      {/* Expandable section */}
      {expanded && (
        <div className="mt-2.5 pt-2.5 border-t border-white/20 space-y-2 relative z-10">
          <div>
            <p className="text-xs text-gray-500">Full Reference</p>
            <p className="text-xs text-gray-700 break-all mt-0.5">{tx.reference}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Description</p>
            <p className="text-xs text-gray-700 mt-0.5 break-words">{tx.description}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">User</p>
            <p className="text-xs text-gray-700 mt-0.5 break-words">
              {tx.user?.name || "Unknown"} ({tx.user?.type || "N/A"})
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Payroll mobile card
const PayrollMobileTxCard: React.FC<{ tx: any }> = ({ tx }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white/15 backdrop-blur-lg rounded-[1.5rem] border border-white/50 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_2px_rgba(255,255,255,0.4)_inset] p-4 relative overflow-hidden hover:bg-white/20 transition-all duration-300">
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[1.5rem] pointer-events-none" />
      <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/25 blur-2xl rounded-full pointer-events-none" />
      
      {/* Top section */}
      <div className="space-y-2.5 relative z-10">
        {/* Reference and amount */}
        <div className="flex justify-between items-start gap-2 min-w-0">
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-gray-800 truncate" title={tx.paymentReference || tx.id}>
                {tx.paymentReference || tx.id}
              </p>
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-0.5">
              {new Date(tx.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right flex-shrink-0 ml-2">
            <p className="text-sm font-bold text-gray-800 whitespace-nowrap">
              {formatCurrency(tx.netSalary)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Net</p>
          </div>
        </div>

        {/* Staff info */}
        <div className="pt-2 border-t border-white/20 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="text-sm font-medium text-gray-800 truncate">{tx.staffName}</p>
              <p className="text-xs text-gray-600 truncate">{tx.role}</p>
              <p className="text-xs text-gray-600 truncate">ID: {tx.employeeId}</p>
            </div>
            <span className={`inline-block text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap ${
              tx.paymentStatus === "success" || tx.status === "completed"
                ? "bg-green-100 text-green-800"
                : tx.paymentStatus === "pending" || tx.status === "pending"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-800"
            }`}>
              {tx.paymentStatus || tx.status}
            </span>
          </div>
        </div>
      </div>

      {/* Expandable section */}
      {expanded && (
        <div className="mt-2.5 pt-2.5 border-t border-white/20 space-y-2.5 relative z-10">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-gray-500">Gross Salary</p>
              <p className="text-gray-800 font-medium break-words">{formatCurrency(tx.grossSalary)}</p>
            </div>
            <div>
              <p className="text-gray-500">Net Salary</p>
              <p className="text-gray-800 font-medium break-words">{formatCurrency(tx.netSalary)}</p>
            </div>
            <div>
              <p className="text-gray-500">Pension (Emp)</p>
              <p className="text-gray-800 break-words">{formatCurrency(tx.pensionEmployeeContribution)}</p>
            </div>
            <div>
              <p className="text-gray-500">Pension (Empr)</p>
              <p className="text-gray-800 break-words">{formatCurrency(tx.pensionEmployerContribution)}</p>
            </div>
            <div>
              <p className="text-gray-500">Tax</p>
              <p className="text-gray-800 break-words">{formatCurrency(tx.taxDeduction)}</p>
            </div>
            <div>
              <p className="text-gray-500">Savings</p>
              <p className="text-gray-800 break-words">{formatCurrency(tx.savingsDeduction)}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500">Payroll Period</p>
            <p className="text-xs text-gray-800 mt-0.5 break-words">{tx.payrollPeriodLabel}</p>
          </div>
          {tx.failedReason && (
            <div className="bg-red-50/80 p-2 rounded-xl backdrop-blur-sm border border-red-200/50">
              <p className="text-xs text-red-800 break-words"><strong>Failed:</strong> {tx.failedReason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Desktop transaction row
const TransactionRow: React.FC<{
  transaction: any;
  onUserClick: (user: any, userId: string) => void;
}> = ({ transaction, onUserClick }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr className="hover:bg-white/10 transition-colors border-b border-white/10">
        <td className="px-6 py-4">
          <div className="text-sm text-gray-700 max-w-[220px]">
            <div className="flex items-center">
              <span className="truncate" title={transaction.reference}>
                {transaction.reference}
              </span>
              <button
                onClick={() => setExpanded(!expanded)}
                className="ml-2 text-gray-500 hover:text-gray-700"
              >
                {expanded ? <X className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {new Date(transaction.createdAt).toLocaleDateString()}
          </div>
        </td>
        <td className="px-6 py-4">
          {transaction.user ? (
            <button
              onClick={() => onUserClick(transaction.user, transaction.userId)}
              className="text-left hover:text-[#066f48]"
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
        <td className="px-6 py-4">
          <div className="text-sm text-gray-700 capitalize">
            {transaction.type.replace("_", " ")}
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm font-medium text-gray-800">
            {formatCurrency(transaction.amount)}
          </div>
        </td>
        <td className="px-6 py-4">
          <span className={`text-xs px-2 py-1 rounded-full ${
            transaction.status === "completed" ? "bg-green-100/90 text-green-700" 
            : transaction.status === "pending" ? "bg-yellow-100/90 text-yellow-700" 
            : "bg-red-100/90 text-red-700"
          }`}>
            {transaction.status}
          </span>
        </td>
        <td className="px-6 py-4 max-w-xs">
          <div className="text-sm text-gray-600 break-words">{transaction.description}</div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-white/5">
          <td colSpan={6} className="px-6 py-3 text-sm text-gray-700">
            <div className="font-medium text-gray-800 mb-1">Full reference</div>
            <div className="text-xs text-gray-700 break-all">{transaction.reference}</div>
          </td>
        </tr>
      )}
    </>
  );
};

// Desktop payroll row
const PayrollTransactionRow: React.FC<{ transaction: any }> = ({ transaction }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr className="hover:bg-white/10 transition-colors border-b border-white/10">
        <td className="px-6 py-4">
          <div className="text-sm text-gray-700 max-w-[220px]">
            <div className="flex items-center">
              <span className="truncate" title={transaction.paymentReference || transaction.id}>
                {transaction.paymentReference || transaction.id}
              </span>
              <button
                onClick={() => setExpanded(!expanded)}
                className="ml-2 text-gray-500 hover:text-gray-700"
              >
                {expanded ? <X className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {new Date(transaction.createdAt).toLocaleDateString()}
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm font-medium text-gray-800">{transaction.staffName}</div>
          <div className="text-xs text-gray-500">{transaction.employeeId}</div>
          <div className="text-xs text-gray-500">{transaction.role}</div>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm text-gray-700">Payroll</div>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm font-medium text-gray-800">
            {formatCurrency(transaction.netSalary)}
          </div>
          <div className="text-xs text-gray-500">
            Gross: {formatCurrency(transaction.grossSalary)}
          </div>
        </td>
        <td className="px-6 py-4">
          <span className={`text-xs px-2 py-1 rounded-full ${
            transaction.paymentStatus === "success" || transaction.status === "completed"
              ? "bg-green-100/90 text-green-700"
              : transaction.paymentStatus === "pending" || transaction.status === "pending"
              ? "bg-yellow-100/90 text-yellow-700"
              : "bg-red-100/90 text-red-700"
          }`}>
            {transaction.paymentStatus || transaction.status}
          </span>
        </td>
        <td className="px-6 py-4 max-w-xs">
          <div className="text-sm text-gray-600">
            Period: {transaction.payrollPeriodLabel}
            {transaction.failedReason && (
              <div className="text-xs text-red-700 mt-1">
                Failed: {transaction.failedReason}
              </div>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-white/5">
          <td colSpan={6} className="px-6 py-3 text-sm text-gray-700">
            <div className="grid grid-cols-2 gap-4">
              <div><strong>Gross:</strong> {formatCurrency(transaction.grossSalary)}</div>
              <div><strong>Net:</strong> {formatCurrency(transaction.netSalary)}</div>
              <div><strong>Pension (Emp):</strong> {formatCurrency(transaction.pensionEmployeeContribution)}</div>
              <div><strong>Pension (Empr):</strong> {formatCurrency(transaction.pensionEmployerContribution)}</div>
              <div><strong>Tax:</strong> {formatCurrency(transaction.taxDeduction)}</div>
              <div><strong>Savings:</strong> {formatCurrency(transaction.savingsDeduction)}</div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export const TransactionsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"all" | "wallet" | "loans" | "purchases" | "payroll" | "organization">("all");
  const [stats, setStats] = useState<any | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [transactionsCache, setTransactionsCache] = useState<any>({});
  const [payrollTransactions, setPayrollTransactions] = useState<any[]>([]);
  const [payrollPagination, setPayrollPagination] = useState<any>({
    total: 0,
    totalPages: 1,
    currentPage: 1,
  });

  const [filters, setFilters] = useState<any>({
    page: 1,
    limit: 10,
    search: "",
    status: "",
    type: "",
    userType: "",
    startDate: "",
    endDate: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const currentTabData = transactionsCache[activeTab];
  const transactions = activeTab === "payroll" ? payrollTransactions : currentTabData?.transactions || [];
  const pagination = activeTab === "payroll" ? payrollPagination : currentTabData?.pagination || {
    total: 0,
    totalPages: 1,
    currentPage: 1,
  };

  useEffect(() => {
    loadAllTransactionsAndStats();
  }, []);

  useEffect(() => {
    if (!initialLoading) {
      loadCurrentTabTransactions();
    }
  }, [filters]);

  useEffect(() => {
    if (!transactionsCache[activeTab]) {
      loadCurrentTabTransactions();
    }
  }, [activeTab]);

  const loadAllTransactionsAndStats = async () => {
    try {
      setInitialLoading(true);
      setError(null);

      const [statsResponse, allTransactionsResponse] = await Promise.all([
        transactionsApi.getTransactionStats(),
        transactionsApi.getAllTransactions(filters),
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
        case "organization":
          response = await transactionsApi.getOrganizationTransactions(filters);
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
          return;
        default:
          response = await transactionsApi.getAllTransactions(filters);
      }

      setTransactionsCache((prev: any) => ({
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

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev: any) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev: any) => ({
      ...prev,
      page,
    }));
  };

  const handleUserClick = (user: any, userId: string) => {
    setSelectedUser({ user, userId });
  };

  const tabs = [
    { id: "all", label: "All", count: stats?.totalTransactions || 0 },
    { id: "wallet", label: "Wallet", count: stats?.byType?.wallet || 0 },
    { id: "loans", label: "Loans", count: stats?.byType?.loan || 0 },
    { id: "purchases", label: "Purchases", count: stats?.byType?.purchase || 0 },
    { id: "payroll", label: "Payroll", count: stats?.byType?.payroll || 0 },
    { id: "organization", label: "Org", count: stats?.byType?.organization || 0 },
  ];

  const formatCompactNumber = (num: number) => num > 999 ? '999+' : num.toLocaleString();

  return (
    <div className="space-y-5">
      {/* Header - Liquid Glass */}
      <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/5 via-transparent to-cyan-400/5 rounded-[2rem] pointer-events-none" />
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-[#066f48]/10 to-transparent blur-2xl rounded-full pointer-events-none" />
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#066f48] shadow-lg">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Transactions</h2>
              <p className="text-sm text-gray-600">{stats?.totalTransactions ? `${formatCompactNumber(stats.totalTransactions)} total` : '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2.5 bg-white/25 backdrop-blur-md border border-white/50 rounded-xl hover:bg-white/35 transition-all flex items-center gap-2 text-gray-700"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <button className="px-4 py-2.5 bg-white/25 backdrop-blur-md border border-white/50 rounded-xl hover:bg-white/35 transition-all flex items-center gap-2 text-gray-700">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards - Liquid Glass */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total", value: stats.totalTransactions, color: 'text-gray-800' },
            { label: "Amount", value: formatCurrency(stats.totalAmount), color: 'text-gray-800' },
            { label: "Completed", value: stats.completedTransactions, color: 'text-green-700' },
            { label: "Pending", value: stats.pendingTransactions, color: 'text-yellow-700' },
            { label: "Failed", value: stats.failedTransactions, color: 'text-red-700' },
          ].map((item, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-xl rounded-[1.5rem] border border-white/40 shadow-[0_4px_16px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[1.5rem] pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/5 via-transparent to-cyan-400/5 rounded-[1.5rem] pointer-events-none" />
              <p className="text-sm text-gray-600 relative z-10">{item.label}</p>
              <p className={`text-xl font-bold relative z-10 ${item.color}`}>
                {typeof item.value === 'number' ? formatCompactNumber(item.value) : item.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filters - Liquid Glass */}
      {showFilters && (
        <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/5 via-transparent to-cyan-400/5 rounded-[2rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={filters.search || ""}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-10 pr-3 py-2.5 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800 placeholder-gray-500 w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status || ""}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-4 py-2.5 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User Type</label>
              <select
                value={filters.userType || ""}
                onChange={(e) => handleFilterChange("userType", e.target.value)}
                className="w-full px-4 py-2.5 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800"
              >
                <option value="">All Users</option>
                <option value="farmer">Farmers</option>
                <option value="buyer">Buyers</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
              <input
                type="date"
                value={filters.startDate || ""}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                className="w-full px-4 py-2.5 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800"
              />
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50/90 backdrop-blur-sm border border-red-200/50 rounded-[1.5rem] p-4 flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Main Content - Liquid Glass */}
      <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/5 via-transparent to-cyan-400/5 rounded-[2rem] pointer-events-none" />
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
        
        {/* Tabs */}
        <div className="border-b border-white/30 bg-white/20 backdrop-blur-md overflow-x-auto relative z-10">
          <nav className="flex px-5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-6 font-medium text-sm whitespace-nowrap transition-all relative ${
                  activeTab === tab.id
                    ? "text-[#066f48] border-b-2 border-[#066f48]"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 bg-white/30 text-gray-800 px-2 py-0.5 rounded-full text-xs">
                    {formatCompactNumber(tab.count)}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Loading State */}
        {(initialLoading || tabLoading) ? (
          <div className="flex items-center justify-center py-12 relative z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-[#066f48] animate-spin mx-auto mb-4" />
              <p className="text-gray-600">{initialLoading ? "Loading..." : "Updating..."}</p>
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-600 relative z-10">
            No transactions found
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="lg:hidden p-5 space-y-4 relative z-10">
              {activeTab === "payroll" ? (
                transactions.map((tx: any) => <PayrollMobileTxCard key={tx.id} tx={tx} />)
              ) : (
                transactions.map((tx: any) => (
                  <MobileTxCard key={tx.id} tx={tx} onUserClick={handleUserClick} />
                ))
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block relative z-10">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-white/20 backdrop-blur-md text-gray-700 font-medium uppercase text-xs border-b border-white/30">
                    <tr>
                      <th className="px-6 py-4">{activeTab === "payroll" ? "Payment Ref" : "Reference"}</th>
                      <th className="px-6 py-4">{activeTab === "payroll" ? "Staff" : "User"}</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">{activeTab === "payroll" ? "Net" : "Amount"}</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">{activeTab === "payroll" ? "Period" : "Description"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/15">
                    {activeTab === "payroll" ? (
                      transactions.map((transaction: any) => (
                        <PayrollTransactionRow key={transaction.id} transaction={transaction} />
                      ))
                    ) : (
                      transactions.map((transaction: any) => (
                        <TransactionRow
                          key={transaction.id}
                          transaction={transaction}
                          onUserClick={handleUserClick}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination - Liquid Glass */}
            {pagination.totalPages > 1 && (
              <div className="bg-white/10 backdrop-blur-xl border-t border-white/30 p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-white/30 to-transparent blur-2xl rounded-full pointer-events-none" />
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                  <p className="text-sm text-gray-600">
                    Showing {(pagination.currentPage - 1) * 10 + 1} to {Math.min(pagination.currentPage * 10, pagination.total)} of {pagination.total}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className="px-4 py-2 bg-white/25 backdrop-blur-md border border-white/50 rounded-xl hover:bg-white/35 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all text-gray-700"
                    >
                      Previous
                    </button>
                    {getPageWindow(pagination.currentPage, pagination.totalPages, 3).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded-xl transition-all ${
                          page === pagination.currentPage
                            ? "bg-[#066f48] text-white shadow-lg"
                            : "bg-white/25 backdrop-blur-md border border-white/50 hover:bg-white/35 text-gray-700"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className="px-4 py-2 bg-white/25 backdrop-blur-md border border-white/50 rounded-xl hover:bg-white/35 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all text-gray-700"
                    >
                      Next
                    </button>
                  </div>
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