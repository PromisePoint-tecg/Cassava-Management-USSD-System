import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
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

interface DocumentsPageProps {
  onLogout: () => void;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({ onLogout }) => {
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingNIN, setUploadingNIN] = useState(false);
  const [submittingBVN, setSubmittingBVN] = useState(false);
  const [bvnInput, setBvnInput] = useState("");
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

      await staffApi.uploadNINToCloudinary(file);

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

  const handleBVNSubmit = async () => {
    if (!bvnInput.trim()) {
      setUploadError("Please enter a BVN");
      return;
    }

    if (bvnInput.length !== 11 || !/^\d+$/.test(bvnInput)) {
      setUploadError("BVN must be exactly 11 digits");
      return;
    }

    try {
      setSubmittingBVN(true);
      setUploadError(null);
      setUploadSuccess(null);

      await staffApi.addBVN(bvnInput);

      setUploadSuccess("BVN added successfully!");
      setBvnInput("");
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
      setUploadError(err.message || "Failed to add BVN");
    } finally {
      setSubmittingBVN(false);
    }
  };

  return (
    <StaffLayout
      title="Identity Documents"
      subtitle={profile ? `Welcome, ${profile?.firstName}` : ""}
      profile={profile}
      onLogout={onLogout}
      currentPath={location.pathname}
    >
      {loading && !profile ? (
        <LoadingSpinner message="Loading documents..." />
      ) : error && !profile ? (
        <ErrorMessage
          title="Error Loading Documents"
          message={error}
          onRetry={loadProfile}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Identity Documents
              </h2>
              <p className="text-gray-600 mt-1">
                Upload your NIN document and enter your BVN
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

          {uploadSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-green-800">{uploadSuccess}</div>
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
            {/* NIN Upload - Only show if not already uploaded */}
            {!profile.hasNin && (
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
                  {profile.ninDocumentUrl && (
                    <a
                      href={profile.ninDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center px-4 py-2 text-sm text-green-600 hover:text-green-700 border border-green-300 rounded-lg hover:bg-green-50"
                    >
                      View Document
                    </a>
                  )}
                  <p className="text-xs text-gray-500">
                    Accepted formats: JPG, PNG, PDF. Max size: 5MB
                  </p>
                </div>
              </div>
            )}

            {/* BVN Input - Only show if not already added */}
            {!profile.hasBvn && (
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
                  {profile.bvn && (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={bvnInput}
                      onChange={(e) =>
                        setBvnInput(
                          e.target.value.replace(/\D/g, "").slice(0, 11)
                        )
                      }
                      placeholder="Enter 11-digit BVN"
                      disabled={submittingBVN || !!profile.bvn}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                    />
                    <button
                      onClick={handleBVNSubmit}
                      disabled={
                        submittingBVN || !bvnInput.trim() || !!profile.bvn
                      }
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                    >
                      {submittingBVN ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit"
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Enter your 11-digit Bank Verification Number
                  </p>
                </div>
              </div>
            )}

            {/* Show completion message if both are uploaded */}
            {profile.hasNin && profile.hasBvn && (
              <div className="col-span-full bg-green-50 border border-green-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">
                      All Documents Submitted
                    </h3>
                    <p className="text-green-700 mt-1">
                      Your NIN document and BVN have been successfully uploaded
                      and verified.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </StaffLayout>
  );
};
