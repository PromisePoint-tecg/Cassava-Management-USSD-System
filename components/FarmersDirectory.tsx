import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Eye, 
  UserX, 
  UserCheck,
  X, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { farmersApi, Farmer, FarmerDetail, GetAllFarmersParams } from '../services/farmers';
import LeafInlineLoader from './Loader';

export const FarmersDirectory: React.FC = () => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lgaFilter, setLgaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Modal states
  const [viewingFarmer, setViewingFarmer] = useState<FarmerDetail | null>(null);
  const [deactivatingFarmer, setDeactivatingFarmer] = useState<Farmer | null>(null);
  const [suspendingFarmer, setSuspendingFarmer] = useState<Farmer | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  
  // Action loading states
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch farmers
  const fetchFarmers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: GetAllFarmersParams = {
        page: currentPage,
        limit: 10,
      };
      
      if (lgaFilter) params.lga = lgaFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      
      const response = await farmersApi.getAllFarmers(params);
      setFarmers(response.farmers);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch farmers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, [currentPage, statusFilter, lgaFilter]);

  // View farmer details
  const handleViewFarmer = async (farmer: Farmer) => {
    try {
      setActionError(null);
      const details = await farmersApi.getFarmerById(farmer.id);
      setViewingFarmer(details);
    } catch (err: any) {
      setActionError(err.message || 'Failed to fetch farmer details');
    }
  };

  // Deactivate farmer
  const handleDeactivateFarmer = async () => {
    if (!deactivatingFarmer) return;

    try {
      setLoadingAction(true);
      setActionError(null);
      
      await farmersApi.deactivateFarmer(deactivatingFarmer.id);
      setDeactivatingFarmer(null);
      fetchFarmers(); // Refresh list
    } catch (err: any) {
      setActionError(err.message || 'Failed to deactivate farmer');
    } finally {
      setLoadingAction(false);
    }
  };

  // Activate farmer
  const handleActivateFarmer = async (farmer: Farmer) => {
    try {
      setLoadingAction(true);
      setActionError(null);
      
      await farmersApi.activateFarmer(farmer.id);
      fetchFarmers(); // Refresh list
    } catch (err: any) {
      setActionError(err.message || 'Failed to activate farmer');
    } finally {
      setLoadingAction(false);
    }
  };

  // Suspend farmer
  const handleSuspendFarmer = async () => {
    if (!suspendingFarmer || !suspensionReason.trim()) {
      setActionError('Please provide a reason for suspension');
      return;
    }

    try {
      setLoadingAction(true);
      setActionError(null);
      
      await farmersApi.suspendFarmer(suspendingFarmer.id, suspensionReason);
      
      setSuspendingFarmer(null);
      setSuspensionReason('');
      setViewingFarmer(null);
      fetchFarmers(); // Refresh list
    } catch (err: any) {
      setActionError(err.message || 'Failed to suspend farmer');
    } finally {
      setLoadingAction(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${(amount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-700',
      suspended: 'bg-yellow-100 text-yellow-700',
      banned: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#066f48]">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Farmers Directory</h2>
              <p className="text-sm text-gray-600">{total} total farmers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LGA Filter */}
          <input
            type="text"
            placeholder="Filter by LGA..."
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#066f48] focus:border-[#066f48] focus:outline-none transition-all text-gray-800 placeholder-gray-500"
            value={lgaFilter}
            onChange={(e) => setLgaFilter(e.target.value)}
          />

          {/* Status Filter */}
          <select
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#066f48] focus:border-[#066f48] focus:outline-none transition-all text-gray-800"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LeafInlineLoader />
        </div>
      ) : farmers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No farmers found</p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {farmers.map((farmer) => (
              <div key={farmer.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-all duration-200">
                
                <div className="flex items-start justify-between mb-3 relative z-10">
                  <div>
                    <h3 className="font-semibold text-gray-800">{farmer.fullName.toUpperCase()}</h3>
                    <p className="text-sm text-gray-600">{farmer.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewFarmer(farmer)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm relative z-10">
                  <div>
                    <span className="text-gray-500">LGA:</span>
                    <p className="font-medium text-gray-800">{farmer.lga.toUpperCase()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Farm Size:</span>
                    <p className="font-medium text-gray-800">{farmer.farmSizeHectares} ha</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Wallet Balance:</span>
                    <p className="font-medium text-gray-800">{formatCurrency(farmer.walletBalance || 0)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Sales:</span>
                    <p className="font-medium text-gray-800">{farmer.totalSales}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Earnings:</span>
                    <p className="font-medium text-gray-800">{formatCurrency(farmer.totalEarnings)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-medium uppercase text-xs border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3">Farmer</th>
                    <th className="px-6 py-3">Phone</th>
                    <th className="px-6 py-3">LGA</th>
                    <th className="px-6 py-3">Farm Size</th>
                    <th className="px-6 py-3">Wallet Balance</th>
                    <th className="px-6 py-3">Total Sales</th>
                    <th className="px-6 py-3">Earnings</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {farmers.map((farmer) => (
                    <tr key={farmer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-800">{farmer.fullName.toUpperCase()}</p>
                          <p className="text-xs text-gray-500">ID: {farmer.id.substring(0, 8)}...</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 uppercase">{farmer.phone}</td>
                      <td className="px-6 py-4 text-gray-700">{farmer.lga.toUpperCase()}</td>
                      <td className="px-6 py-4 text-gray-700">{farmer.farmSizeHectares} ha</td>
                      <td className="px-6 py-4 text-gray-700">{formatCurrency(farmer.walletBalance || 0)}</td>
                      <td className="px-6 py-4 text-gray-700">{farmer.totalSales}</td>
                      <td className="px-6 py-4 text-gray-700">{formatCurrency(farmer.totalEarnings)}</td>
                      <td className="px-6 py-4">{getStatusBadge(farmer.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewFarmer(farmer)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all text-gray-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all text-gray-700"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* View Farmer Modal */}
      {viewingFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden my-auto border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-[#066f48]">Farmer Details</h3>
                <button onClick={() => setViewingFarmer(null)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Personal Info */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Personal Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium text-gray-800">{viewingFarmer.fullName.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="font-medium text-gray-800">{viewingFarmer.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">LGA</p>
                    <p className="font-medium text-gray-800">{viewingFarmer.lga.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Farm Size</p>
                    <p className="font-medium text-gray-800">{viewingFarmer.farmSizeHectares} hectares</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    {getStatusBadge(viewingFarmer.status)}
                  </div>
                </div>
              </div>

              {/* Financial Info */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Financial Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Wallet Balance</p>
                    <p className="font-medium text-gray-800">{formatCurrency(viewingFarmer.walletBalance || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Earnings</p>
                    <p className="font-medium text-gray-800">{formatCurrency(viewingFarmer.totalEarnings)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Sales</p>
                    <p className="font-medium text-gray-800">{viewingFarmer.totalSales}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Completed Sales</p>
                    <p className="font-medium text-gray-800">{viewingFarmer.completedSales}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Active Loan</p>
                    <p className="font-medium text-gray-800">{viewingFarmer.activeLoan ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Loan Defaults</p>
                    <p className="font-medium text-gray-800">{viewingFarmer.loanDefaults}</p>
                  </div>
                </div>
              </div>

              {/* Activity */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Activity</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Member Since</p>
                    <p className="font-medium text-gray-800">{formatDate(viewingFarmer.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="font-medium text-gray-800">{formatDate(viewingFarmer.updatedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                {viewingFarmer.status === 'active' ? (
                  <>
                    <button
                      onClick={() => {
                        setSuspendingFarmer({
                          id: viewingFarmer.id,
                          firstName: viewingFarmer.firstName,
                          lastName: viewingFarmer.lastName,
                          fullName: viewingFarmer.fullName,
                          phone: viewingFarmer.phone,
                          lga: viewingFarmer.lga,
                          status: viewingFarmer.status,
                          farmSizeHectares: viewingFarmer.farmSizeHectares,
                          walletBalance: viewingFarmer.walletBalance,
                          totalSales: viewingFarmer.totalSales,
                          totalEarnings: viewingFarmer.totalEarnings,
                        });
                      }}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-all flex items-center gap-2 justify-center"
                    >
                      <UserX className="w-4 h-4" />
                      Suspend Account
                    </button>
                    <button
                      onClick={() => {
                        setDeactivatingFarmer({
                          id: viewingFarmer.id,
                          firstName: viewingFarmer.firstName,
                          lastName: viewingFarmer.lastName,
                          fullName: viewingFarmer.fullName,
                          phone: viewingFarmer.phone,
                          lga: viewingFarmer.lga,
                          status: viewingFarmer.status,
                          farmSizeHectares: viewingFarmer.farmSizeHectares,
                          walletBalance: viewingFarmer.walletBalance,
                          totalSales: viewingFarmer.totalSales,
                          totalEarnings: viewingFarmer.totalEarnings,
                        });
                        setViewingFarmer(null);
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all flex items-center gap-2 justify-center"
                    >
                      <UserX className="w-4 h-4" />
                      Deactivate Account
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      handleActivateFarmer({
                        id: viewingFarmer.id,
                        firstName: viewingFarmer.firstName,
                        lastName: viewingFarmer.lastName,
                        fullName: viewingFarmer.fullName,
                        phone: viewingFarmer.phone,
                        lga: viewingFarmer.lga,
                        status: viewingFarmer.status,
                        farmSizeHectares: viewingFarmer.farmSizeHectares,
                        walletBalance: viewingFarmer.walletBalance,
                        totalSales: viewingFarmer.totalSales,
                        totalEarnings: viewingFarmer.totalEarnings,
                      });
                      setViewingFarmer(null);
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all flex items-center gap-2 justify-center"
                  >
                    <UserCheck className="w-4 h-4" />
                    Activate Account
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Farmer Modal */}
      {suspendingFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-yellow-50">
              <h3 className="text-lg font-bold text-yellow-800">Suspend Farmer Account</h3>
            </div>
            <div className="p-6 space-y-4">
              {actionError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-800 text-sm">{actionError}</p>
                </div>
              )}

              <div>
                <p className="text-gray-700 mb-4">
                  You are about to suspend <strong>{suspendingFarmer.firstName} {suspendingFarmer.lastName}</strong>'s account. 
                  Please provide a reason that will be sent to the farmer.
                </p>
                
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Suspension <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="Enter the reason for suspending this account..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 focus:outline-none resize-none text-gray-800"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setSuspendingFarmer(null);
                    setSuspensionReason('');
                    setActionError(null);
                  }}
                  disabled={loadingAction}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSuspendFarmer}
                  disabled={loadingAction || !suspensionReason.trim()}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingAction ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Suspending...
                    </>
                  ) : (
                    <>
                      <UserX className="w-4 h-4" />
                      Suspend Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {deactivatingFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
              <h3 className="text-lg font-bold text-red-700">Confirm Deactivation</h3>
            </div>
            <div className="p-6 space-y-4">
              {actionError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-sm text-red-800">{actionError}</p>
                </div>
              )}

              <p className="text-gray-700">
                Are you sure you want to deactivate <strong>{deactivatingFarmer.fullName.toUpperCase()}</strong>? 
                This will suspend their account and they won't be able to access the system.
              </p>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                <button
                  onClick={() => setDeactivatingFarmer(null)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all text-gray-700"
                  disabled={loadingAction}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeactivateFarmer}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                  disabled={loadingAction}
                >
                  {loadingAction ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deactivating...
                    </>
                  ) : (
                    <>
                      <UserX className="w-4 h-4" />
                      Deactivate Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};