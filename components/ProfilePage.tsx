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
  Upload,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { staffApi, StaffProfile } from "../api/staff";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorMessage } from "./ErrorMessage";
import { clearStaffAuthToken } from "../utils/cookies";

interface ProfilePageProps {
  onLogout: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingNIN, setUploadingNIN] = useState(false);
  const [uploadingBVN, setUploadingBVN] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<React.ReactNode | null>(
    null
  );
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

  const handleNINUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      if (
        err.message?.includes("Invalid or expired token") ||
        err.message?.includes("401")
      ) {
        // Token is invalid, logout
        onLogout();
        return;
      }
      setUploadError(err.message || "Failed to upload NIN document");
    } finally {
      setUploadingNIN(false);
      e.target.value = "";
    }
  };

  const handleBVNUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      if (
        err.message?.includes("Invalid or expired token") ||
        err.message?.includes("401")
      ) {
        // Token is invalid, logout
        onLogout();
        return;
      }
      setUploadError(err.message || "Failed to upload BVN document");
    } finally {
      setUploadingBVN(false);
      e.target.value = "";
    }
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
    {
      id: "profile",
      label: "My Profile",
      icon: User,
      path: "/staff/profile",
    },
    {
      id: "balances",
      label: "Balances",
      icon: FileText,
      path: "/staff/balances",
    },
  ];

  if (loading && !profile) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  if (error && !profile) {
    return (
      <ErrorMessage
        title="Error Loading Profile"
        message={error}
        onRetry={loadProfile}
      />
    );
  }

  if (!profile) {
    return (
      <ErrorMessage
        title="Profile Not Found"
        message="Unable to load your profile information."
        onRetry={loadProfile}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                item.id === "profile"
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
                My Profile
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

            {/* Documents Section */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Identity Documents
              </h3>
              <p className="text-gray-600 mb-6">
                Upload and manage your NIN and BVN documents
              </p>

              {uploadSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-green-800">{uploadSuccess}</div>
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <XCircle className="w-5 h-5 text-red-600 mr-2" />
                    <p className="text-sm text-red-800">{uploadError}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* NIN Upload */}
                <div className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        National Identification Number (NIN)
                      </h4>
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
                                ? "Replace NIN Document"
                                : "Upload NIN Document"}
                            </span>
                          </>
                        )}
                      </div>
                    </label>
                    <p className="text-xs text-gray-500">
                      Accepted formats: JPG, PNG, PDF. Max size: 5MB
                    </p>
                  </div>
                </div>

                {/* BVN Upload */}
                <div className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        Bank Verification Number (BVN)
                      </h4>
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
                                ? "Replace BVN Document"
                                : "Upload BVN Document"}
                            </span>
                          </>
                        )}
                      </div>
                    </label>
                    <p className="text-xs text-gray-500">
                      Accepted formats: JPG, PNG, PDF. Max size: 5MB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};