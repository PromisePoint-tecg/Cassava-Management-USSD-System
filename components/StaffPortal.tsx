import React, { useState, useEffect } from "react";
import {
  User,
  Wallet,
  PiggyBank,
  Building2,
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Menu,
  X,
  LayoutDashboard,
  CreditCard,
  LogOut,
  Bell,
  Settings,
} from "lucide-react";
import { staffApi, StaffProfile, StaffBalances } from "../api/staff";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorMessage } from "./ErrorMessage";
import { logout } from "../api/auth";

type StaffViewType = "dashboard" | "profile" | "balances" | "documents";

interface StaffPortalProps {
  onLogout: () => void;
}

export const StaffPortal: React.FC<StaffPortalProps> = ({ onLogout }) => {
  const [currentView, setCurrentView] = useState<StaffViewType>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingNIN, setUploadingNIN] = useState(false);
  const [uploadingBVN, setUploadingBVN] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

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
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleNINUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setUploadError("Please upload an image or PDF file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be less than 5MB");
      return;
    }

    try {
      setUploadingNIN(true);
      setUploadError(null);
      setUploadSuccess(null);

      await staffApi.uploadNIN(file);

      setUploadSuccess("NIN document uploaded successfully!");
      await loadProfile();

      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload NIN document");
    } finally {
      setUploadingNIN(false);
      e.target.value = "";
    }
  };

  const handleBVNUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setUploadError("Please upload an image or PDF file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be less than 5MB");
      return;
    }

    try {
      setUploadingBVN(true);
      setUploadError(null);
      setUploadSuccess(null);

      await staffApi.uploadBVN(file);

      setUploadSuccess("BVN document uploaded successfully!");
      await loadProfile();

      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload BVN document");
    } finally {
      setUploadingBVN(false);
      e.target.value = "";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const menuItems = [
    {
      id: "dashboard" as StaffViewType,
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    { id: "profile" as StaffViewType, label: "My Profile", icon: User },
    { id: "balances" as StaffViewType, label: "Balances", icon: Wallet },
    { id: "documents" as StaffViewType, label: "Documents", icon: FileText },
  ];

  if (loading && !profile) {
    return <LoadingSpinner message="Loading staff portal..." />;
  }

  if (error && !profile) {
    return (
      <ErrorMessage
        title="Error Loading Portal"
        message={error}
        onRetry={loadProfile}
      />
    );
  }

  if (!profile || !profile.firstName || !profile.lastName) {
    return <LoadingSpinner message="Loading staff portal..." />;
  }

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Welcome back, {profile.firstName}!
              </h2>
              <p className="text-gray-600">
                Here's an overview of your account
              </p>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-200 rounded-full">
                    <PiggyBank className="w-6 h-6 text-green-700" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  Savings
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                  {formatCurrency(profile.balances?.savings || 0)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-200 rounded-full">
                    <Building2 className="w-6 h-6 text-blue-700" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  Pension
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                  {formatCurrency(profile.balances?.pension || 0)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-200 rounded-full">
                    <Wallet className="w-6 h-6 text-purple-700" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  Wallet
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                  {formatCurrency(profile.balances?.wallet || 0)}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Account Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        profile.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
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

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Document Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">NIN Document</span>
                    {profile.ninDocumentUrl ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">BVN Document</span>
                    {profile.bvnDocumentUrl ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  {(!profile.ninDocumentUrl || !profile.bvnDocumentUrl) && (
                    <p className="text-xs text-amber-600 mt-2">
                      Please upload missing documents in the Documents section
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case "profile":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
                <p className="text-gray-600 mt-1">
                  View and manage your personal information
                </p>
              </div>
              <button
                onClick={loadProfile}
                className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Full Name</p>
                  <p className="text-sm font-medium text-gray-900">
                    {profile.firstName} {profile.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="text-sm font-medium text-gray-900">
                    {profile.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                  <p className="text-sm font-medium text-gray-900">
                    {profile.phone}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Role</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {profile.role}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      profile.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {profile.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                {profile.nin && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">NIN</p>
                    <p className="text-sm font-medium text-gray-900">
                      {profile.nin}
                    </p>
                  </div>
                )}
                {profile.bvn && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">BVN</p>
                    <p className="text-sm font-medium text-gray-900">
                      {profile.bvn}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "balances":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Account Balances
              </h2>
              <p className="text-gray-600 mt-1">
                View your savings, pension, and wallet balances
              </p>
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
                  {formatCurrency(profile.balances?.savings || 0)}
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
                  {formatCurrency(profile.balances?.pension || 0)}
                </p>
                <p className="text-xs text-gray-500">Retirement savings</p>
              </div>

              <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
                <div className="inline-flex p-4 bg-purple-100 rounded-full mb-4">
                  <Wallet className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Wallet
                </h3>
                <p className="text-3xl font-bold text-gray-800 mb-2">
                  {formatCurrency(profile.balances?.wallet || 0)}
                </p>
                <p className="text-xs text-gray-500">Digital wallet</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Balances are updated in real-time. For
                transaction history or detailed statements, please contact
                support.
              </p>
            </div>
          </div>
        );

      case "documents":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Identity Documents
              </h2>
              <p className="text-gray-600 mt-1">
                Upload and manage your NIN and BVN documents
              </p>
            </div>

            {uploadSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
                  <p className="text-sm text-green-800">{uploadSuccess}</p>
                </div>
              </div>
            )}

            {uploadError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <XCircle className="w-5 h-5 text-red-600 mr-2" />
                  <p className="text-sm text-red-800">{uploadError}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* NIN Upload */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      National Identification Number (NIN)
                    </h3>
                    {profile.nin && (
                      <p className="text-sm text-gray-500 mt-1">
                        NIN: {profile.nin}
                      </p>
                    )}
                  </div>
                  {profile.ninDocumentUrl && (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  )}
                </div>
                <div className="space-y-3">
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleNINUpload}
                      disabled={uploadingNIN}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors">
                      {uploadingNIN ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin text-blue-600" />
                          <span className="text-sm text-gray-700">
                            Uploading...
                          </span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 mr-2 text-gray-600" />
                          <span className="text-sm text-gray-700">
                            {profile.ninDocumentUrl
                              ? "Update NIN Document"
                              : "Upload NIN Document"}
                          </span>
                        </>
                      )}
                    </div>
                  </label>
                  {profile.ninDocumentUrl && (
                    <a
                      href={profile.ninDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center px-4 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50"
                    >
                      View Document
                    </a>
                  )}
                  <p className="text-xs text-gray-500">
                    Accepted formats: JPG, PNG, PDF (Max 5MB)
                  </p>
                </div>
              </div>

              {/* BVN Upload */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Bank Verification Number (BVN)
                    </h3>
                    {profile.bvn && (
                      <p className="text-sm text-gray-500 mt-1">
                        BVN: {profile.bvn}
                      </p>
                    )}
                  </div>
                  {profile.bvnDocumentUrl && (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  )}
                </div>
                <div className="space-y-3">
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleBVNUpload}
                      disabled={uploadingBVN}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors">
                      {uploadingBVN ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin text-blue-600" />
                          <span className="text-sm text-gray-700">
                            Uploading...
                          </span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 mr-2 text-gray-600" />
                          <span className="text-sm text-gray-700">
                            {profile.bvnDocumentUrl
                              ? "Update BVN Document"
                              : "Upload BVN Document"}
                          </span>
                        </>
                      )}
                    </div>
                  </label>
                  {profile.bvnDocumentUrl && (
                    <a
                      href={profile.bvnDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center px-4 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50"
                    >
                      View Document
                    </a>
                  )}
                  <p className="text-xs text-gray-500">
                    Accepted formats: JPG, PNG, PDF (Max 5MB)
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Staff Sidebar */}
      <div
        className={`
        w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col z-50
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-lg font-bold text-gray-800">
              Staff Portal
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6">
          <div className="px-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mr-3 ${
                      isActive ? "text-blue-600" : "text-gray-400"
                    }`}
                  />
                  {item.label}
                </button>
              );
            })}
          </div>
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
            <div>
              <h1 className="text-lg font-semibold text-gray-800">
                Staff Portal
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

        <div className="p-4 sm:p-6 lg:p-8">{renderContent()}</div>
      </main>
    </div>
  );
};
