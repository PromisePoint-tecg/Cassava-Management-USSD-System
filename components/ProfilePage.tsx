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
          {/* Header */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">My Profile</h2>
                <p className="text-sm text-gray-600 mt-1">
                  View and manage your personal information
                </p>
              </div>
              <button
                onClick={loadProfile}
                className="flex items-center px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all shadow-sm whitespace-nowrap"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-green-600" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                  className={`inline-block px-2 py-1 text-xs font-medium rounded-lg ${
                    profile.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {profile.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-green-600" />
              Identity Documents
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              Upload and manage your NIN and BVN documents
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* NIN Document */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-gray-900 mb-1">
                      National Identification Number (NIN)
                    </h4>
                    <p className="text-xs text-gray-600">
                      Your NIN document for verification
                    </p>
                  </div>
                  {profile.hasNin ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-gray-400 flex-shrink-0" />
                  )}
                </div>

                {profile.hasNin && profile.ninDocumentUrl ? (
                  <div className="space-y-3">
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Status</p>
                      <p className="text-sm font-medium text-green-600">Uploaded</p>
                    </div>
                    <a
                      href={profile.ninDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all shadow-sm"
                    >
                      View Document
                    </a>
                  </div>
                ) : (
                  <div className="bg-white border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-800">
                      Please upload your NIN document in the Documents section
                    </p>
                  </div>
                )}
              </div>

              {/* BVN */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-gray-900 mb-1">
                      Bank Verification Number (BVN)
                    </h4>
                    <p className="text-xs text-gray-600">
                      Your 11-digit BVN for verification
                    </p>
                  </div>
                  {profile.hasBvn ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-gray-400 flex-shrink-0" />
                  )}
                </div>

                {profile.hasBvn && profile.bvn ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">BVN Number</p>
                    <p className="text-base font-mono font-medium text-gray-900">
                      {profile.bvn}
                    </p>
                    <p className="text-xs text-green-600 mt-2">✓ Verified</p>
                  </div>
                ) : (
                  <div className="bg-white border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-800">
                      Please add your BVN in the Documents section
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </StaffLayout>
  );
};