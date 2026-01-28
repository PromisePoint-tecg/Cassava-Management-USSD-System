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
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-3">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-gray-600">Total Staff</div>
            <div className="w-10 h-10 bg-[#066f48] rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800">{filteredStaff.length}</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-gray-600">Total Contributions</div>
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-800 break-words">{formatCurrency(totalContributions)}</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-gray-600">Total Balance</div>
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-800 break-words">{formatCurrency(totalPensionBalance)}</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-gray-600">Average per Staff</div>
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-800 break-words">{formatCurrency(averagePension)}</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent focus:outline-none text-gray-800 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Pension Rates Info */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[#066f48]/10">
            <Info className="w-5 h-5 text-[#066f48]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Pension Contribution Rates (Nigerian Standard)</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Employee Contribution: <strong>8%</strong> of gross salary</p>
              <p>• Employer Contribution: <strong>10%</strong> of gross salary</p>
              <p>• Total Contribution: <strong>18%</strong> of gross salary</p>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Pension Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Staff Pension Details</h2>
          <p className="text-sm text-gray-500 mt-1">Comprehensive pension contribution tracking</p>
        </div>
        
        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4 p-4">
          {filteredStaff.map((member) => {
            const expectedMonthlyPension = member.monthlySalary * 0.18;
            return (
              <div key={member.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-medium text-gray-800">{member.fullName}</div>
                    <div className="text-xs text-gray-500 mt-1">{member.employeeId}</div>
                    <div className="text-xs text-gray-500 mt-1">{member.department} • {member.role}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                  <div>
                    <span className="text-gray-500">Monthly Salary</span>
                    <p className="font-medium text-gray-800">{formatCurrency(member.monthlySalary)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Expected Pension</span>
                    <p className="font-medium text-gray-800">{formatCurrency(expectedMonthlyPension)}</p>
                    <p className="text-xs text-gray-500">8% + 10% of salary</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Contributions</span>
                    <p className="font-medium text-[#066f48]">{formatCurrency(member.pensionContributions)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Current Balance</span>
                    <p className="font-medium text-blue-600">{formatCurrency(member.wallet?.pensionBalance || 0)}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setSelectedStaff(member);
                      setShowHistoryModal(true);
                    }}
                    className="w-full px-4 py-2 bg-[#066f48] text-white rounded-lg hover:bg-[#055a3a] font-medium transition-colors text-sm"
                  >
                    View History
                  </button>
                </div>
              </div>
            );
          })}
          {filteredStaff.length === 0 && (
            <div className="text-center py-12">
              <Wallet className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-600">No staff members found</p>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Salary</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Pension</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Contributions</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStaff.map((member) => {
                const expectedMonthlyPension = member.monthlySalary * 0.18;
                return (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-800">{member.fullName}</div>
                      <div className="text-gray-500 text-xs">{member.employeeId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-800">{member.department}</div>
                      <div className="text-gray-500 text-xs">{member.role}</div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap text-gray-800">
                      {formatCurrency(member.monthlySalary)}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="font-medium text-gray-800">{formatCurrency(expectedMonthlyPension)}</div>
                      <div className="text-xs text-gray-500">8% + 10% of salary</div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap font-medium text-[#066f48]">
                      {formatCurrency(member.pensionContributions)}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap font-medium text-blue-600">
                      {formatCurrency(member.wallet?.pensionBalance || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedStaff(member);
                          setShowHistoryModal(true);
                        }}
                        className="text-[#066f48] hover:text-[#055a3a] font-medium transition-colors text-sm"
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
      pending: <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-yellow-100 text-yellow-700 border border-yellow-200">Pending</span>,
      processing: <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-100 text-blue-700 border border-blue-200">Processing</span>,
      completed: <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-green-100 text-green-700 border border-green-200">Completed</span>,
      failed: <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-red-100 text-red-700 border border-red-200">Failed</span>,
    };
    return badges[status] || status;
  };

  let cumulativePension = 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-start">
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

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm text-green-700 mb-1">Total Contributions</div>
              <div className="text-2xl font-bold text-green-800">{formatCurrency(staff.pensionContributions)}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm text-green-700 mb-1">Current Balance</div>
              <div className="text-2xl font-bold text-green-800">{formatCurrency(staff.wallet?.pensionBalance || 0)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Payment Count</div>
              <div className="text-2xl font-bold text-gray-800">{transactions.length}</div>
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
              <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
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
                  <tbody className="bg-white divide-y divide-gray-200">
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
              <div className="mt-4 px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <p className="text-sm text-gray-600">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 rounded-lg bg-white border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 rounded-lg bg-white border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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