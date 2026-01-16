import React, { useState, useEffect } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { staffApi, StaffProfile, StaffBalances } from '../api/staff';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

export const StaffView: React.FC = () => {
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
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleNINUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setUploadError('Please upload an image or PDF file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    try {
      setUploadingNIN(true);
      setUploadError(null);
      setUploadSuccess(null);
      
      const response = await staffApi.uploadNIN(file);
      
      setUploadSuccess('NIN document uploaded successfully!');
      await loadProfile(); // Reload profile to get updated document URL
      
      // Clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload NIN document');
    } finally {
      setUploadingNIN(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleBVNUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setUploadError('Please upload an image or PDF file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    try {
      setUploadingBVN(true);
      setUploadError(null);
      setUploadSuccess(null);
      
      const response = await staffApi.uploadBVN(file);
      
      setUploadSuccess('BVN document uploaded successfully!');
      await loadProfile(); // Reload profile to get updated document URL
      
      // Clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload BVN document');
    } finally {
      setUploadingBVN(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  if (loading) {
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
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Staff Profile</h2>
          <p className="text-sm text-gray-600 mt-1">View and manage your profile information</p>
        </div>
        <button
          onClick={loadProfile}
          className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh profile"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Success/Error Messages */}
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

      {/* Profile Information */}
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
            <p className="text-sm font-medium text-gray-900">{profile.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Phone Number</p>
            <p className="text-sm font-medium text-gray-900">{profile.phone}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Role</p>
            <p className="text-sm font-medium text-gray-900 capitalize">{profile.role}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              profile.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {profile.status}
            </span>
          </div>
        </div>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Savings</h3>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(profile.balances?.savings || 0)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <PiggyBank className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Pension</h3>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(profile.balances?.pension || 0)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Bonus</h3>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(profile.balances?.bonus || 0)}
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-full">
              <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Wallet</h3>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(profile.balances?.wallet || 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Wallet className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Document Uploads */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-blue-600" />
          Identity Documents
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* NIN Upload */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-900">National Identification Number (NIN)</p>
                {profile.nin && (
                  <p className="text-xs text-gray-500 mt-1">NIN: {profile.nin}</p>
                )}
              </div>
              {profile.ninDocumentUrl && (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="flex-1">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleNINUpload}
                  disabled={uploadingNIN}
                  className="hidden"
                />
                <div className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  {uploadingNIN ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-600" />
                      <span className="text-sm text-gray-700">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2 text-gray-600" />
                      <span className="text-sm text-gray-700">
                        {profile.ninDocumentUrl ? 'Update NIN Document' : 'Upload NIN Document'}
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
                  className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50"
                >
                  View
                </a>
              )}
            </div>
          </div>

          {/* BVN Upload */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Bank Verification Number (BVN)</p>
                {profile.bvn && (
                  <p className="text-xs text-gray-500 mt-1">BVN: {profile.bvn}</p>
                )}
              </div>
              {profile.bvnDocumentUrl && (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="flex-1">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleBVNUpload}
                  disabled={uploadingBVN}
                  className="hidden"
                />
                <div className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  {uploadingBVN ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-600" />
                      <span className="text-sm text-gray-700">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2 text-gray-600" />
                      <span className="text-sm text-gray-700">
                        {profile.bvnDocumentUrl ? 'Update BVN Document' : 'Upload BVN Document'}
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
                  className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50"
                >
                  View
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


