import React, { useState, useEffect } from "react";
import {
  bonusApi,
  type BonusWallet,
  type StaffBonusBalance,
  type BonusAssignmentResponse,
  type FundBonusWalletData,
  type AssignBonusData,
  type TransferBonusData,
  type BonusTransaction,
  type BonusTransactionType,
} from "../api/bonus";
import { staffApi, type Staff } from "../api/staff";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorMessage } from "./ErrorMessage";
import { SuccessModal } from "./SuccessModal";
import {
  Wallet,
  DollarSign,
  Users,
  Gift,
  Send,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  ArrowDown,
  History,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import LeafInlineLoader from "./Loader";

const BonusManagementView: React.FC = () => {
  const [bonusWallet, setBonusWallet] = useState<BonusWallet | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [staffBonusBalances, setStaffBonusBalances] = useState<StaffBonusBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState<string | null>(null);

  // Modals and forms
  const [showFundWalletModal, setShowFundWalletModal] = useState(false);
  const [showAssignBonusModal, setShowAssignBonusModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Form states
  const [fundAmount, setFundAmount] = useState<number>(0);
  const [fundReason, setFundReason] = useState<string>("");
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set());
  const [bonusAmounts, setBonusAmounts] = useState<Record<string, number>>({});
  const [bonusReasons, setBonusReasons] = useState<Record<string, string>>({});
  const [transferStaffId, setTransferStaffId] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<number | undefined>();

  // Loading states
  const [funding, setFunding] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [transferring, setTransferring] = useState(false);

  // Transactions state
  const [activeTab, setActiveTab] = useState<"balances" | "transactions">("balances");
  const [bonusTransactions, setBonusTransactions] = useState<BonusTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [txPage, setTxPage] = useState(1);
  const [txLimit, setTxLimit] = useState(10);
  const [txTotal, setTxTotal] = useState(0);
  const [txType, setTxType] = useState<"" | BonusTransactionType>("");
  const [txStaffId, setTxStaffId] = useState<string>("");
  const [txSearch, setTxSearch] = useState<string>("");
  const [selectedTx, setSelectedTx] = useState<BonusTransaction | null>(null);

  // Staff pagination and search for assign bonus modal
  const [staffPage, setStaffPage] = useState(1);
  const [staffLimit, setStaffLimit] = useState(10);
  const [staffTotal, setStaffTotal] = useState(0);
  const [staffSearch, setStaffSearch] = useState("");
  const [staffLoading, setStaffLoading] = useState(false);

  // Balances pagination
  const [balancesPage, setBalancesPage] = useState(1);
  const [balancesPerPage] = useState(10);

  useEffect(() => {
    fetchData();
    fetchInitialStaff();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchBonusWallet(),
      fetchStaffBonusBalances(),
    ]);
    setLoading(false);
  };

  const fetchInitialStaff = async () => {
    try {
      const response = await staffApi.getAllStaff({
        limit: 1000,
        status: "active",
        is_approved: true,
      });
      setStaff(response.staff || []);
      setStaffTotal(response.total || 0);
    } catch (err: any) {
      console.error("Failed to fetch initial staff:", err);
    }
  };

  const fetchBonusWallet = async () => {
    try {
      setWalletLoading(true);
      setWalletError(null);
      const wallet = await bonusApi.getBonusWallet();
      setBonusWallet(wallet);
    } catch (err: any) {
      const errorMsg = err?.message || "Bonus wallet not found";
      if (errorMsg.includes("not found")) {
        setWalletError("No bonus wallet. Click 'Fund Bonus Wallet' to create one.");
      } else {
        setWalletError(errorMsg);
      }
      setBonusWallet(null);
    } finally {
      setWalletLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      setStaffLoading(true);
      const response = await staffApi.getAllStaff({
        page: staffPage,
        limit: staffLimit,
        search: staffSearch || undefined,
        status: "active",
        is_approved: true,
      });
      setStaff(response.staff || []);
      setStaffTotal(response.total || 0);
    } catch (err: any) {
      setError(err?.message || "Failed to load staff");
    } finally {
      setStaffLoading(false);
    }
  };

  const fetchStaffBonusBalances = async () => {
    try {
      const balances = await bonusApi.getAllStaffBonusBalances();
      setStaffBonusBalances(balances);
    } catch (err: any) {
      console.error("Failed to fetch staff bonus balances:", err);
    }
  };

  const fetchBonusTransactions = async (overridePage?: number) => {
    try {
      setTxLoading(true);
      setTxError(null);

      const result = await bonusApi.getBonusTransactions({
        page: overridePage ?? txPage,
        limit: txLimit,
        type: txType || undefined,
        staffId: txStaffId || undefined,
        search: txSearch || undefined,
      });

      setBonusTransactions(result.items || []);
      setTxTotal(result.total || 0);
      if (overridePage) {
        setTxPage(overridePage);
      }
    } catch (err: any) {
      setTxError(err?.message || "Failed to load bonus transactions");
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "transactions") {
      fetchBonusTransactions();
    }
  }, [activeTab, txPage, txLimit, txType, txStaffId, txSearch]);

  useEffect(() => {
    if (showAssignBonusModal) {
      fetchStaff();
    }
  }, [showAssignBonusModal, staffPage, staffLimit, staffSearch]);

  const handleFundWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fundAmount < 1000) {
      setError("Minimum funding amount is ₦1,000");
      return;
    }

    try {
      setFunding(true);
      setError(null);

      const data: FundBonusWalletData = {
        amount: fundAmount,
        reason: fundReason || undefined,
      };

      if (!bonusWallet) {
        await bonusApi.createBonusWallet();
      }

      await bonusApi.fundBonusWallet(data);
      
      setSuccessMessage(`Bonus wallet funded successfully with ₦${fundAmount.toLocaleString()}`);
      setShowSuccessModal(true);
      setShowFundWalletModal(false);
      setFundAmount(0);
      setFundReason("");
      
      await fetchBonusWallet();
    } catch (err: any) {
      setError(err?.message || "Failed to fund bonus wallet");
    } finally {
      setFunding(false);
    }
  };

  const handleAssignBonuses = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStaff.size === 0) {
      setError("Please select at least one staff member");
      return;
    }

    const invalidAmounts = Array.from(selectedStaff).filter(
      staffId => !bonusAmounts[staffId] || bonusAmounts[staffId] < 100
    );

    if (invalidAmounts.length > 0) {
      setError("All selected staff must have bonus amounts of at least ₦100");
      return;
    }

    try {
      setAssigning(true);
      setError(null);

      const staffBonuses = Array.from(selectedStaff).map(staffId => ({
        staffId: String(staffId),
        amount: bonusAmounts[String(staffId)],
        reason: bonusReasons[String(staffId)] || "Admin bonus allocation",
      }));

      const data: AssignBonusData = { staffBonuses };
      const result = await bonusApi.assignBonuses(data);

      let message = `Bonuses assigned: ${result.success} successful`;
      if (result.failed > 0) {
        message += `, ${result.failed} failed`;
      }

      setSuccessMessage(message);
      setShowSuccessModal(true);
      setShowAssignBonusModal(false);
      
      setSelectedStaff(new Set());
      setBonusAmounts({});
      setBonusReasons({});

      await fetchData();
    } catch (err: any) {
      setError(err?.message || "Failed to assign bonuses");
    } finally {
      setAssigning(false);
    }
  };

  const handleTransferBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferStaffId) {
      setError("Please select a staff member");
      return;
    }

    try {
      setTransferring(true);
      setError(null);

      const data: TransferBonusData = {
        staffId: transferStaffId,
        amount: transferAmount,
      };

      await bonusApi.transferBonusToWallet(data);
      
      const staffMember = staff.find(s => s.id === transferStaffId);
      const staffName = staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : "Staff";
      
      setSuccessMessage(
        `Bonus transferred successfully to ${staffName}'s main wallet`
      );
      setShowSuccessModal(true);
      setShowTransferModal(false);
      
      setTransferStaffId("");
      setTransferAmount(undefined);

      await fetchStaffBonusBalances();
    } catch (err: any) {
      setError(err?.message || "Failed to transfer bonus");
    } finally {
      setTransferring(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTypeLabel = (type?: BonusTransactionType | string) => {
    switch (type) {
      case 'bonus_wallet_funding':
        return 'Bonus Wallet Funding';
      case 'bonus_allocation':
        return 'Bonus Allocation';
      case 'bonus_transfer':
        return 'Bonus Transfer to Wallet';
      default:
        return type || '—';
    }
  };

  const getStaffNameById = (staffId?: string) => {
    if (!staffId) return '—';
    const person = staff.find((s) => s.id === staffId);
    return person ? `${person.firstName} ${person.lastName}` : staffId;
  };

  const totalTxPages = Math.max(1, Math.ceil((txTotal || 0) / (txLimit || 1)));

  const getStaffBonusBalance = (staffId: string): number => {
    const balance = staffBonusBalances.find(b => b.staffId === staffId);
    return balance?.bonusBalance || 0;
  };

  if (loading && staff.length === 0) {
    return <LeafInlineLoader />;
  }

  return (
    <div className="space-y-5">
      {/* Header - Liquid Glass */}
      <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 via-transparent to-green-400/5 rounded-[2rem] pointer-events-none" />
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-emerald-600/10 to-transparent blur-2xl rounded-full pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-600 shadow-lg">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Staff Bonus Management</h2>
              <p className="text-sm text-gray-600">Manage staff bonuses and rewards</p>
            </div>
          </div>
          {error && (
            <div className="flex items-center text-red-700 bg-red-100/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-red-200/50">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="text-sm">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-3 text-red-500 hover:text-red-700"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Actions Bar - Liquid Glass */}
      <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-white/30 to-transparent blur-2xl rounded-full pointer-events-none" />
        
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center relative z-10">
          <h2 className="text-lg font-semibold text-gray-800">Bonus Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowFundWalletModal(true)}
              className="px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg whitespace-nowrap flex items-center"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Fund Bonus Wallet
            </button>
            <button
              onClick={() => setShowAssignBonusModal(true)}
              className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg whitespace-nowrap flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={!bonusWallet || bonusWallet.balance === 0}
            >
              <Gift className="w-4 h-4 mr-2" />
              Assign Bonuses
            </button>
            <button
              onClick={() => setShowTransferModal(true)}
              className="px-6 py-2 bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 transition-all shadow-lg whitespace-nowrap flex items-center"
            >
              <Send className="w-4 h-4 mr-2" />
              Transfer Bonus
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards - Liquid Glass */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Bonus Wallet Balance */}
        <div className="bg-white/15 backdrop-blur-lg rounded-[1.5rem] border border-white/50 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_2px_rgba(255,255,255,0.4)_inset] p-6 relative overflow-hidden hover:bg-white/20 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[1.5rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/25 blur-2xl rounded-full pointer-events-none" />
          
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="text-sm font-medium text-gray-700">Bonus Wallet Balance</div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          </div>
          <div className="mt-2 relative z-10">
            {walletLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-emerald-200/50 rounded w-24 mb-1"></div>
                <div className="h-4 bg-emerald-200/50 rounded w-16"></div>
              </div>
            ) : walletError ? (
              <div className="text-red-600 text-sm">{walletError}</div>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-800">
                  {formatCurrency(bonusWallet?.balance || 0)}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Available for bonuses
                </div>
              </>
            )}
          </div>
        </div>

        {/* Total Staff */}
        <div className="bg-white/15 backdrop-blur-lg rounded-[1.5rem] border border-white/50 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_2px_rgba(255,255,255,0.4)_inset] p-6 relative overflow-hidden hover:bg-white/20 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[1.5rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/25 blur-2xl rounded-full pointer-events-none" />
          
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="text-sm font-medium text-gray-700">Active Staff</div>
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-gray-800 relative z-10">{staff.length}</div>
          <div className="text-xs text-gray-600 mt-1 relative z-10">Eligible for bonuses</div>
        </div>

        {/* Staff with Bonuses */}
        <div className="bg-white/15 backdrop-blur-lg rounded-[1.5rem] border border-white/50 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_2px_rgba(255,255,255,0.4)_inset] p-6 relative overflow-hidden hover:bg-white/20 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[1.5rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/25 blur-2xl rounded-full pointer-events-none" />
          
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="text-sm font-medium text-gray-700">Staff with Bonuses</div>
            <Gift className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-800 relative z-10">
            {staffBonusBalances.filter(b => b.bonusBalance > 0).length}
          </div>
          <div className="text-xs text-gray-600 mt-1 relative z-10">Have pending bonuses</div>
        </div>
      </div>

      {/* Tabs - Liquid Glass */}
      <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-3 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-white/30 to-transparent blur-2xl rounded-full pointer-events-none" />
        
        <div className="flex gap-2 relative z-10">
          <button
            onClick={() => setActiveTab("balances")}
            className={`px-4 py-2 rounded-xl border transition-all ${
              activeTab === "balances"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-lg"
                : "text-gray-700 border-white/50 bg-white/20 hover:bg-white/30 backdrop-blur-md"
            }`}
          >
            Balances
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`px-4 py-2 rounded-xl border transition-all ${
              activeTab === "transactions"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-lg"
                : "text-gray-700 border-white/50 bg-white/20 hover:bg-white/30 backdrop-blur-md"
            }`}
          >
            Transactions
          </button>
        </div>
      </div>

      {activeTab === "balances" && (
        <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 via-transparent to-green-400/5 rounded-[2rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
          
          <div className="p-6 border-b border-white/30 relative z-10">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Users className="w-5 h-5 mr-2 text-emerald-600" />
              Staff Bonus Balances
            </h3>
          </div>
          <div className="overflow-x-auto relative z-10">
            {staffBonusBalances.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <Gift className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No bonus balances found</p>
                <p className="text-sm mt-1">Assign bonuses to staff to see them here</p>
              </div>
            ) : (() => {
              const balancesWithPositive = staffBonusBalances.filter(b => b.bonusBalance > 0);
              const startIndex = (balancesPage - 1) * balancesPerPage;
              const endIndex = startIndex + balancesPerPage;
              const paginatedBalances = balancesWithPositive.slice(startIndex, endIndex);
              const totalPages = Math.ceil(balancesWithPositive.length / balancesPerPage);

              return (
                <>
                  <table className="min-w-full text-left text-sm text-gray-700">
                    <thead className="bg-white/20 backdrop-blur-md text-gray-700 font-medium uppercase text-xs border-b border-white/30">
                      <tr>
                        <th className="px-6 py-3">Staff Member</th>
                        <th className="px-6 py-3">Department</th>
                        <th className="px-6 py-3 text-right">Bonus Balance</th>
                        <th className="px-6 py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/15">
                      {paginatedBalances.map((balance) => {
                        const staffMember = staff.find(s => s.id === balance.staffId);
                        return (
                          <tr key={balance.staffId} className="hover:bg-white/10 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-emerald-100/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50">
                                  <span className="text-emerald-700 font-medium text-sm">
                                    {balance.firstName?.[0]}{balance.lastName?.[0]}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-800">
                                    {balance.firstName} {balance.lastName}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {staffMember?.employeeId || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-800">{staffMember?.department || '—'}</div>
                              <div className="text-xs text-gray-600">{staffMember?.role || '—'}</div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="text-sm font-semibold text-emerald-700">
                                {formatCurrency(balance.bonusBalance)}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => {
                                  setTransferStaffId(balance.staffId);
                                  setShowTransferModal(true);
                                }}
                                className="inline-flex items-center px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-all shadow-lg"
                              >
                                <Send className="w-3.5 h-3.5 mr-1.5" />
                                Transfer
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-white/30 bg-white/10 backdrop-blur-md flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Showing {startIndex + 1} - {Math.min(endIndex, balancesWithPositive.length)} of {balancesWithPositive.length} staff with bonuses
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setBalancesPage(p => Math.max(1, p - 1))}
                          disabled={balancesPage === 1}
                          className="px-3 py-1 text-sm border border-white/50 bg-white/20 backdrop-blur-md rounded-xl hover:bg-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-gray-700">
                          Page {balancesPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => setBalancesPage(p => Math.min(totalPages, p + 1))}
                          disabled={balancesPage >= totalPages}
                          className="px-3 py-1 text-sm border border-white/50 bg-white/20 backdrop-blur-md rounded-xl hover:bg-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 via-transparent to-green-400/5 rounded-[2rem] pointer-events-none" />
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
          
          <div className="p-6 border-b border-white/30 relative z-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <History className="w-5 h-5 mr-2 text-emerald-600" />
                Bonus Transactions
              </h3>
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-emerald-600" />
                  <select
                    value={txType}
                    onChange={(e) => {
                      setTxPage(1);
                      setTxType(e.target.value as BonusTransactionType | "");
                    }}
                    className="border border-white/50 bg-white/40 backdrop-blur-md rounded-xl px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700"
                  >
                    <option value="">All types</option>
                    <option value="bonus_wallet_funding">Bonus Funding</option>
                    <option value="bonus_allocation">Bonus Allocation</option>
                    <option value="bonus_transfer">Bonus Transfer</option>
                  </select>
                </div>
                <div>
                  <select
                    value={txStaffId}
                    onChange={(e) => {
                      setTxPage(1);
                      setTxStaffId(e.target.value);
                    }}
                    className="border border-white/50 bg-white/40 backdrop-blur-md rounded-xl px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[180px] text-gray-700"
                  >
                    <option value="">All staff</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center border border-white/50 bg-white/40 backdrop-blur-md rounded-xl px-2 py-1">
                  <Search className="w-4 h-4 text-emerald-600" />
                  <input
                    value={txSearch}
                    onChange={(e) => {
                      setTxPage(1);
                      setTxSearch(e.target.value);
                    }}
                    placeholder="Search reference"
                    className="bg-transparent px-2 py-1 text-sm focus:outline-none min-w-[160px] text-gray-700 placeholder-gray-500"
                  />
                </div>
                <select
                  value={txLimit}
                  onChange={(e) => setTxLimit(Number(e.target.value))}
                  className="border border-white/50 bg-white/40 backdrop-blur-md rounded-xl px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700"
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>
            </div>
          </div>
          <div className="p-6 relative z-10">
            {txLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            ) : txError ? (
              <div className="bg-red-50/90 backdrop-blur-sm border border-red-200/50 rounded-[1.5rem] p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-800">{txError}</p>
              </div>
            ) : bonusTransactions.length === 0 ? (
              <div className="text-center py-10 text-gray-600">
                <Gift className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No bonus transactions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-gray-700">
                  <thead className="bg-white/20 backdrop-blur-md text-gray-700 font-medium uppercase text-xs border-b border-white/30">
                    <tr>
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/15">
                    {bonusTransactions.map((tx) => (
                      <tr
                        key={tx._id || tx.reference}
                        className="hover:bg-white/10 cursor-pointer transition-colors"
                        onClick={() => setSelectedTx(tx)}
                      >
                        <td className="py-3 px-4 font-mono text-sm text-gray-800">{tx.reference}</td>
                        <td className="py-3 px-4 text-gray-800">{formatTypeLabel(tx.type)}</td>
                        <td className="py-3 px-4 text-right text-emerald-700 font-semibold">
                          {formatCurrency((tx.amountNaira ?? tx.amount / 100) || 0)}
                        </td>
                        <td className="py-3 px-4 text-gray-800">
                          {tx.user_type === 'staff' ? getStaffNameById(tx.user_id) : 'Organization'}
                        </td>
                        <td className="py-3 px-4 text-gray-700 capitalize">{tx.status || 'completed'}</td>
                        <td className="py-3 px-4 text-gray-600 text-sm">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between mt-4 text-sm text-gray-700">
              <div>
                Page {txPage} of {totalTxPages} • {txTotal} transactions
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTxPage(Math.max(1, txPage - 1))}
                  disabled={txPage === 1}
                  className="flex items-center gap-1 px-3 py-1 border border-white/50 bg-white/25 backdrop-blur-md rounded-xl text-gray-700 hover:bg-white/35 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <button
                  onClick={() => setTxPage(Math.min(totalTxPages, txPage + 1))}
                  disabled={txPage >= totalTxPages}
                  className="flex items-center gap-1 px-3 py-1 border border-white/50 bg-white/25 backdrop-blur-md rounded-xl text-gray-700 hover:bg-white/35 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTx && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] p-6 w-full max-w-lg mx-4 shadow-2xl border border-white/60 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none rounded-[2rem]" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
              </div>
              <button onClick={() => setSelectedTx(null)} className="text-gray-500 hover:text-gray-700 p-1 hover:bg-white/50 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-sm text-gray-800 relative z-10">
              <div className="flex justify-between">
                <span className="text-gray-600">Reference</span>
                <span className="font-mono">{selectedTx.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type</span>
                <span className="font-medium">{formatTypeLabel(selectedTx.type)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount</span>
                <span className="font-semibold text-emerald-700">
                  {formatCurrency((selectedTx.amountNaira ?? selectedTx.amount / 100) || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">User</span>
                <span>{selectedTx.user_type === 'staff' ? getStaffNameById(selectedTx.user_id) : 'Organization'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="capitalize">{selectedTx.status || 'completed'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date</span>
                <span>{selectedTx.createdAt ? new Date(selectedTx.createdAt).toLocaleString() : '—'}</span>
              </div>
              {selectedTx.description && (
                <div className="mt-3">
                  <div className="text-gray-600 mb-1">Description</div>
                  <div className="text-gray-800">{selectedTx.description}</div>
                </div>
              )}
            </div>
            <div className="mt-6 text-right relative z-10">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fund Wallet Modal */}
      {showFundWalletModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] p-6 w-full max-w-md mx-4 shadow-2xl border border-white/60 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none rounded-[2rem]" />
            <h3 className="text-lg font-semibold mb-4 flex items-center relative z-10">
              <Wallet className="w-5 h-5 mr-2 text-emerald-600" />
              Fund Bonus Wallet
            </h3>
            <form onSubmit={handleFundWallet} className="relative z-10">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (₦)
                  </label>
                  <input
                    type="number"
                    value={fundAmount || ""}
                    onChange={(e) => setFundAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-white/50 bg-white/40 backdrop-blur-md rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white/50 transition-all text-gray-800"
                    placeholder="Enter amount"
                    min="1000"
                    step="100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason (Optional)
                  </label>
                  <input
                    type="text"
                    value={fundReason}
                    onChange={(e) => setFundReason(e.target.value)}
                    className="w-full px-3 py-2 border border-white/50 bg-white/40 backdrop-blur-md rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white/50 transition-all text-gray-800"
                    placeholder="e.g., Quarterly bonus fund allocation"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowFundWalletModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl hover:bg-white/50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={funding}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center"
                >
                  {funding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Fund Wallet"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Bonus Modal */}
      {showAssignBonusModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl border border-white/60 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none rounded-[2rem]" />
            
            <div className="flex items-center justify-between p-6 border-b border-white/40 bg-gradient-to-r from-emerald-600/15 to-green-400/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1/2 h-full bg-white/20 blur-xl rounded-full pointer-events-none" />
              <h3 className="text-lg font-semibold flex items-center relative z-10">
                <Gift className="w-5 h-5 mr-2 text-emerald-600" />
                Assign Bonuses to Staff
              </h3>
              <button
                onClick={() => {
                  setShowAssignBonusModal(false);
                  setStaffSearch("");
                  setStaffPage(1);
                }}
                className="text-gray-500 hover:text-gray-700 p-1 hover:bg-white/50 rounded-lg transition-all relative z-10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignBonuses} className="flex flex-col flex-1 overflow-hidden relative z-10">
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/50 rounded-[1.5rem] p-4">
                  <div className="flex items-center mb-2">
                    <Wallet className="w-4 h-4 mr-2 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700">Available Balance</span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-800">
                    {formatCurrency(bonusWallet?.balance || 0)}
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search staff by name or employee ID..."
                    value={staffSearch}
                    onChange={(e) => {
                      setStaffSearch(e.target.value);
                      setStaffPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-white/50 bg-white/40 backdrop-blur-md rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white/50 transition-all text-gray-800"
                  />
                </div>
                
                {staffLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                  </div>
                ) : staff.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No staff members found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {staff.map((member) => (
                    <div
                      key={member.id}
                      className={`p-4 border rounded-xl transition-all backdrop-blur-md ${
                        selectedStaff.has(member.id)
                          ? "bg-emerald-50/80 border-emerald-300"
                          : "bg-white/40 border-white/50 hover:bg-white/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedStaff.has(member.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedStaff);
                            if (e.target.checked) {
                              newSelected.add(member.id);
                            } else {
                              newSelected.delete(member.id);
                              const newAmounts = { ...bonusAmounts };
                              const newReasons = { ...bonusReasons };
                              delete newAmounts[member.id];
                              delete newReasons[member.id];
                              setBonusAmounts(newAmounts);
                              setBonusReasons(newReasons);
                            }
                            setSelectedStaff(newSelected);
                          }}
                          className="mt-1 h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-medium text-gray-900">
                                {member.firstName} {member.lastName}
                              </div>
                              <div className="text-sm text-gray-600">
                                {member.role} • {member.department}
                              </div>
                              <div className="text-sm text-green-600 font-medium">
                                Current Bonus: {formatCurrency(getStaffBonusBalance(member.id))}
                              </div>
                            </div>
                          </div>
                          {selectedStaff.has(member.id) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Bonus Amount (₦)
                                </label>
                                <input
                                  type="number"
                                  value={bonusAmounts[member.id] || ""}
                                  onChange={(e) =>
                                    setBonusAmounts({
                                      ...bonusAmounts,
                                      [member.id]: Number(e.target.value),
                                    })
                                  }
                                  className="w-full px-3 py-1 border border-white/50 bg-white/40 backdrop-blur-md rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-gray-800"
                                  placeholder="Enter amount"
                                  min="100"
                                  step="100"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Reason (Optional)
                                </label>
                                <input
                                  type="text"
                                  value={bonusReasons[member.id] || ""}
                                  onChange={(e) =>
                                    setBonusReasons({
                                      ...bonusReasons,
                                      [member.id]: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-1 border border-white/50 bg-white/40 backdrop-blur-md rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-gray-800"
                                  placeholder="e.g., Performance bonus"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                )}

                {staffTotal > staffLimit && (
                  <div className="flex items-center justify-between pt-4 border-t border-white/30">
                    <div className="text-sm text-gray-700">
                      Showing {((staffPage - 1) * staffLimit) + 1} - {Math.min(staffPage * staffLimit, staffTotal)} of {staffTotal} staff
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setStaffPage(p => Math.max(1, p - 1))}
                        disabled={staffPage === 1}
                        className="px-3 py-1 text-sm border border-white/50 bg-white/25 backdrop-blur-md rounded-xl hover:bg-white/35 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-700">
                        Page {staffPage} of {Math.ceil(staffTotal / staffLimit)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setStaffPage(p => p + 1)}
                        disabled={staffPage >= Math.ceil(staffTotal / staffLimit)}
                        className="px-3 py-1 text-sm border border-white/50 bg-white/25 backdrop-blur-md rounded-xl hover:bg-white/35 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-white/40 bg-white/10 backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">Selected: {selectedStaff.size} staff</span>
                    <span className="mx-2 text-gray-400">•</span>
                    <span className="font-semibold text-emerald-700">
                      Total: {formatCurrency(
                        Array.from(selectedStaff).reduce(
                          (sum, staffId) => sum + (bonusAmounts[String(staffId)] || 0),
                          0
                        ) as number
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignBonusModal(false);
                      setStaffSearch("");
                      setStaffPage(1);
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl hover:bg-white/50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assigning || selectedStaff.size === 0}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center"
                  >
                    {assigning ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Gift className="w-4 h-4 mr-2" />
                    )}
                    Assign Bonuses ({selectedStaff.size})
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Bonus Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] p-6 w-full max-w-md mx-4 shadow-2xl border border-white/60 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none rounded-[2rem]" />
            <h3 className="text-lg font-semibold mb-4 flex items-center relative z-10">
              <Send className="w-5 h-5 mr-2 text-emerald-600" />
              Transfer Bonus to Wallet
            </h3>
            <form onSubmit={handleTransferBonus} className="relative z-10">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Staff Member
                  </label>
                  <select
                    value={transferStaffId}
                    onChange={(e) => setTransferStaffId(e.target.value)}
                    className="w-full px-3 py-2 border border-white/50 bg-white/40 backdrop-blur-md rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white/50 transition-all text-gray-800"
                    required
                  >
                    <option value="">Select staff member</option>
                    {staffBonusBalances
                      .filter(balance => balance.bonusBalance > 0)
                      .map((balance) => (
                        <option key={balance.staffId} value={balance.staffId}>
                          {balance.firstName} {balance.lastName} - {formatCurrency(balance.bonusBalance)}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (₦) - Leave empty to transfer all
                  </label>
                  <input
                    type="number"
                    value={transferAmount || ""}
                    onChange={(e) => setTransferAmount(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-white/50 bg-white/40 backdrop-blur-md rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white/50 transition-all text-gray-800"
                    placeholder="Enter amount or leave empty for all"
                    min="100"
                    step="100"
                  />
                </div>
                {transferStaffId && (
                  <div className="bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/50 rounded-[1.5rem] p-3">
                    <div className="text-sm text-emerald-700">
                      <strong>Current Bonus Balance: </strong>
                      {formatCurrency(getStaffBonusBalance(transferStaffId))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl hover:bg-white/50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferring || !transferStaffId}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center"
                >
                  {transferring ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Transfer Bonus"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <SuccessModal
          message={successMessage}
          onClose={() => setShowSuccessModal(false)}
        />
      )}
    </div>
  );
};

export default BonusManagementView;