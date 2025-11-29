import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Download, Eye, X, User, Phone, MapPin, Building, Wallet, CreditCard, TrendingUp } from 'lucide-react';
import { transactionsApi, Transaction, TransactionStats, TransactionQueryParams } from '../api/transactions';
import { farmersApi, UserFinancialDetails } from '../api/farmers';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Transaction['user'];
  userId: string;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, user, userId }) => {
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [userFinancialDetails, setUserFinancialDetails] = useState<UserFinancialDetails | null>(null);
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
      
      // Load transactions and financial details in parallel
      const [transactionsResponse, financialDetails] = await Promise.all([
        transactionsApi.getUserTransactions(userId, { limit: 5 }),
        user?.type === 'farmer' ? farmersApi.getFarmerFinancialStatus(userId) : Promise.resolve(null)
      ]);
      
      setUserTransactions(transactionsResponse.transactions);
      setUserFinancialDetails(financialDetails);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
      setDetailsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">{user.name}</h4>
                <p className="text-sm text-gray-600 capitalize">{user.type}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                <span className="text-sm">{user.phone}</span>
              </div>
              
              {user.type === 'farmer' && (
                <>
                  {user.lga && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="text-sm">{user.lga} LGA</span>
                    </div>
                  )}
                  {user.farmSize && (
                    <div className="flex items-center text-gray-600">
                      <span className="w-4 h-4 mr-2 text-green-600">🌾</span>
                      <span className="text-sm">{user.farmSize} hectares</span>
                    </div>
                  )}
                </>
              )}

              {user.type === 'buyer' && user.businessName && (
                <div className="flex items-center text-gray-600">
                  <Building className="w-4 h-4 mr-2" />
                  <span className="text-sm">{user.businessName}</span>
                </div>
              )}
            </div>

            {/* Wallet Information */}
            {detailsLoading ? (
              <div className="p-4 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                <p className="text-sm text-gray-600">Loading wallet information...</p>
              </div>
            ) : userFinancialDetails?.wallet ? (
              <div className="border-t pt-4">
                <h5 className="font-medium text-gray-800 mb-3 flex items-center">
                  <Wallet className="w-4 h-4 mr-2" />
                  Wallet Information
                </h5>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Balance</span>
                    <span className="text-lg font-bold text-green-600">
                      ₦{(userFinancialDetails.wallet.balance / 100).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      userFinancialDetails.wallet.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {userFinancialDetails.wallet.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            ) : userFinancialDetails && (
              <div className="border-t pt-4">
                <h5 className="font-medium text-gray-800 mb-3 flex items-center">
                  <Wallet className="w-4 h-4 mr-2" />
                  Wallet Information
                </h5>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-gray-600 text-sm">No wallet found for this user</p>
                </div>
              </div>
            )}

            {/* Outstanding Loans */}
            {userFinancialDetails?.outstandingLoans && userFinancialDetails.outstandingLoans.length > 0 && (
              <div className="border-t pt-4">
                <h5 className="font-medium text-gray-800 mb-3 flex items-center">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Outstanding Loans
                </h5>
                <div className="space-y-2">
                  {userFinancialDetails.outstandingLoans.map((loan) => (
                    <div key={loan.id} className="p-3 bg-yellow-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            Loan Principal: ₦{(loan.principalAmount / 100).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-600">
                            Outstanding: ₦{(loan.amountOutstanding / 100).toLocaleString()}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          loan.status === 'active' ? 'bg-yellow-100 text-yellow-700' :
                          loan.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {loan.status}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-600 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min((loan.amountPaid / loan.totalRepayment) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {((loan.amountPaid / loan.totalRepayment) * 100).toFixed(1)}% repaid
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Purchases */}
            {userFinancialDetails?.recentPurchases && userFinancialDetails.recentPurchases.length > 0 && (
              <div className="border-t pt-4">
                <h5 className="font-medium text-gray-800 mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Recent Purchases
                </h5>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {userFinancialDetails.recentPurchases.map((purchase) => (
                    <div key={purchase.id} className="p-2 bg-blue-50 rounded text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">
                            {purchase.weightKg}kg - ₦{(purchase.totalAmount / 100).toLocaleString()}
                          </p>
                          <p className="text-gray-600 text-xs">
                            Net credited: ₦{(purchase.netAmountCredited / 100).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            purchase.status === 'completed' ? 'bg-green-100 text-green-700' :
                            purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {purchase.status}
                          </span>
                          <p className="text-gray-400 text-xs mt-1">
                            {new Date(purchase.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Transactions from Financial Details */}
            {userFinancialDetails?.recentTransactions && userFinancialDetails.recentTransactions.length > 0 && (
              <div className="border-t pt-4">
                <h5 className="font-medium text-gray-800 mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Recent Transactions
                </h5>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {userFinancialDetails.recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800 capitalize">
                            {transaction.type.replace('_', ' ')}
                          </p>
                          <p className="text-gray-600 text-xs">{transaction.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-800">
                            ₦{transaction.amount.toLocaleString()}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-400 text-xs mt-1">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h5 className="font-medium text-gray-800 mb-2">All User Transactions</h5>
              {loading ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {userTransactions.length > 0 ? (
                    userTransactions.map((transaction) => (
                      <div key={transaction.id} className="p-2 bg-gray-50 rounded text-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-800 capitalize">
                              {transaction.type.replace('_', ' ')}
                            </p>
                            <p className="text-gray-600">{transaction.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-800">
                              ₦{transaction.amount.toLocaleString()}
                            </p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                              transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
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
  );
};

interface TransactionRowProps {
  transaction: Transaction;
  onUserClick: (user: Transaction['user'], userId: string) => void;
}

const TransactionRow: React.FC<TransactionRowProps> = ({ transaction, onUserClick }) => {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="text-sm text-gray-800">{transaction.reference}</div>
        <div className="text-xs text-gray-500">
          {new Date(transaction.createdAt).toLocaleDateString()}
        </div>
      </td>
      <td className="px-4 py-3">
        {transaction.user ? (
          <button
            onClick={() => onUserClick(transaction.user, transaction.userId)}
            className="text-left hover:text-blue-600 transition-colors"
          >
            <div className="text-sm font-medium text-gray-800">{transaction.user.name}</div>
            <div className="text-xs text-gray-500 capitalize">{transaction.user.type}</div>
          </button>
        ) : (
          <div className="text-sm text-gray-500">Unknown User</div>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="text-sm text-gray-800 capitalize">
          {transaction.type.replace('_', ' ')}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm font-medium text-gray-800">
          ₦{transaction.amount.toLocaleString()}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs px-2 py-1 rounded-full ${
          transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
          transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
          transaction.status === 'failed' ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {transaction.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm text-gray-600 max-w-xs truncate">
          {transaction.description}
        </div>
      </td>
    </tr>
  );
};

export const TransactionsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'wallet' | 'loans' | 'purchases'>('all');
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data cache for all tabs
  const [transactionsCache, setTransactionsCache] = useState<{
    all?: { transactions: Transaction[]; pagination: any; };
    wallet?: { transactions: Transaction[]; pagination: any; };
    loans?: { transactions: Transaction[]; pagination: any; };
    purchases?: { transactions: Transaction[]; pagination: any; };
  }>({});
  
  // Filter state
  const [filters, setFilters] = useState<TransactionQueryParams>({
    page: 1,
    limit: 20,
    search: '',
    status: '',
    type: '',
    userType: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  // Modal state
  const [selectedUser, setSelectedUser] = useState<{
    user: Transaction['user'];
    userId: string;
  } | null>(null);
  
  // Filter panel state
  const [showFilters, setShowFilters] = useState(false);

  // Get current tab data
  const currentTabData = transactionsCache[activeTab];
  const transactions = currentTabData?.transactions || [];
  const pagination = currentTabData?.pagination || { total: 0, totalPages: 0, currentPage: 1 };

  // Initial load - fetch all data at once
  useEffect(() => {
    loadAllTransactionsAndStats();
  }, []);

  // Reload when filters change
  useEffect(() => {
    if (!initialLoading) {
      loadCurrentTabTransactions();
    }
  }, [filters]);

  const loadAllTransactionsAndStats = async () => {
    try {
      setInitialLoading(true);
      setError(null);
      
      // Load stats and all transaction types in parallel
      const [
        statsResponse,
        allTransactionsResponse,
        walletTransactionsResponse,
        loanTransactionsResponse,
        purchaseTransactionsResponse
      ] = await Promise.all([
        transactionsApi.getTransactionStats(),
        transactionsApi.getAllTransactions(filters),
        transactionsApi.getWalletTransactions(filters),
        transactionsApi.getLoanTransactions(filters),
        transactionsApi.getPurchaseTransactions(filters)
      ]);
      
      // Cache all responses
      setStats(statsResponse);
      setTransactionsCache({
        all: {
          transactions: allTransactionsResponse.transactions,
          pagination: {
            total: allTransactionsResponse.total,
            totalPages: allTransactionsResponse.totalPages,
            currentPage: allTransactionsResponse.page
          }
        },
        wallet: {
          transactions: walletTransactionsResponse.transactions,
          pagination: {
            total: walletTransactionsResponse.total,
            totalPages: walletTransactionsResponse.totalPages,
            currentPage: walletTransactionsResponse.page
          }
        },
        loans: {
          transactions: loanTransactionsResponse.transactions,
          pagination: {
            total: loanTransactionsResponse.total,
            totalPages: loanTransactionsResponse.totalPages,
            currentPage: loanTransactionsResponse.page
          }
        },
        purchases: {
          transactions: purchaseTransactionsResponse.transactions,
          pagination: {
            total: purchaseTransactionsResponse.total,
            totalPages: purchaseTransactionsResponse.totalPages,
            currentPage: purchaseTransactionsResponse.page
          }
        }
      });
    } catch (error: any) {
      console.error('Failed to load transaction data:', error);
      setError('Failed to load transactions. Please try again.');
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
        case 'wallet':
          response = await transactionsApi.getWalletTransactions(filters);
          break;
        case 'loans':
          response = await transactionsApi.getLoanTransactions(filters);
          break;
        case 'purchases':
          response = await transactionsApi.getPurchaseTransactions(filters);
          break;
        default:
          response = await transactionsApi.getAllTransactions(filters);
      }
      
      // Update only the current tab's cache
      setTransactionsCache(prev => ({
        ...prev,
        [activeTab]: {
          transactions: response.transactions,
          pagination: {
            total: response.total,
            totalPages: response.totalPages,
            currentPage: response.page
          }
        }
      }));
    } catch (error: any) {
      console.error('Failed to load transactions:', error);
      setError('Failed to load transactions. Please try again.');
    } finally {
      setTabLoading(false);
    }
  };

  const handleFilterChange = (key: keyof TransactionQueryParams, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({
      ...prev,
      page
    }));
  };

  const handleUserClick = (user: Transaction['user'], userId: string) => {
    setSelectedUser({ user, userId });
  };

  const tabs = [
    { id: 'all', label: 'All Transactions', count: stats?.totalTransactions || 0 },
    { id: 'wallet', label: 'Wallet', count: stats?.byType.wallet || 0 },
    { id: 'loans', label: 'Loans', count: stats?.byType.loan || 0 },
    { id: 'purchases', label: 'Purchases', count: stats?.byType.purchase || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Transactions</h2>
        
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
            <div className="text-2xl font-bold text-gray-800">{stats.totalTransactions.toLocaleString()}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">Total Amount</div>
            <div className="text-2xl font-bold text-gray-800">₦{stats.totalAmount.toLocaleString()}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">Completed</div>
            <div className="text-2xl font-bold text-green-600">{stats.completedTransactions.toLocaleString()}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingTransactions.toLocaleString()}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">Failed</div>
            <div className="text-2xl font-bold text-red-600">{stats.failedTransactions.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search reference, description..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
              <select
                value={filters.userType || ''}
                onChange={(e) => handleFilterChange('userType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Users</option>
                <option value="farmer">Farmers</option>
                <option value="buyer">Buyers</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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

      {/* Transactions Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
        
        {initialLoading || tabLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">
              {initialLoading ? 'Loading transactions...' : 'Updating...'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length > 0 ? (
                    transactions.map((transaction) => (
                      <TransactionRow
                        key={transaction.id}
                        transaction={transaction}
                        onUserClick={handleUserClick}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((pagination.currentPage - 1) * (filters.limit || 20)) + 1} to{' '}
                  {Math.min(pagination.currentPage * (filters.limit || 20), pagination.total)} of{' '}
                  {pagination.total} transactions
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-3 py-1 rounded border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 rounded text-sm ${
                          page === pagination.currentPage
                            ? 'bg-blue-500 text-white'
                            : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
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
        userId={selectedUser?.userId || ''}
      />
    </div>
  );
};