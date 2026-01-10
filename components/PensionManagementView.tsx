import React, { useState, useEffect } from 'react';
import { getStaffPayrollHistory, type PayrollTransaction } from '../api/payroll';
import { getAllStaff, type Staff } from '../api/staff';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

const PensionManagementView: React.FC = () => {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const response = await getAllStaff({
                page: 1,
                limit: 1000, // Get all staff for pension view
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

    // Calculate totals
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
        <div className="h-full flex flex-col p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Pension Management</h1>
                <p className="text-gray-600">Track staff pension contributions and balances</p>
            </div>

            {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-700">Total Staff</div>
                        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{filteredStaff.length}</div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg shadow-sm border border-emerald-200 p-5 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-emerald-700">Total Contributions</div>
                        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-emerald-900 tracking-tight break-words">{formatCurrency(totalContributions)}</div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm border border-blue-200 p-5 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-blue-700">Total Balance</div>
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-blue-900 tracking-tight break-words">{formatCurrency(totalPensionBalance)}</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-sm border border-purple-200 p-5 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-purple-700">Average per Staff</div>
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-purple-900 tracking-tight break-words">{formatCurrency(averagePension)}</div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name or employee ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                    />
                </div>
            </div>

            {/* Pension Rates Info */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                    <svg className="w-5 h-5 text-emerald-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <h3 className="text-sm font-semibold text-emerald-900 mb-1">Pension Contribution Rates (Nigerian Standard)</h3>
                        <div className="text-sm text-emerald-800 space-y-1">
                            <p>• Employee Contribution: <strong>8%</strong> of gross salary</p>
                            <p>• Employer Contribution: <strong>10%</strong> of gross salary</p>
                            <p>• Total Contribution: <strong>18%</strong> of gross salary</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Staff Pension Table */}
            <div className="flex-1 flex flex-col bg-white rounded-lg shadow overflow-hidden min-h-0">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-white">
                    <h2 className="text-lg font-semibold text-gray-900">Staff Pension Details</h2>
                    <p className="text-sm text-gray-600 mt-1">Comprehensive pension contribution tracking</p>
                </div>
                <div className="flex-1 overflow-x-auto overflow-y-auto">\n                    <table className="w-full divide-y divide-gray-200">\n                        <thead className="bg-gray-50 sticky top-0">\n                            <tr>\n                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">\n                                    Employee\n                                </th>\n                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">\n                                    Department\n                                </th>\n                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">\n                                    Monthly Salary\n                                </th>\n                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">\n                                    Expected Monthly Pension\n                                </th>\n                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">\n                                    Total Contributions\n                                </th>\n                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">\n                                    Pension Balance\n                                </th>\n                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">\n                                    Actions\n                                </th>\n                            </tr>\n                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredStaff.map((member) => {
                                // Calculate expected monthly pension (18% of gross salary)
                                const expectedMonthlyPension = member.monthlySalary * 0.18;

                                return (
                                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{member.fullName}</div>
                                                <div className="text-sm text-gray-500">{member.employeeId}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{member.department}</div>
                                            <div className="text-sm text-gray-500">{member.role}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                            {formatCurrency(member.monthlySalary)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="text-sm font-medium text-gray-900">{formatCurrency(expectedMonthlyPension)}</div>
                                            <div className="text-xs text-gray-500">
                                                8% + 10% of salary
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-emerald-600">
                                            {formatCurrency(member.pensionContributions)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-blue-600">
                                            {formatCurrency(member.wallet?.pensionBalance || 0)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => {
                                                    setSelectedStaff(member);
                                                    setShowHistoryModal(true);
                                                }}
                                                className="text-emerald-600 hover:text-emerald-900 transition-colors"
                                            >
                                                View History
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredStaff.length === 0 && (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">No staff members found</p>
                    </div>
                )}
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
};

// Pension History Modal
const PensionHistoryModal: React.FC<{
    staff: Staff;
    onClose: () => void;
}> = ({ staff, onClose }) => {
    const [transactions, setTransactions] = useState<PayrollTransaction[]>([]);
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
        const badges = {
            pending: <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Pending</span>,
            processing: <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">Processing</span>,
            completed: <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">Completed</span>,
            failed: <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Failed</span>,
        };
        return badges[status as keyof typeof badges] || status;
    };

    // Calculate cumulative pension
    let cumulativePension = 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Pension Contribution History</h2>
                            <div className="mt-2">
                                <p className="text-sm text-gray-600">{staff.fullName}</p>
                                <p className="text-sm text-gray-600">{staff.employeeId}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-emerald-50 rounded-lg p-4">
                            <div className="text-sm text-emerald-600 mb-1">Total Contributions</div>
                            <div className="text-2xl font-bold text-emerald-900">{formatCurrency(staff.pensionContributions)}</div>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-4">
                            <div className="text-sm text-emerald-600 mb-1">Current Balance</div>
                            <div className="text-2xl font-bold text-emerald-900">{formatCurrency(staff.wallet?.pensionBalance || 0)}</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="text-sm text-gray-600 mb-1">Payment Count</div>
                            <div className="text-2xl font-bold text-gray-900">{transactions.length}</div>
                        </div>
                    </div>

                    {loading ? (
                        <LoadingSpinner />
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="mt-2 text-sm text-gray-600">No pension history found</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross Salary</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee (8%)</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employer (10%)</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Pension</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cumulative</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {transactions.map((txn) => {
                                            if (txn.paymentStatus === 'completed') {
                                                cumulativePension += txn.totalPensionContribution;
                                            }

                                            return (
                                                <tr key={txn.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                        {txn.paymentDate ? new Date(txn.paymentDate).toLocaleDateString() : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                        {txn.payrollPeriodLabel || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                        {formatCurrency(txn.grossSalary)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-emerald-600">
                                                        {formatCurrency(txn.employeePensionContribution)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-emerald-600">
                                                        {formatCurrency(txn.employerPensionContribution)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-emerald-600">
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

export default PensionManagementView;
