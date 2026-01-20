import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Shield,
  Calendar,
  CheckCircle,
  XCircle,
  Edit3,
  Save,
  X,
  Phone,
} from "lucide-react";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorMessage } from "./ErrorMessage";
import {
  getProfile,
  updateProfile,
  AdminProfile,
  UpdateProfileRequest,
} from "../api/auth";
import LeafInlineLoader from "./Loader";

export const AdminProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const [formData, setFormData] = useState<UpdateProfileRequest>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const profileData = await getProfile();
        setProfile(profileData);
        setFormData({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          email: profileData.email,
          phone: profileData.phone || "",
        });
        setError(null);
      } catch (err) {
        console.error("Error loading profile:", err);
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setUpdateError(null);
    setUpdateSuccess(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setUpdateError(null);
    setUpdateSuccess(false);
    // Reset form data to current profile
    if (profile) {
      setFormData({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone || "",
      });
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setUpdating(true);
      setUpdateError(null);
      setUpdateSuccess(false);

      const updatedProfile = await updateProfile(formData);
      setProfile(updatedProfile);
      setIsEditing(false);
      setUpdateSuccess(true);

      // Reset success message after 3 seconds
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setUpdateError(
        err instanceof Error ? err.message : "Failed to update profile"
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleInputChange = (
    field: keyof UpdateProfileRequest,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return <LeafInlineLoader />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Error Loading Profile"
        message={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!profile) {
    return (
      <ErrorMessage
        title="Profile Not Found"
        message="Unable to load profile information"
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Liquid Glass */}
      <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/5 via-transparent to-cyan-400/5 rounded-[2rem] pointer-events-none" />
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-[#066f48]/10 to-transparent blur-2xl rounded-full pointer-events-none" />
        
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Profile</h1>
            <p className="text-gray-600">
              View and manage your account information
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="inline-flex items-center px-4 py-2 bg-white/25 backdrop-blur-md border border-white/50 rounded-xl text-sm font-medium text-gray-700 hover:bg-white/35 transition-all shadow-sm"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  disabled={updating}
                  className="inline-flex items-center px-4 py-2 bg-white/25 backdrop-blur-md border border-white/50 rounded-xl text-sm font-medium text-gray-700 hover:bg-white/35 transition-all shadow-sm disabled:opacity-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={updating}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updating ? "Saving..." : "Save Changes"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {updateSuccess && (
        <div className="bg-green-50/90 backdrop-blur-sm border border-green-200/50 rounded-[1.5rem] p-4 shadow-sm">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Profile updated successfully!
              </p>
            </div>
          </div>
        </div>
      )}

      {updateError && (
        <div className="bg-red-50/90 backdrop-blur-sm border border-red-200/50 rounded-[1.5rem] p-4 shadow-sm">
          <div className="flex">
            <XCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{updateError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Profile Card - Liquid Glass */}
      <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/5 via-transparent to-cyan-400/5 rounded-[2rem] pointer-events-none" />
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
        
        <div className="px-6 py-4 border-b border-white/30 bg-white/10 backdrop-blur-md relative z-10">
          <h2 className="text-lg font-semibold text-gray-900">
            Profile Information
          </h2>
        </div>

        <div className="p-6 space-y-6 relative z-10">
          {/* Avatar and Basic Info */}
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100/90 backdrop-blur-sm flex items-center justify-center border border-emerald-200/50">
              <User className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {profile.fullName}
              </h3>
              <p className="text-gray-600">{profile.email}</p>
            </div>
          </div>

          {/* Profile Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Editable Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800"
                    placeholder="Enter first name"
                  />
                ) : (
                  <div className="flex items-center px-3 py-2 bg-white/25 backdrop-blur-sm border border-white/40 rounded-xl">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{profile.firstName}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800"
                    placeholder="Enter last name"
                  />
                ) : (
                  <div className="flex items-center px-3 py-2 bg-white/25 backdrop-blur-sm border border-white/40 rounded-xl">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{profile.lastName}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full px-3 py-2 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800"
                    placeholder="Enter email address"
                  />
                ) : (
                  <div className="flex items-center px-3 py-2 bg-white/25 backdrop-blur-sm border border-white/40 rounded-xl">
                    <Mail className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{profile.email}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="w-full px-3 py-2 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800"
                    placeholder="Enter phone number"
                  />
                ) : (
                  <div className="flex items-center px-3 py-2 bg-white/25 backdrop-blur-sm border border-white/40 rounded-xl">
                    <Phone className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">
                      {profile.phone || "Not provided"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Account Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <div className="flex items-center px-3 py-2 bg-white/25 backdrop-blur-sm border border-white/40 rounded-xl">
                  <Shield className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-900 capitalize">
                    {profile.role.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="flex items-center px-3 py-2 bg-white/25 backdrop-blur-sm border border-white/40 rounded-xl">
                  {profile.isActive ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 mr-2" />
                  )}
                  <span
                    className={`text-gray-900 ${
                      profile.isActive ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {profile.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Since
                </label>
                <div className="flex items-center px-3 py-2 bg-white/25 backdrop-blur-sm border border-white/40 rounded-xl">
                  <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-900">
                    {new Date(profile.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Permissions
                </label>
                <div className="flex flex-wrap gap-2">
                  {profile.permissions.map((permission) => (
                    <span
                      key={permission}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100/90 text-emerald-800 border border-emerald-200/50 backdrop-blur-sm"
                    >
                      {permission.replace("_", " ")}
                    </span>
                  ))}
                </div>
              </div>

              {/* Timestamps */}
              <div className="pt-4 border-t border-white/30">
                <div className="space-y-2 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Created:</span>{" "}
                    {new Date(profile.createdAt).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Last Updated:</span>{" "}
                    {new Date(profile.updatedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};