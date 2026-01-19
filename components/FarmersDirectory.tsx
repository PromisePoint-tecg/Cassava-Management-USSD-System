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
      active: 'bg-green-100/90 text-green-700 border border-green-200/50',
      inactive: 'bg-gray-100/90 text-gray-700 border border-gray-200/50',
      suspended: 'bg-yellow-100/90 text-yellow-700 border border-yellow-200/50',
      banned: 'bg-red-100/90 text-red-700 border border-red-200/50',
    };
    return (
      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm ${statusColors[status] || 'bg-gray-100/90 text-gray-700 border border-gray-200/50'}`}>
        {status}
      </span>
    );
  };

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
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Farmers Directory</h2>
              <p className="text-sm text-gray-600">{total} total farmers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters - Liquid Glass */}
      <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/5 via-transparent to-cyan-400/5 rounded-[2rem] pointer-events-none" />
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          {/* LGA Filter */}
          <input
            type="text"
            placeholder="Filter by LGA..."
            className="px-4 py-2.5 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800 placeholder-gray-500"
            value={lgaFilter}
            onChange={(e) => setLgaFilter(e.target.value)}
          />

          {/* Status Filter */}
          <select
            className="px-4 py-2.5 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800"
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
        <div className="bg-red-50/90 backdrop-blur-sm border border-red-200/50 rounded-[1.5rem] p-4 flex items-center gap-3 shadow-sm">
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
        <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4 relative z-10" />
          <p className="text-gray-600 relative z-10">No farmers found</p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {farmers.map((farmer) => (
              <div key={farmer.id} className="bg-white/15 backdrop-blur-lg rounded-[1.5rem] border border-white/50 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_2px_rgba(255,255,255,0.4)_inset] p-4 relative overflow-hidden hover:bg-white/20 transition-all duration-300">
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[1.5rem] pointer-events-none" />
                <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/25 blur-2xl rounded-full pointer-events-none" />
                
                <div className="flex items-start justify-between mb-3 relative z-10">
                  <div>
                    <h3 className="font-semibold text-gray-800">{farmer.fullName.toUpperCase()}</h3>
                    <p className="text-sm text-gray-600">{farmer.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewFarmer(farmer)}
                      className="p-2 text-blue-600 hover:bg-blue-50/80 rounded-lg backdrop-blur-sm transition-all"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm relative z-10">
                  <div>
                    <span className="text-gray-500">LGA:</span>
                    <p className="font-medium text-gray-800">{farmer.lga}</p>
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

          {/* Desktop Table View - Liquid Glass */}
          <div className="hidden lg:block bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/5 via-transparent to-cyan-400/5 rounded-[2rem] pointer-events-none" />
            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
            
            <div className="overflow-x-auto relative z-10">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-white/20 backdrop-blur-md text-gray-700 font-medium uppercase text-xs border-b border-white/30">
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
                <tbody className="divide-y divide-white/15">
                  {farmers.map((farmer) => (
                    <tr key={farmer.id} className="hover:bg-white/10 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-800">{farmer.fullName.toUpperCase()}</p>
                          <p className="text-xs text-gray-500">ID: {farmer.id.substring(0, 8)}...</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{farmer.phone}</td>
                      <td className="px-6 py-4 text-gray-700">{farmer.lga}</td>
                      <td className="px-6 py-4 text-gray-700">{farmer.farmSizeHectares} ha</td>
                      <td className="px-6 py-4 text-gray-700">{formatCurrency(farmer.walletBalance || 0)}</td>
                      <td className="px-6 py-4 text-gray-700">{farmer.totalSales}</td>
                      <td className="px-6 py-4 text-gray-700">{formatCurrency(farmer.totalEarnings)}</td>
                      <td className="px-6 py-4">{getStatusBadge(farmer.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewFarmer(farmer)}
                            className="p-2 text-blue-600 hover:bg-blue-50/80 rounded-lg backdrop-blur-sm transition-all"
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

          {/* Pagination - Liquid Glass */}
          <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
            <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-white/30 to-transparent blur-2xl rounded-full pointer-events-none" />
            
            <div className="flex items-center justify-between relative z-10">
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white/25 backdrop-blur-md border border-white/50 rounded-xl hover:bg-white/35 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all text-gray-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white/25 backdrop-blur-md border border-white/50 rounded-xl hover:bg-white/35 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all text-gray-700"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* View Farmer Modal - Enhanced Glass */}
      {viewingFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md overflow-y-auto">
          <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden my-auto border border-white/60 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none rounded-[2rem]" />
            <div className="px-6 py-4 border-b border-white/40 bg-gradient-to-r from-[#066f48]/15 to-cyan-400/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1/2 h-full bg-white/20 blur-xl rounded-full pointer-events-none" />
              <div className="flex justify-between items-center relative z-10">
                <h3 className="text-lg font-bold text-[#066f48]">Farmer Details</h3>
                <button onClick={() => setViewingFarmer(null)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-white/50 rounded-lg transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6 relative z-10">
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
                    <p className="font-medium text-gray-800">{viewingFarmer.lga}</p>
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
              <div className="flex justify-end gap-3 pt-4 border-t border-white/30">
                {viewingFarmer.status === 'active' ? (
                  <button
                    onClick={() => {
                      setDeactivatingFarmer(viewingFarmer);
                      setViewingFarmer(null);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2 shadow-lg transition-all"
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
                    className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center gap-2 shadow-lg transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/60 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none rounded-[2rem]" />
            <div className="px-6 py-4 border-b border-white/40 bg-gradient-to-r from-red-500/15 to-red-400/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1/2 h-full bg-white/20 blur-xl rounded-full pointer-events-none" />
              <h3 className="text-lg font-bold text-red-700 relative z-10">Confirm Deactivation</h3>
            </div>
            <div className="p-6 space-y-4 relative z-10">
              {actionError && (
                <div className="bg-red-50/90 backdrop-blur-sm border border-red-200/50 rounded-xl p-3 flex items-center gap-2">
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
                  className="px-4 py-2 bg-white/40 backdrop-blur-md border border-white/60 rounded-xl hover:bg-white/50 transition-all text-gray-700"
                  disabled={loadingAction}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeactivateFarmer}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2 disabled:opacity-50 shadow-lg transition-all"
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