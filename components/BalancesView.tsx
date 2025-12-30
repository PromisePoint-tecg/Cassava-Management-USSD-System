import React, { useState } from "react";
import {
  PiggyBank,
  Building2,
  Wallet,
  Plus,
  RefreshCw,
} from "lucide-react";
import { StaffBalances } from "../api/staff";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorMessage } from "./ErrorMessage";

interface BalancesViewProps {
  balances: StaffBalances | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onAddBankDetails?: () => void;
}

export const BalancesView: React.FC<BalancesViewProps> = ({
  balances,
  loading = false,
  error = null,
  onRefresh,
  onAddBankDetails,
}) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return <LoadingSpinner message="Loading balances..." />;
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Account Balances</h2>
          <p className="text-gray-600 mt-1">
            View your savings, pension, and wallet balances
          </p>
        </div>
        <div className="flex gap-3">
          {onAddBankDetails && (
            <button
              onClick={onAddBankDetails}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Bank Details
            </button>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
          <div className="inline-flex p-4 bg-green-100 rounded-full mb-4">
            <PiggyBank className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Savings Account
          </h3>
          <p className="text-3xl font-bold text-gray-800 mb-2">
            {formatCurrency(balances?.savings || 0)}
          </p>
          <p className="text-xs text-gray-500">Available balance</p>
        </div>

        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
          <div className="inline-flex p-4 bg-blue-100 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Pension Account
          </h3>
          <p className="text-3xl font-bold text-gray-800 mb-2">
            {formatCurrency(balances?.pension || 0)}
          </p>
          <p className="text-xs text-gray-500">Retirement savings</p>
        </div>

        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
          <div className="inline-flex p-4 bg-purple-100 rounded-full mb-4">
            <Wallet className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Wallet</h3>
          <p className="text-3xl font-bold text-gray-800 mb-2">
            {formatCurrency(balances?.wallet || 0)}
          </p>
          <p className="text-xs text-gray-500">Digital wallet</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Balances are updated in real-time. For
          transaction history or detailed statements, please contact support.
        </p>
      </div>
    </div>
  );
};