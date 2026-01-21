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
import { staffApi, StaffProfile } from "../services/staff";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorMessage } from "./ErrorMessage";
import { StaffLayout } from "./StaffLayout";
import LeafInlineLoader, { LeafLoader } from "./Loader";

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
        <LeafInlineLoader />
      ) : error ? (
        <ErrorMessage
          title="Error Loading Profile"
          message={error}
          onRetry={loadProfile}
        />
      ) : (
        <div className="space-y-5">
          {/* Header - Liquid Glass */}
          <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 via-transparent to-emerald-400/5 rounded-[2rem] pointer-events-none" />
            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">My Profile</h2>
                <p className="text-sm text-gray-600 mt-1">
                  View and manage your personal information
                </p>
              </div>
              <button
                onClick={loadProfile}
                className="flex items-center px-3 py-2 text-sm text-gray-700 bg-white/25 backdrop-blur-md border border-white/50 rounded-xl hover:bg-white/35 transition-all shadow-sm whitespace-nowrap"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>

          {/* Personal Information - Liquid Glass */}
          <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-5 sm:p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
            
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center relative z-10">
              <User className="w-5 h-5 mr-2 text-green-600" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 relative z-10">
              <div>
                <p className="text-xs text-gray-600 mb-1">Full Name</p>
                <p className="text-sm font-medium text-gray-900">
                  {profile.firstName} {profile.lastName}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Email</p>
                <p className="text-sm font-medium text-gray-900 break-all">
                  {profile.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Phone Number</p>
                <p className="text-sm font-medium text-gray-900">
                  {profile.phone}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Role</p>
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {profile.role}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Status</p>
                <span
                  className={`inline-block px-2 py-1 text-xs font-medium rounded-full backdrop-blur-sm ${
                    profile.isActive
                      ? "bg-green-100/80 text-green-800 border border-green-200/50"
                      : "bg-gray-100/80 text-gray-800 border border-gray-200/50"
                  }`}
                >
                  {profile.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {profile.nin && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">NIN</p>
                  <p className="text-sm font-medium text-gray-900">
                    {profile.nin}
                  </p>
                </div>
              )}
              {profile.bvn && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">BVN</p>
                  <p className="text-sm font-medium text-gray-900">
                    {profile.bvn}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Documents Section - Liquid Glass */}
          <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-5 sm:p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
            
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center relative z-10">
              <FileText className="w-5 h-5 mr-2 text-green-600" />
              Identity Documents
            </h3>
            <p className="text-sm text-gray-600 mb-4 sm:mb-6 relative z-10">
              Upload and manage your NIN and BVN documents
            </p>

            {uploadSuccess && (
              <div className="bg-green-50/80 backdrop-blur-sm border border-green-200/50 rounded-[1.5rem] p-3 sm:p-4 mb-4 sm:mb-6 relative z-10">
                <div className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-green-800">{uploadSuccess}</div>
                </div>
              </div>
            )}

            {uploadError && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-[1.5rem] p-3 sm:p-4 mb-4 sm:mb-6 relative z-10">
                <div className="flex items-center">
                  <XCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
                  <p className="text-sm text-red-800">{uploadError}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 relative z-10">
              {/* NIN Upload */}
              <div className="bg-white/15 backdrop-blur-lg border border-white/50 rounded-[1.5rem] p-4 sm:p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[1.5rem] pointer-events-none" />
                <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/25 blur-2xl rounded-full pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2 relative z-10">
                  <div className="flex-1">
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900">
                      National Identification Number (NIN)
                    </h4>
                    {profile.nin && (
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        NIN: {profile.nin}
                      </p>
                    )}
                  </div>
                  {profile.ninDocumentUrl && (
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
                  )}
                </div>
                <div className="space-y-3 relative z-10">
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleNINUpload}
                      disabled={uploadingNIN}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-white/50 bg-white/20 backdrop-blur-sm rounded-xl hover:border-green-500 hover:bg-green-50/50 cursor-pointer transition-all">
                      {uploadingNIN ? (
                        <>
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin text-green-600" />
                          <span className="text-xs sm:text-sm text-gray-700">
                            Uploading...
                          </span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-600" />
                          <span className="text-xs sm:text-sm text-gray-700">
                            {profile.ninDocumentUrl
                              ? "Replace NIN Document"
                              : "Upload NIN Document"}
                          </span>
                        </>
                      )}
                    </div>
                  </label>
                  <p className="text-xs text-gray-600">
                    Accepted formats: JPG, PNG, PDF. Max size: 5MB
                  </p>
                </div>
              </div>

              {/* BVN Upload */}
              <div className="bg-white/15 backdrop-blur-lg border border-white/50 rounded-[1.5rem] p-4 sm:p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[1.5rem] pointer-events-none" />
                <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/25 blur-2xl rounded-full pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2 relative z-10">
                  <div className="flex-1">
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900">
                      Bank Verification Number (BVN)
                    </h4>
                    {profile.bvn && (
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        BVN: {profile.bvn}
                      </p>
                    )}
                  </div>
                  {profile.bvnDocumentUrl && (
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
                  )}
                </div>
                <div className="space-y-3 relative z-10">
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleBVNUpload}
                      disabled={uploadingBVN}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-white/50 bg-white/20 backdrop-blur-sm rounded-xl hover:border-green-500 hover:bg-green-50/50 cursor-pointer transition-all">
                      {uploadingBVN ? (
                        <>
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin text-green-600" />
                          <span className="text-xs sm:text-sm text-gray-700">
                            Uploading...
                          </span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-600" />
                          <span className="text-xs sm:text-sm text-gray-700">
                            {profile.bvnDocumentUrl
                              ? "Replace BVN Document"
                              : "Upload BVN Document"}
                          </span>
                        </>
                      )}
                    </div>
                  </label>
                  <p className="text-xs text-gray-600">
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