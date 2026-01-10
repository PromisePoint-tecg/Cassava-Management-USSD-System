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
import { farmersApi, Farmer, FarmerDetail, GetAllFarmersParams } from '../api/farmers';

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
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-yellow-100 text-yellow-800',
      banned: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-emerald-600" />
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Farmers Directory</h2>
            <p className="text-sm text-gray-600">{total} total farmers</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LGA Filter */}
          <input
            type="text"
            placeholder="Filter by LGA..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            value={lgaFilter}
            onChange={(e) => setLgaFilter(e.target.value)}
          />

          {/* Status Filter */}
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : farmers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No farmers found</p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {farmers.map((farmer) => (
              <div key={farmer.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{farmer.fullName.toUpperCase()}</h3>
                    <p className="text-sm text-gray-600">{farmer.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewFarmer(farmer)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">LGA:</span>
                    <p className="font-medium">{farmer.lga}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Farm Size:</span>
                    <p className="font-medium">{farmer.farmSizeHectares} ha</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Wallet Balance:</span>
                    <p className="font-medium">{formatCurrency(farmer.walletBalance || 0)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Sales:</span>
                    <p className="font-medium">{farmer.totalSales}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Earnings:</span>
                    <p className="font-medium">{formatCurrency(farmer.totalEarnings)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-medium uppercase text-xs">
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
                    <tr key={farmer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-800">{farmer.fullName.toUpperCase()}</p>
                          <p className="text-xs text-gray-500">ID: {farmer.id.substring(0, 8)}...</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">{farmer.phone}</td>
                      <td className="px-6 py-4">{farmer.lga}</td>
                      <td className="px-6 py-4">{farmer.farmSizeHectares} ha</td>
                      <td className="px-6 py-4">{formatCurrency(farmer.walletBalance || 0)}</td>
                      <td className="px-6 py-4">{farmer.totalSales}</td>
                      <td className="px-6 py-4">{formatCurrency(farmer.totalEarnings)}</td>
                      <td className="px-6 py-4">{getStatusBadge(farmer.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewFarmer(farmer)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
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
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* View Farmer Modal */}
      {viewingFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden my-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-emerald-50">
              <h3 className="text-lg font-bold text-emerald-900">Farmer Details</h3>
              <button onClick={() => setViewingFarmer(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Personal Info */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Personal Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">{viewingFarmer.fullName.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="font-medium">{viewingFarmer.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">LGA</p>
                    <p className="font-medium">{viewingFarmer.lga}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Farm Size</p>
                    <p className="font-medium">{viewingFarmer.farmSizeHectares} hectares</p>
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
                    <p className="font-medium">{formatCurrency(viewingFarmer.walletBalance || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Earnings</p>
                    <p className="font-medium">{formatCurrency(viewingFarmer.totalEarnings)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Sales</p>
                    <p className="font-medium">{viewingFarmer.totalSales}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Completed Sales</p>
                    <p className="font-medium">{viewingFarmer.completedSales}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Active Loan</p>
                    <p className="font-medium">{viewingFarmer.activeLoan ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Loan Defaults</p>
                    <p className="font-medium">{viewingFarmer.loanDefaults}</p>
                  </div>
                </div>
              </div>

              {/* Activity */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Activity</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Member Since</p>
                    <p className="font-medium">{formatDate(viewingFarmer.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="font-medium">{formatDate(viewingFarmer.updatedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                {viewingFarmer.status === 'active' ? (
                  <button
                    onClick={() => {
                      setDeactivatingFarmer(viewingFarmer);
                      setViewingFarmer(null);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                  >
                    <UserX className="w-4 h-4" />
                    Deactivate
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleActivateFarmer(viewingFarmer);
                      setViewingFarmer(null);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    Activate
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {deactivatingFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-red-50">
              <h3 className="text-lg font-bold text-red-900">Confirm Deactivation</h3>
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

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setDeactivatingFarmer(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={loadingAction}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeactivateFarmer}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
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
                      Deactivate
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
