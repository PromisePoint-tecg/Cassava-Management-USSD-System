import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Plus, CheckCircle2, Loader2, X } from "lucide-react";
import { staffApi, StaffProfile } from "../services/staff";
import { BalancesView } from "./BalancesView";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorMessage } from "./ErrorMessage";
import { StaffLayout } from "./StaffLayout";
import LeafInlineLoader from "./Loader";

interface BalancesPageProps {
  onLogout: () => void;
}

export const BalancesPage: React.FC<BalancesPageProps> = ({ onLogout }) => {
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
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [savedAccount, setSavedAccount] = useState<any>(null);
  const [loadingSavedAccount, setLoadingSavedAccount] = useState(false);
  const [requestingWithdrawal, setRequestingWithdrawal] = useState(false);
  const [withdrawalRequestKey, setWithdrawalRequestKey] = useState("");
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: "",
    pin: "",
    useSavedAccount: true,
    bankName: "",
    bankCode: "",
    accountNumber: "",
    accountName: "",
  });

  const location = useLocation();

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      const selectedBank = banks.find(
        (bank) => bank.code === bankForm.bankCode
      );
      const accountData = {
        bankName: selectedBank?.name || "",
        bankCode: bankForm.bankCode,
        accountNumber: bankForm.accountNumber,
        accountName: verifiedAccountName,
        bvn: bankForm.bvn || undefined,
      } as any;

      await staffApi.setWithdrawalAccount(accountData);

      setShowBankDetailsModal(false);

      const bankData = {
        accountName: verifiedAccountName,
        bankName: selectedBank?.name,
        accountNumber: bankForm.accountNumber,
        bankCode: bankForm.bankCode,
      };
      setBankSuccessData(bankData);
      setShowBankSuccessModal(true);

      setBankForm({ bankCode: "", accountNumber: "", bvn: "" });
      setVerifiedAccountName("");

      // Reload profile to get updated data
      loadProfile();
    } catch (err: any) {
      console.error("Failed to set bank account:", err);
    } finally {
      setSettingAccount(false);
    }
  };

  const handleOpenBankDetails = () => {
    setShowBankDetailsModal(true);
    loadBanks();
  };

  const loadSavedAccount = async () => {
    try {
      setLoadingSavedAccount(true);
      const account = await staffApi.getWithdrawalAccount();
      setSavedAccount(account);
      if (account) {
        setWithdrawalForm((prev) => ({
          ...prev,
          bankName: account.bankName || "",
          bankCode: account.bankCode || "",
          accountNumber: account.accountNumber || "",
          accountName: account.accountName || "",
        }));
      }
    } catch (err: any) {
      setSavedAccount(null);
    } finally {
      setLoadingSavedAccount(false);
    }
  };

  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    const amount = parseFloat(withdrawalForm.amount);
    if (!amount || amount <= 0) return;

    try {
      setRequestingWithdrawal(true);

      const withdrawalData: any = {
        amount: Math.round(amount), // Convert to kobo or minor unit if needed by API
        pin: withdrawalForm.pin,
        idempotencyKey: withdrawalRequestKey || undefined,
      };

      if (!withdrawalForm.useSavedAccount || !savedAccount) {
        withdrawalData.bankName = withdrawalForm.bankName;
        withdrawalData.bankCode = withdrawalForm.bankCode;
        withdrawalData.accountNumber = withdrawalForm.accountNumber;
        withdrawalData.accountName = withdrawalForm.accountName;
      }

      const response = await staffApi.requestWithdrawal(withdrawalData);

      setShowWithdrawalModal(false);
      const reference = response?.payout?.transactionReference;
      alert(
        `${response?.message || "Withdrawal request queued successfully."}${
          reference ? `\nReference: ${reference}` : ""
        }`
      );

      setWithdrawalForm({
        amount: "",
        pin: "",
        useSavedAccount: true,
        bankName: "",
        bankCode: "",
        accountNumber: "",
        accountName: "",
      });
      setWithdrawalRequestKey("");
    } catch (err: any) {
      alert(err.message || "Failed to request withdrawal");
    } finally {
      setRequestingWithdrawal(false);
    }
  };

  const handleOpenWithdrawal = () => {
    const idempotencySeed = `wdr_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 10)}`;
    setWithdrawalRequestKey(idempotencySeed);
    setShowWithdrawalModal(true);
    loadSavedAccount();
  };

  return (
    <StaffLayout
      title="Account Balances"
      subtitle={profile ? `Welcome, ${profile?.firstName}` : "Loading..."}
      profile={profile}
      onLogout={onLogout}
      currentPath={location.pathname}
    >
      {loading ? (
        <LeafInlineLoader />
      ) : error ? (
        <ErrorMessage
          title="Error Loading Balances"
          message={error}
          onRetry={loadProfile}
        />
      ) : (
        <>
          <BalancesView
            balances={profile?.balances || null}
            loading={false}
            error={null}
            onRefresh={loadProfile}
            onAddBankDetails={handleOpenBankDetails}
            onRequestWithdrawal={handleOpenWithdrawal}
          />

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
                        setBankForm({
                          bankCode: "",
                          accountNumber: "",
                          bvn: "",
                        });
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
                            accountNumber: "",
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
                              accountNumber: e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 10),
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
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      BVN is required for some transactions and improves
                      security
                    </p>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBankDetailsModal(false);
                        setBankForm({
                          bankCode: "",
                          accountNumber: "",
                          bvn: "",
                        });
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
                      {settingAccount
                        ? "Setting Account..."
                        : "Add Bank Account"}
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
                    Your bank account has been successfully linked for
                    withdrawals.
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

          {/* Withdrawal Modal */}
          {showWithdrawalModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Request Withdrawal
                    </h3>
                    <button
                      onClick={() => {
                        setShowWithdrawalModal(false);
                        setWithdrawalForm({
                          amount: "",
                          pin: "",
                          useSavedAccount: true,
                          bankName: "",
                          bankCode: "",
                          accountNumber: "",
                          accountName: "",
                        });
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <form
                  onSubmit={handleRequestWithdrawal}
                  className="p-6 space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount (₦) *
                      </label>
                      <input
                        type="number"
                        value={withdrawalForm.amount}
                        onChange={(e) =>
                          setWithdrawalForm({
                            ...withdrawalForm,
                            amount: e.target.value,
                          })
                        }
                        placeholder="10000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                        min="100"
                        step="100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        PIN *
                      </label>
                      <input
                        type="password"
                        value={withdrawalForm.pin}
                        onChange={(e) =>
                          setWithdrawalForm({
                            ...withdrawalForm,
                            pin: e.target.value.replace(/\D/g, "").slice(0, 4),
                          })
                        }
                        placeholder="1234"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                        maxLength={4}
                      />
                    </div>
                  </div>

                  {savedAccount && (
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="useSavedAccount"
                          checked={withdrawalForm.useSavedAccount}
                          onChange={(e) =>
                            setWithdrawalForm({
                              ...withdrawalForm,
                              useSavedAccount: e.target.checked,
                            })
                          }
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor="useSavedAccount"
                          className="ml-2 text-sm font-medium text-gray-700"
                        >
                          Use saved bank account
                        </label>
                      </div>

                      {withdrawalForm.useSavedAccount && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                          <div className="text-sm text-emerald-800">
                            <strong>Account:</strong> {savedAccount.accountName}
                            <br />
                            <strong>Bank:</strong> {savedAccount.bankName}
                            <br />
                            <strong>Number:</strong>{" "}
                            {savedAccount.accountNumber}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {(!savedAccount || !withdrawalForm.useSavedAccount) && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bank Name *
                          </label>
                          <input
                            type="text"
                            value={withdrawalForm.bankName}
                            onChange={(e) =>
                              setWithdrawalForm({
                                ...withdrawalForm,
                                bankName: e.target.value,
                              })
                            }
                            placeholder="United Bank For Africa"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Account Number *
                          </label>
                          <input
                            type="text"
                            value={withdrawalForm.accountNumber}
                            onChange={(e) =>
                              setWithdrawalForm({
                                ...withdrawalForm,
                                accountNumber: e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 10),
                              })
                            }
                            placeholder="1234567890"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            required
                            maxLength={10}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Account Name *
                        </label>
                        <input
                          type="text"
                          value={withdrawalForm.accountName}
                          onChange={(e) =>
                            setWithdrawalForm({
                              ...withdrawalForm,
                              accountName: e.target.value,
                            })
                          }
                          placeholder="JOHN DOE"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowWithdrawalModal(false);
                        setWithdrawalForm({
                          amount: "",
                          pin: "",
                          useSavedAccount: true,
                          bankName: "",
                          bankCode: "",
                          accountNumber: "",
                          accountName: "",
                        });
                      }}
                      className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={requestingWithdrawal}
                      className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {requestingWithdrawal
                        ? "Requesting..."
                        : "Request Withdrawal"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </StaffLayout>
  );
};
