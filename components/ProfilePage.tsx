import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  User,
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { staffApi, StaffProfile } from "../api/staff";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorMessage } from "./ErrorMessage";
import { StaffLayout } from "./StaffLayout";

interface ProfilePageProps {
  onLogout: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onLogout }) => {
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingNIN, setUploadingNIN] = useState(false);
  const [uploadingBVN, setUploadingBVN] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<React.ReactNode | null>(
    null
  );
  const location = useLocation();

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

  return (
    <StaffLayout
      title="My Profile"
      subtitle={profile ? `Welcome, ${profile?.firstName}` : ""}
      profile={profile}
      onLogout={onLogout}
      currentPath={location.pathname}
    >
      {loading ? (
        <LoadingSpinner message="Loading profile..." />
      ) : error ? (
        <ErrorMessage
          title="Error Loading Profile"
          message={error}
          onRetry={loadProfile}
        />
      ) : (
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
              <User className="w-5 h-5 mr-2 text-green-600" />
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
              <FileText className="w-5 h-5 mr-2 text-green-600" />
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
                    <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 cursor-pointer transition-colors">
                      {uploadingNIN ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin text-green-600" />
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
                    <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 cursor-pointer transition-colors">
                      {uploadingBVN ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin text-green-600" />
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
      )}
    </StaffLayout>
  );
};
