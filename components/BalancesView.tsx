import React, { useState } from "react";
import {
  PiggyBank,
  Building2,
  Wallet,
  Plus,
  RefreshCw,
  DollarSign,
} from "lucide-react";
import { StaffBalances } from "../services/staff";
import { ErrorMessage } from "./ErrorMessage";
import LeafInlineLoader from "./Loader";

interface BalancesViewProps {
  balances: StaffBalances | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onAddBankDetails?: () => void;
  onRequestWithdrawal?: () => void;
}

export const BalancesView: React.FC<BalancesViewProps> = ({
  balances,
  loading = false,
  error = null,
  onRefresh,
  onAddBankDetails,
  onRequestWithdrawal,
}) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

 if (loading) {
  return (
    <div className="space-y-4 sm:space-y-5 px-3 sm:px-0">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12">
        <div className="flex items-center justify-center">
          <LeafInlineLoader />
        </div>
      </div>
    </div>
  );
}

  if (error) {
    return (
      <ErrorMessage
        title="Error Loading Balances"
        message={error}
        onRetry={onRefresh}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 px-3 sm:px-0">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Account Balances</h2>
            <p className="text-sm text-gray-600 mt-1">
              View your savings, pension, and wallet balances
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
            {onAddBankDetails && (
              <button
                onClick={onAddBankDetails}
                className="flex items-center justify-center px-3 sm:px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm flex-1 sm:flex-none"
              >
                <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="whitespace-nowrap">Add Bank</span>
              </button>
            )}
            {onRequestWithdrawal && (
              <button
                onClick={onRequestWithdrawal}
                className="flex items-center justify-center px-3 sm:px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm flex-1 sm:flex-none"
              >
                <DollarSign className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="whitespace-nowrap">Withdraw</span>
              </button>
            )}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="flex items-center justify-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-all"
              >
                <RefreshCw className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Savings Account Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center hover:shadow-md transition-all">
          <div className="inline-flex p-3 sm:p-4 bg-green-100 rounded-lg mb-3 sm:mb-4">
            <PiggyBank className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
          </div>
          <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-2">
            Savings Account
          </h3>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {formatCurrency(balances?.savings || 0)}
          </p>
          <p className="text-xs text-gray-500">Available balance</p>
        </div>

        {/* Pension Account Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center hover:shadow-md transition-all">
          <div className="inline-flex p-3 sm:p-4 bg-blue-100 rounded-lg mb-3 sm:mb-4">
            <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
          </div>
          <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-2">
            Pension Account
          </h3>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {formatCurrency(balances?.pension || 0)}
          </p>
          <p className="text-xs text-gray-500">Retirement savings</p>
        </div>

        {/* Wallet Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center hover:shadow-md transition-all sm:col-span-2 lg:col-span-1">
          <div className="inline-flex p-3 sm:p-4 bg-purple-100 rounded-lg mb-3 sm:mb-4">
            <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
          </div>
          <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-2">Wallet</h3>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {formatCurrency(balances?.wallet || 0)}
          </p>
          <p className="text-xs text-gray-500">Digital wallet</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 shadow-sm">
        <p className="text-xs sm:text-sm text-blue-800">
          <strong>Note:</strong> Balances are updated in real-time. For
          transaction history or detailed statements, please contact support.
        </p>
      </div>
    </div>
  );
};