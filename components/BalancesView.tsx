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
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorMessage } from "./ErrorMessage";
import LeafInlineLoader, { LeafLoader } from "./Loader";

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
    return <LeafInlineLoader />;
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
      {/* Header - Liquid Glass */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-4 sm:p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-2xl sm:rounded-t-[2rem] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-2xl sm:rounded-b-[2rem] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/5 via-transparent to-cyan-400/5 rounded-2xl sm:rounded-[2rem] pointer-events-none" />
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-[#066f48]/10 to-transparent blur-2xl rounded-full pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 relative z-10">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Account Balances</h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              View your savings, pension, and wallet balances
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
            {onAddBankDetails && (
              <button
                onClick={onAddBankDetails}
                className="flex items-center justify-center px-3 sm:px-4 py-2 text-sm sm:text-base bg-green-600 text-white rounded-lg sm:rounded-xl hover:bg-green-700 transition-all shadow-lg flex-1 sm:flex-none"
              >
                <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="whitespace-nowrap">Add Bank</span>
              </button>
            )}
            {onRequestWithdrawal && (
              <button
                onClick={onRequestWithdrawal}
                className="flex items-center justify-center px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg sm:rounded-xl hover:bg-blue-700 transition-all shadow-lg flex-1 sm:flex-none"
              >
                <DollarSign className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="whitespace-nowrap">Withdraw</span>
              </button>
            )}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="flex items-center justify-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 bg-white/40 backdrop-blur-md border border-white/50 hover:bg-white/50 rounded-lg sm:rounded-xl transition-all"
              >
                <RefreshCw className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Balance Cards - Liquid Glass */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Savings Account Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-6 sm:p-8 text-center relative overflow-hidden hover:bg-white/15 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-2xl sm:rounded-t-[2rem] pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-2xl sm:rounded-b-[2rem] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/5 via-transparent to-cyan-400/5 rounded-2xl sm:rounded-[2rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <div className="inline-flex p-3 sm:p-4 bg-green-100/90 backdrop-blur-sm rounded-xl sm:rounded-2xl mb-3 sm:mb-4 border border-green-200/50">
              <PiggyBank className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
            <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-2">
              Savings Account
            </h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              {formatCurrency(balances?.savings || 0)}
            </p>
            <p className="text-xs text-gray-500">Available balance</p>
          </div>
        </div>

        {/* Pension Account Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-6 sm:p-8 text-center relative overflow-hidden hover:bg-white/15 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-2xl sm:rounded-t-[2rem] pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-2xl sm:rounded-b-[2rem] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/5 via-transparent to-cyan-400/5 rounded-2xl sm:rounded-[2rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <div className="inline-flex p-3 sm:p-4 bg-blue-100/90 backdrop-blur-sm rounded-xl sm:rounded-2xl mb-3 sm:mb-4 border border-blue-200/50">
              <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
            <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-2">
              Pension Account
            </h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              {formatCurrency(balances?.pension || 0)}
            </p>
            <p className="text-xs text-gray-500">Retirement savings</p>
          </div>
        </div>

        {/* Wallet Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-6 sm:p-8 text-center relative overflow-hidden hover:bg-white/15 transition-all sm:col-span-2 lg:col-span-1">
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-2xl sm:rounded-t-[2rem] pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-2xl sm:rounded-b-[2rem] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/5 via-transparent to-cyan-400/5 rounded-2xl sm:rounded-[2rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <div className="inline-flex p-3 sm:p-4 bg-purple-100/90 backdrop-blur-sm rounded-xl sm:rounded-2xl mb-3 sm:mb-4 border border-purple-200/50">
              <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
            </div>
            <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-2">Wallet</h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              {formatCurrency(balances?.wallet || 0)}
            </p>
            <p className="text-xs text-gray-500">Digital wallet</p>
          </div>
        </div>
      </div>

      {/* Info Banner - Liquid Glass */}
      <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-xl sm:rounded-[1.5rem] p-3 sm:p-4 shadow-sm">
        <p className="text-xs sm:text-sm text-blue-800">
          <strong>Note:</strong> Balances are updated in real-time. For
          transaction history or detailed statements, please contact support.
        </p>
      </div>
    </div>
  );
};