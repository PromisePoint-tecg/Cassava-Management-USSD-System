import React, { useState } from 'react';
import { Loan, Farmer, LoanStatus } from '../types';
import { Plus, Search, AlertCircle, CheckCircle2, Banknote, Calendar, AlertTriangle } from 'lucide-react';

interface LoansViewProps {
  loans: Loan[];
  farmers: Farmer[];
  onIssueLoan: (loanData: { farmerId: string; type: 'Input Credit' | 'Cash Loan'; principal: number; dueDate: string }) => void;
  onRepayLoan: (loanId: string, amount: number) => void;
}

export const LoansView: React.FC<LoansViewProps> = ({ loans, farmers, onIssueLoan, onRepayLoan }) => {
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [repayLoanId, setRepayLoanId] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  // Form states for Issue Loan
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [loanType, setLoanType] = useState<'Input Credit' | 'Cash Loan'>('Input Credit');
  const [principal, setPrincipal] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState('');

  // Form state for Repay Loan
  const [repayAmount, setRepayAmount] = useState<number | ''>('');

  const activeLoansCount = loans.filter(l => l.status === LoanStatus.ACTIVE).length;
  const defaultedLoansCount = loans.filter(l => l.status === LoanStatus.DEFAULTED).length;
  const totalOutstanding = loans.reduce((sum, l) => sum + l.outstandingBalance, 0);

  const filteredLoans = loans.filter(l =>
    l.farmerName.toLowerCase().includes(filter.toLowerCase()) ||
    l.id.toLowerCase().includes(filter.toLowerCase())
  );

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFarmerId && principal && dueDate) {
      onIssueLoan({
        farmerId: selectedFarmerId,
        type: loanType,
        principal: Number(principal),
        dueDate
      });
      setIsIssueModalOpen(false);
      resetIssueForm();
    }
  };

  const resetIssueForm = () => {
    setSelectedFarmerId('');
    setPrincipal('');
    setDueDate('');
    setLoanType('Input Credit');
  };

  const handleRepaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repayLoanId && repayAmount) {
      onRepayLoan(repayLoanId, Number(repayAmount));
      setRepayLoanId(null);
      setRepayAmount('');
    }
  };

  const selectedLoanForRepayment = loans.find(l => l.id === repayLoanId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Loan Management</h2>
        <button
          onClick={() => setIsIssueModalOpen(true)}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Issue New Loan
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Banknote className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Total Outstanding</h3>
          <p className="text-2xl font-bold text-gray-900">₦{totalOutstanding.toLocaleString()}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
           <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Active Loans</h3>
          <p className="text-2xl font-bold text-gray-900">{activeLoansCount}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
           <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Defaulted Loans</h3>
          <p className="text-2xl font-bold text-gray-900">{defaultedLoansCount}</p>
        </div>
      </div>

      {/* Loan Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by farmer name or loan ID..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-medium uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Loan ID</th>
                <th className="px-6 py-4">Farmer</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Principal</th>
                <th className="px-6 py-4">Outstanding</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-gray-500">{loan.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{loan.farmerName}</td>
                  <td className="px-6 py-4">{loan.type}</td>
                  <td className="px-6 py-4">₦{loan.principal.toLocaleString()}</td>
                  <td className="px-6 py-4 font-bold text-gray-700">₦{loan.outstandingBalance.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      loan.status === LoanStatus.ACTIVE ? 'bg-blue-100 text-blue-800' :
                      loan.status === LoanStatus.PAID ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {loan.status === LoanStatus.ACTIVE && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {loan.status === LoanStatus.DEFAULTED && <AlertCircle className="w-3 h-3 mr-1" />}
                      {loan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{new Date(loan.dueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    {loan.status !== LoanStatus.PAID && (
                      <button 
                        onClick={() => setRepayLoanId(loan.id)}
                        className="text-emerald-600 hover:text-emerald-800 font-medium text-xs border border-emerald-200 hover:bg-emerald-50 px-3 py-1.5 rounded transition-colors"
                      >
                        Repay
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredLoans.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-gray-400">
                    No loans found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Loan Modal */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-emerald-50">
              <h3 className="text-lg font-bold text-emerald-900">Issue New Loan</h3>
              <button onClick={() => setIsIssueModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <span className="sr-only">Close</span>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleIssueSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Farmer</label>
                <select
                  required
                  className="w-full rounded-lg border-gray-300 border px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  value={selectedFarmerId}
                  onChange={(e) => setSelectedFarmerId(e.target.value)}
                >
                  <option value="">-- Choose a farmer --</option>
                  {farmers.filter(f => f.status === 'Active').map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loan Type</label>
                <select
                  required
                  className="w-full rounded-lg border-gray-300 border px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  value={loanType}
                  onChange={(e) => setLoanType(e.target.value as 'Input Credit' | 'Cash Loan')}
                >
                  <option value="Input Credit">Input Credit (Fertilizer/Stems)</option>
                  <option value="Cash Loan">Cash Loan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Principal Amount (₦)</label>
                <input
                  type="number"
                  required
                  min="1000"
                  step="100"
                  className="w-full rounded-lg border-gray-300 border px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  value={principal}
                  onChange={(e) => setPrincipal(parseFloat(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    required
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                >
                  Issue Loan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repay Loan Modal */}
      {repayLoanId && selectedLoanForRepayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">Record Repayment</h3>
              <p className="text-sm text-gray-500">For {selectedLoanForRepayment.farmerName}</p>
            </div>
            <form onSubmit={handleRepaySubmit} className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-4">
                <p>Outstanding Balance:</p>
                <p className="text-xl font-bold">₦{selectedLoanForRepayment.outstandingBalance.toLocaleString()}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Repayment Amount (₦)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedLoanForRepayment.outstandingBalance}
                  className="w-full rounded-lg border-gray-300 border px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(parseFloat(e.target.value))}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setRepayLoanId(null); setRepayAmount(''); }}
                  className="flex-1 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
