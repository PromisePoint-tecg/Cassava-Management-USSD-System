import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  User,
  Wallet,
  PiggyBank,
  Building2,
  FileText,
  Plus,
  CheckCircle2,
  XCircle,
  X,
} from "lucide-react";
import {
  staffApi,
  StaffProfile,
  LoanType,
  StaffLoanRequest,
} from "../services/staff";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorMessage } from "./ErrorMessage";
import { StaffLayout } from "./StaffLayout";
import LeafInlineLoader from "./Loader";

interface StaffPortalProps {
  onLogout: () => void;
}

export const StaffPortal: React.FC<StaffPortalProps> = ({ onLogout }) => {
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const [showLoanRequestModal, setShowLoanRequestModal] = useState(false);
  const [loanTypes, setLoanTypes] = useState<LoanType[]>([]);
  const [loadingLoanTypes, setLoadingLoanTypes] = useState(false);
  const [submittingLoanRequest, setSubmittingLoanRequest] = useState(false);
  const [showLoanSuccessModal, setShowLoanSuccessModal] = useState(false);
  const [loanSuccessData, setLoanSuccessData] = useState<any>(null);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const [loanRequestForm, setLoanRequestForm] = useState<StaffLoanRequest>({
    loanTypeId: "",
    principalAmount: 0,
    interestRate: 0,
    purpose: "",
    durationMonths: 6,
    pickupLocation: "",
    pickupDate: "",
  } as StaffLoanRequest);

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
        err?.message?.includes("Invalid or expired token") ||
        err?.message?.includes("401")
      ) {
        onLogout();
        return;
      }
      setError(err?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const loadLoanTypes = async () => {
    try {
      setLoadingLoanTypes(true);
      const data = await staffApi.getLoanTypes();
      setLoanTypes(
        (data || []).filter((type: LoanType) => (type as any).is_active)
      );
    } catch (err: any) {
      if (
        err?.message?.includes("Invalid or expired token") ||
        err?.message?.includes("401")
      ) {
        onLogout();
        return;
      }
      console.error("Failed to load loan types:", err);
    } finally {
      setLoadingLoanTypes(false);
    }
  };

  const handleLoanRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !profile?.id ||
      !loanRequestForm.loanTypeId ||
      !loanRequestForm.principalAmount
    ) {
      setError("Please fill required fields.");
      return;
    }

    try {
      setSubmittingLoanRequest(true);
      setError(null);

      const requestData = {
        ...loanRequestForm,
        principalAmount: Math.round(loanRequestForm.principalAmount * 100),
      } as any;

      const response = await staffApi.requestLoan(profile.id, requestData);

      setShowLoanRequestModal(false);

      const loanData = response?.data ?? response;
      setLoanSuccessData(loanData);
      setShowLoanSuccessModal(true);

      setLoanRequestForm({
        loanTypeId: "",
        principalAmount: 0,
        interestRate: 0,
        purpose: "",
        durationMonths: 6,
        pickupLocation: "",
        pickupDate: "",
      } as StaffLoanRequest);
    } catch (err: any) {
      if (
        err?.message?.includes("Invalid or expired token") ||
        err?.message?.includes("401")
      ) {
        onLogout();
        return;
      }
      console.error("Loan request failed:", err);
      setError(err?.message || "Failed to submit loan request");
    } finally {
      setSubmittingLoanRequest(false);
    }
  };

  const handleOpenLoanRequest = () => {
    setShowLoanRequestModal(true);
    loadLoanTypes();
  };

  return (
    <StaffLayout
      title="Staff Portal"
      subtitle={profile ? `Welcome, ${profile?.firstName}` : ""}
      profile={profile}
      onLogout={onLogout}
      currentPath={location.pathname}
      showBackButton={false}
    >
      {loading && !profile ? (
        <LeafInlineLoader />
      ) : error && !profile ? (
        <ErrorMessage
          title="Error Loading Portal"
          message={error}
          onRetry={loadProfile}
        />
      ) : (
        <div className="space-y-5">
          {/* Header - Liquid Glass */}
          <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-400/5 rounded-[2rem] pointer-events-none" />
            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Welcome back, {profile.firstName}!
                </h2>
                <p className="text-gray-600">
                  Here's an overview of your account
                </p>
              </div>
              <button
                onClick={handleOpenLoanRequest}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Request Loan
              </button>
            </div>
          </div>

          {/* Balance Cards - Liquid Glass */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/15 backdrop-blur-lg rounded-[1.5rem] border border-white/50 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_2px_rgba(255,255,255,0.4)_inset] p-6 relative overflow-hidden hover:bg-white/20 transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[1.5rem] pointer-events-none" />
              <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-green-400/20 to-transparent blur-2xl rounded-full pointer-events-none" />
              
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="p-3 bg-green-500/20 backdrop-blur-sm rounded-full border border-green-200/30">
                  <PiggyBank className="w-6 h-6 text-green-700" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1 relative z-10">
                Savings
              </h3>
              <p className="text-2xl font-bold text-gray-800 relative z-10">
                {formatCurrency(profile.balances?.savings || 0)}
              </p>
            </div>

            <div className="bg-white/15 backdrop-blur-lg rounded-[1.5rem] border border-white/50 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_2px_rgba(255,255,255,0.4)_inset] p-6 relative overflow-hidden hover:bg-white/20 transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[1.5rem] pointer-events-none" />
              <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-blue-400/20 to-transparent blur-2xl rounded-full pointer-events-none" />
              
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="p-3 bg-blue-500/20 backdrop-blur-sm rounded-full border border-blue-200/30">
                  <Building2 className="w-6 h-6 text-blue-700" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1 relative z-10">
                Pension
              </h3>
              <p className="text-2xl font-bold text-gray-800 relative z-10">
                {formatCurrency(profile.balances?.pension || 0)}
              </p>
            </div>

            <div className="bg-white/15 backdrop-blur-lg rounded-[1.5rem] border border-white/50 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_2px_rgba(255,255,255,0.4)_inset] p-6 relative overflow-hidden hover:bg-white/20 transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[1.5rem] pointer-events-none" />
              <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-purple-400/20 to-transparent blur-2xl rounded-full pointer-events-none" />
              
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="p-3 bg-purple-500/20 backdrop-blur-sm rounded-full border border-purple-200/30">
                  <Wallet className="w-6 h-6 text-purple-700" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1 relative z-10">Wallet</h3>
              <p className="text-2xl font-bold text-gray-800 relative z-10">
                {formatCurrency(profile.balances?.wallet || 0)}
              </p>
            </div>
          </div>

          {/* Quick Stats - Liquid Glass */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
              <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
              
              <h3 className="text-lg font-semibold text-gray-800 mb-4 relative z-10">
                Account Status
              </h3>
              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full backdrop-blur-sm ${
                      profile.isActive
                        ? "bg-green-100/80 text-green-800 border border-green-200/50"
                        : "bg-gray-100/80 text-gray-800 border border-gray-200/50"
                    }`}
                  >
                    {profile.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Role</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {profile.role}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Member Since</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(profile.createdAt).toLocaleDateString("en-NG", {
                      year: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
              <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
              
              <h3 className="text-lg font-semibold text-gray-800 mb-4 relative z-10">
                Document Status
              </h3>
              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">NIN Document</span>
                  {profile.hasNin ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">BVN Document</span>
                  {profile.hasBvn ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                {(!profile.hasNin || !profile.hasBvn) && (
                  <p className="text-xs text-amber-600 mt-2">
                    Please upload missing documents in the Documents section
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loan Request Modal */}
      {showLoanRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                Request Loan
              </h3>
              <button
                onClick={() => setShowLoanRequestModal(false)}
                className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleLoanRequestSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loan Type *
                  </label>
                  <select
                    value={loanRequestForm.loanTypeId}
                    onChange={(e) => {
                      const selectedType = loanTypes.find(
                        (type) => type.id === e.target.value
                      );
                      setLoanRequestForm({
                        ...loanRequestForm,
                        loanTypeId: e.target.value,
                        interestRate: selectedType?.interest_rate || 0,
                        durationMonths: selectedType?.duration_months || 6,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-800"
                    required
                    disabled={loadingLoanTypes}
                  >
                    <option value="">
                      {loadingLoanTypes
                        ? "Loading loan types..."
                        : "Select loan type..."}
                    </option>
                    {loanTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} - {type.interest_rate}% (
                        {type.duration_months} months)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Principal Amount (₦) *
                  </label>
                  <input
                    type="number"
                    value={loanRequestForm.principalAmount}
                    onChange={(e) =>
                      setLoanRequestForm({
                        ...loanRequestForm,
                        principalAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="e.g., 100000"
                    className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-800"
                    required
                    min={1000}
                    step={1000}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    value={loanRequestForm.interestRate}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-lg text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (Months)
                  </label>
                  <input
                    type="number"
                    value={loanRequestForm.durationMonths}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-lg text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose *
                </label>
                <textarea
                  value={loanRequestForm.purpose}
                  onChange={(e) =>
                    setLoanRequestForm({
                      ...loanRequestForm,
                      purpose: e.target.value,
                    })
                  }
                  placeholder="Describe the purpose of this loan..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-800"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pickup Location
                  </label>
                  <input
                    type="text"
                    value={loanRequestForm.pickupLocation}
                    onChange={(e) =>
                      setLoanRequestForm({
                        ...loanRequestForm,
                        pickupLocation: e.target.value,
                      })
                    }
                    placeholder="e.g., Main Office"
                    className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pickup Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={loanRequestForm.pickupDate}
                    onChange={(e) =>
                      setLoanRequestForm({
                        ...loanRequestForm,
                        pickupDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-800"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLoanRequestModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLoanRequest}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {submittingLoanRequest ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loan Success Modal */}
      {showLoanSuccessModal && loanSuccessData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-green-50">
              <h3 className="text-lg font-semibold text-green-800 flex items-center">
                <CheckCircle2 className="w-6 h-6 mr-2" />
                Loan Request Successful!
              </h3>
              <button
                onClick={() => {
                  setShowLoanSuccessModal(false);
                  setLoanSuccessData(null);
                }}
                className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4 relative z-10">
              <div className="bg-green-50/80 backdrop-blur-sm border border-green-200/50 rounded-[1.5rem] p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Reference:
                    </span>
                    <span className="text-sm font-mono text-gray-900">
                      {loanSuccessData.reference}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Principal Amount:
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(
                        (loanSuccessData.principalAmount ?? 0) / 100
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Interest Amount:
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(
                        (loanSuccessData.interestAmount ?? 0) / 100
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Total Repayment:
                    </span>
                    <span className="text-sm font-semibold text-green-700">
                      {formatCurrency(
                        (loanSuccessData.totalRepayment ?? 0) / 100
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Monthly Payment:
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(
                        (loanSuccessData.monthlyPayment ?? 0) / 100
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Due Date:
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {loanSuccessData.dueDate
                        ? new Date(loanSuccessData.dueDate).toLocaleDateString(
                            "en-NG"
                          )
                        : "-"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Status:
                    </span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100/80 text-yellow-800 capitalize backdrop-blur-sm border border-yellow-200/50">
                      {loanSuccessData.status}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 text-center">
                You will be notified once your loan is approved and ready for
                pickup.
              </p>

              <div className="flex justify-center pt-2">
                <button
                  onClick={() => {
                    setShowLoanSuccessModal(false);
                    setLoanSuccessData(null);
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </StaffLayout>
  );
};