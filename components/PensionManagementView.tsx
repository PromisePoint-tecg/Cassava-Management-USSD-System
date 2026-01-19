import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Wallet, TrendingUp, Search, X, ChevronLeft, ChevronRight, Info } from 'lucide-react';

// Mock API - Replace with actual imports
const getAllStaff = async (params: any) => ({
  staff: [
    {
      id: '1',
      fullName: 'John Doe',
      employeeId: 'EMP001',
      department: 'Engineering',
      role: 'Senior Developer',
      monthlySalary: 50000000,
      pensionContributions: 180000000,
      wallet: { pensionBalance: 180000000 }
    },
    {
      id: '2',
      fullName: 'Jane Smith',
      employeeId: 'EMP002',
      department: 'Marketing',
      role: 'Marketing Manager',
      monthlySalary: 40000000,
      pensionContributions: 144000000,
      wallet: { pensionBalance: 144000000 }
    },
  ]
});

const getStaffPayrollHistory = async (staffId: string, params: any) => ({
  transactions: [
    {
      id: '1',
      paymentDate: new Date().toISOString(),
      payrollPeriodLabel: 'January 2026',
      grossSalary: 50000000,
      employeePensionContribution: 4000000,
      employerPensionContribution: 5000000,
      totalPensionContribution: 9000000,
      paymentStatus: 'completed'
    }
  ],
  totalPages: 1
});

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#066f48]"></div>
  </div>
);

const ErrorMessage = ({ message, onDismiss }: { message: string; onDismiss: () => void }) => (
  <div className="bg-red-50/90 backdrop-blur-sm border border-red-200/50 rounded-[1.5rem] p-4 flex items-center justify-between mb-5">
    <p className="text-red-800">{message}</p>
    <button onClick={onDismiss} className="text-red-600 hover:text-red-800">
      <X className="w-5 h-5" />
    </button>
  </div>
);

export default function PensionManagementView() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await getAllStaff({
        page: 1,
        limit: 1000,
        is_approved: true,
        status: 'active',
      });
      setStaff(response.staff);
      setError(null);
    } catch (err) {
      setError('Failed to load staff pension data. Please try again.');
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staff.filter(member =>
    member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPensionBalance = filteredStaff.reduce((sum, s) => sum + (s.wallet?.pensionBalance || 0), 0);
  const totalContributions = filteredStaff.reduce((sum, s) => sum + s.pensionContributions, 0);
  const averagePension = filteredStaff.length > 0 ? totalContributions / filteredStaff.length : 0;

  const formatCurrency = (amount: number) => {
    const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    return `₦${(safeAmount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return <LoadingSpinner />;
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
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-3 rounded-xl bg-[#066f48] shadow-lg">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Pension Management</h1>
            <p className="text-sm text-gray-600">Track staff pension contributions and balances</p>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white/15 backdrop-blur-lg rounded-[1.5rem] border border-white/50 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_2px_rgba(255,255,255,0.4)_inset] p-6 relative overflow-hidden hover:bg-white/20 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[1.5rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/25 blur-2xl rounded-full pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-gray-700">Total Staff</div>
              <div className="w-10 h-10 bg-[#066f48] rounded-full flex items-center justify-center shadow-md">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{filteredStaff.length}</div>
          </div>
        </div>

        <div className="bg-white/15 backdrop-blur-lg rounded-[1.5rem] border border-white/50 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_2px_rgba(255,255,255,0.4)_inset] p-6 relative overflow-hidden hover:bg-white/20 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[1.5rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/25 blur-2xl rounded-full pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-gray-700">Total Contributions</div>
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 break-words">{formatCurrency(totalContributions)}</div>
          </div>
        </div>

        <div className="bg-white/15 backdrop-blur-lg rounded-[1.5rem] border border-white/50 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_2px_rgba(255,255,255,0.4)_inset] p-6 relative overflow-hidden hover:bg-white/20 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[1.5rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/25 blur-2xl rounded-full pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-gray-700">Total Balance</div>
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                <Wallet className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 break-words">{formatCurrency(totalPensionBalance)}</div>
          </div>
        </div>

        <div className="bg-white/15 backdrop-blur-lg rounded-[1.5rem] border border-white/50 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_2px_rgba(255,255,255,0.4)_inset] p-6 relative overflow-hidden hover:bg-white/20 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[1.5rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/25 blur-2xl rounded-full pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-gray-700">Average per Staff</div>
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center shadow-md">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 break-words">{formatCurrency(averagePension)}</div>
          </div>
        </div>
      </div>

      {/* Search Bar - Liquid Glass */}
      <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-white/30 to-transparent blur-2xl rounded-full pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 px-3 py-2 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent focus:outline-none text-gray-800 placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Pension Rates Info - Liquid Glass */}
      <div className="bg-white/15 backdrop-blur-lg rounded-[1.5rem] border border-white/50 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_2px_rgba(255,255,255,0.4)_inset] p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[1.5rem] pointer-events-none" />
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/25 blur-2xl rounded-full pointer-events-none" />
        <div className="flex items-start gap-3 relative z-10">
          <div className="p-2 rounded-lg bg-[#066f48]/20">
            <Info className="w-5 h-5 text-[#066f48]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Pension Contribution Rates (Nigerian Standard)</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p>• Employee Contribution: <strong>8%</strong> of gross salary</p>
              <p>• Employer Contribution: <strong>10%</strong> of gross salary</p>
              <p>• Total Contribution: <strong>18%</strong> of gross salary</p>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Pension Table - Liquid Glass */}
      <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/5 via-transparent to-cyan-400/5 rounded-[2rem] pointer-events-none" />
        
        <div className="px-6 py-4 border-b border-white/30 relative z-10">
          <h2 className="text-lg font-semibold text-gray-900">Staff Pension Details</h2>
          <p className="text-sm text-gray-600 mt-1">Comprehensive pension contribution tracking</p>
        </div>
        
        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/20 backdrop-blur-md text-gray-700 font-medium uppercase text-xs border-b border-white/30">
              <tr>
                <th className="px-6 py-3">Staff Member</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3 text-right">Monthly Salary</th>
                <th className="px-6 py-3 text-right">Expected Pension</th>
                <th className="px-6 py-3 text-right">Total Contributions</th>
                <th className="px-6 py-3 text-right">Current Balance</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/15">
              {filteredStaff.map((member) => {
                const expectedMonthlyPension = member.monthlySalary * 0.18;
                return (
                  <tr key={member.id} className="hover:bg-white/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{member.fullName}</div>
                      <div className="text-gray-600 text-xs">{member.employeeId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{member.department}</div>
                      <div className="text-gray-600 text-xs">{member.role}</div>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900">
                      {formatCurrency(member.monthlySalary)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-medium text-gray-900">{formatCurrency(expectedMonthlyPension)}</div>
                      <div className="text-xs text-gray-600">8% + 10% of salary</div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-[#066f48]">
                      {formatCurrency(member.pensionContributions)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-blue-600">
                      {formatCurrency(member.wallet?.pensionBalance || 0)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedStaff(member);
                          setShowHistoryModal(true);
                        }}
                        className="text-[#066f48] hover:text-[#055a3a] font-medium transition-colors"
                      >
                        View History
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredStaff.length === 0 && (
            <div className="text-center py-12">
              <Wallet className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-600">No staff members found</p>
            </div>
          )}
        </div>
      </div>

      {/* Pension History Modal */}
      {showHistoryModal && selectedStaff && (
        <PensionHistoryModal
          staff={selectedStaff}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedStaff(null);
          }}
        />
      )}
    </div>
  );
}

// Pension History Modal
const PensionHistoryModal = ({ staff, onClose }: { staff: any; onClose: () => void }) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await getStaffPayrollHistory(staff.id, { page, limit: 10 });
      setTransactions(response.transactions);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error('Error fetching pension history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    return `₦${(safeAmount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      pending: <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100/90 text-gray-700 border border-gray-200/50">Pending</span>,
      processing: <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-100/90 text-blue-700 border border-blue-200/50">Processing</span>,
      completed: <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-green-100/90 text-green-700 border border-green-200/50">Completed</span>,
      failed: <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-100/90 text-red-700 border border-red-200/50">Failed</span>,
    };
    return badges[status] || status;
  };

  let cumulativePension = 0;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-white/60 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none rounded-[2rem]" />
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/40 bg-gradient-to-r from-[#066f48]/15 to-cyan-400/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1/2 h-full bg-white/20 blur-xl rounded-full pointer-events-none" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Pension Contribution History</h2>
              <div className="mt-2">
                <p className="text-sm text-gray-700">{staff.fullName}</p>
                <p className="text-sm text-gray-600">{staff.employeeId}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)] relative z-10">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50/80 backdrop-blur-sm rounded-xl p-4 border border-green-200/50">
              <div className="text-sm text-green-600 mb-1">Total Contributions</div>
              <div className="text-2xl font-bold text-green-900">{formatCurrency(staff.pensionContributions)}</div>
            </div>
            <div className="bg-green-50/80 backdrop-blur-sm rounded-xl p-4 border border-green-200/50">
              <div className="text-sm text-green-600 mb-1">Current Balance</div>
              <div className="text-2xl font-bold text-green-900">{formatCurrency(staff.wallet?.pensionBalance || 0)}</div>
            </div>
            <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
              <div className="text-sm text-gray-600 mb-1">Payment Count</div>
              <div className="text-2xl font-bold text-gray-900">{transactions.length}</div>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-600">No pension history found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto bg-white/30 backdrop-blur-sm rounded-xl border border-white/40">
                <table className="min-w-full divide-y divide-white/20">
                  <thead className="bg-white/40 backdrop-blur-md">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Period</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Gross Salary</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Employee (8%)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Employer (10%)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total Pension</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Cumulative</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/20 backdrop-blur-sm divide-y divide-white/10">
                    {transactions.map((txn) => {
                      if (txn.paymentStatus === 'completed') {
                        cumulativePension += txn.totalPensionContribution;
                      }
                      return (
                        <tr key={txn.id} className="hover:bg-white/30 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {txn.paymentDate ? new Date(txn.paymentDate).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {txn.payrollPeriodLabel || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(txn.grossSalary)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-[#066f48]">
                            {formatCurrency(txn.employeePensionContribution)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-[#066f48]">
                            {formatCurrency(txn.employerPensionContribution)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[#066f48]">
                            {formatCurrency(txn.totalPensionContribution)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {txn.paymentStatus === 'completed' ? formatCurrency(cumulativePension) : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {getStatusBadge(txn.paymentStatus)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex justify-between items-center">
                <p className="text-sm text-gray-700">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-white/50 rounded-lg text-sm disabled:opacity-50 bg-white/30 hover:bg-white/40 text-gray-700 transition-all disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border border-white/50 rounded-lg text-sm disabled:opacity-50 bg-white/30 hover:bg-white/40 text-gray-700 transition-all disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
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