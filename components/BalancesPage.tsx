import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  LayoutDashboard,
  User,
  FileText,
  LogOut,
  ArrowLeft,
  Plus,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { staffApi, StaffProfile } from "../api/staff";
import { BalancesView } from "./BalancesView";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorMessage } from "./ErrorMessage";
import { clearStaffAuthToken } from "../utils/cookies";

interface BalancesPageProps {
  onLogout: () => void;
}

export const BalancesPage: React.FC<BalancesPageProps> = ({ onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBankDetailsModal, setShowBankDetailsModal] = useState(false);
  const [banks, setBanks] = useState<any[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [settingAccount, setSettingAccount] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankCode: "",
    accountNumber: "",
    bvn: "",
  });
  const [verifiedAccountName, setVerifiedAccountName] = useState<string>("");
  const [showBankSuccessModal, setShowBankSuccessModal] = useState(false);
  const [bankSuccessData, setBankSuccessData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await staffApi.getProfile();
      setProfile(data);
    } catch (err: any) {
      if (
        err.message?.includes("Invalid or expired token") ||
        err.message?.includes("401")
      ) {
        // Token is invalid, logout
        onLogout();
        return;
      }
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const loadBanks = async () => {
    try {
      setLoadingBanks(true);
      const bankList = await staffApi.getSupportedBanks();
      setBanks(bankList);
    } catch (err: any) {
      console.error("Failed to load banks:", err);
    } finally {
      setLoadingBanks(false);
    }
  };

  const handleVerifyAccount = async () => {
    if (!bankForm.accountNumber || !bankForm.bankCode) return;

    try {
      setVerifyingAccount(true);
      const result = await staffApi.verifyBankAccount({
        accountNumber: bankForm.accountNumber,
        bankCode: bankForm.bankCode,
      });
      setVerifiedAccountName(result.account_name || result.accountName || "");
    } catch (err: any) {
      setVerifiedAccountName("");
    } finally {
      setVerifyingAccount(false);
    }
  };

  const handleSetBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !verifiedAccountName) return;

    try {
      setSettingAccount(true);

      const selectedBank = banks.find(bank => bank.code === bankForm.bankCode);
      const accountData = {
        bankName: selectedBank?.name || "",
        bankCode: bankForm.bankCode,
        accountNumber: bankForm.accountNumber,
        accountName: verifiedAccountName,
        bvn: bankForm.bvn || undefined,
      };

      await staffApi.setWithdrawalAccount(accountData);

      setShowBankDetailsModal(false);

      // Show success modal with bank details
      const bankData = {
        accountName: verifiedAccountName,
        bankName: selectedBank?.name,
        accountNumber: bankForm.accountNumber,
        bankCode: bankForm.bankCode,
      };
      setBankSuccessData(bankData);
      setShowBankSuccessModal(true);

      // Reset form
      setBankForm({
        bankCode: "",
        accountNumber: "",
        bvn: "",
      });
      setVerifiedAccountName("");

      // Reload profile to get updated data
      loadProfile();
    } catch (err: any) {
      // Error handling would go here
    } finally {
      setSettingAccount(false);
    }
  };

  const handleOpenBankDetails = () => {
    setShowBankDetailsModal(true);
    loadBanks();
  };

  const handleLogout = () => {
    clearStaffAuthToken();
    onLogout();
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/staff/dashboard",
    },
    { id: "profile", label: "My Profile", icon: User, path: "/staff/profile" },
    {
      id: "balances",
      label: "Balances",
      icon: LayoutDashboard,
      path: "/staff/balances",
    },
    {
      id: "documents",
      label: "Documents",
      icon: FileText,
      path: "/staff/documents",
    },
  ];

  if (loading && !profile) {
    return <LoadingSpinner message="Loading balances..." />;
  }

  if (error && !profile) {
    return (
      <ErrorMessage
        title="Error Loading Balances"
        message={error}
        onRetry={loadProfile}
      />
    );
  }

  if (!profile || !profile.firstName || !profile.lastName) {
    return <LoadingSpinner message="Loading balances..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm mr-3">
              CSMS
            </div>
            <span className="text-lg font-semibold text-gray-800">
              Staff Portal
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                item.id === "balances"
                  ? "bg-blue-100 text-blue-700 border-r-2 border-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <button
              onClick={() => navigate("/staff/dashboard")}
              className="flex items-center text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
            <div className="h-6 w-px bg-gray-300 mx-2" />
            <div>
              <h1 className="text-lg font-semibold text-gray-800">
                Account Balances
              </h1>
              <p className="text-xs text-gray-500">
                Welcome, {profile.firstName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-300">
              {profile.firstName[0]}
              {profile.lastName[0]}
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          <BalancesView
            balances={profile?.balances || null}
            loading={false}
            error={null}
            onRefresh={loadProfile}
            onAddBankDetails={handleOpenBankDetails}
          />
        </div>
      </main>

      {/* Bank Details Modal */}
      {showBankDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Add Bank Details
                </h3>
                <button
                  onClick={() => {
                    setShowBankDetailsModal(false);
                    setBankForm({ bankCode: "", accountNumber: "", bvn: "" });
                    setVerifiedAccountName("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSetBankAccount} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank *
                  </label>
                  <select
                    value={bankForm.bankCode}
                    onChange={(e) =>
                      setBankForm({
                        ...bankForm,
                        bankCode: e.target.value,
                        accountNumber: "", // Reset account number when bank changes
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                    disabled={loadingBanks}
                  >
                    <option value="">
                      {loadingBanks ? "Loading banks..." : "Select bank..."}
                    </option>
                    {banks.map((bank) => (
                      <option key={bank.code} value={bank.code}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Number *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={bankForm.accountNumber}
                      onChange={(e) =>
                        setBankForm({
                          ...bankForm,
                          accountNumber: e.target.value.replace(/\D/g, "").slice(0, 10),
                        })
                      }
                      placeholder="1234567890"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                      maxLength={10}
                      disabled={!bankForm.bankCode}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyAccount}
                      disabled={
                        !bankForm.accountNumber ||
                        bankForm.accountNumber.length !== 10 ||
                        !bankForm.bankCode ||
                        verifyingAccount
                      }
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {verifyingAccount ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Verify"
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {verifiedAccountName && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-800">
                      Account Name: {verifiedAccountName}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  BVN (Optional)
                </label>
                <input
                  type="text"
                  value={bankForm.bvn}
                  onChange={(e) =>
                    setBankForm({
                      ...bankForm,
                      bvn: e.target.value.replace(/\D/g, "").slice(0, 11),
                    })
                  }
                  placeholder="12345678901"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  maxLength={11}
                />
                <p className="text-xs text-gray-500 mt-1">
                  BVN is required for some transactions and improves security
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowBankDetailsModal(false);
                    setBankForm({ bankCode: "", accountNumber: "", bvn: "" });
                    setVerifiedAccountName("");
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!verifiedAccountName || settingAccount}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {settingAccount ? "Setting Account..." : "Add Bank Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bank Success Modal */}
      {showBankSuccessModal && bankSuccessData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-green-800 flex items-center">
                  <CheckCircle2 className="w-6 h-6 mr-2" />
                  Bank Account Added Successfully!
                </h3>
                <button
                  onClick={() => {
                    setShowBankSuccessModal(false);
                    setBankSuccessData(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Account Name:
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {bankSuccessData.accountName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Bank:
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {bankSuccessData.bankName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Account Number:
                    </span>
                    <span className="text-sm font-mono text-gray-900">
                      {bankSuccessData.accountNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Status:
                    </span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 text-center">
                Your bank account has been successfully linked for withdrawals.
              </p>

              <div className="flex justify-center pt-2">
                <button
                  onClick={() => {
                    setShowBankSuccessModal(false);
                    setBankSuccessData(null);
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};