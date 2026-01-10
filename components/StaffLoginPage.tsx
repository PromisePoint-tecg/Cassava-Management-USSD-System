import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, Loader2, Eye, EyeOff } from "lucide-react";
import { staffApi } from "../api/staff";
import type { Staff } from "../api/staff";
import { setStaffAuthToken, getStaffAuthToken } from "../utils/cookies";

interface StaffLoginPageProps {
  onLoginSuccess: (staff: Staff) => void;
}

const StaffLoginPage: React.FC<StaffLoginPageProps> = ({ onLoginSuccess }) => {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const navigate = useNavigate();

  // Forgot PIN states
  const [showForgotPin, setShowForgotPin] = useState(false);
  const [forgotStep, setForgotStep] = useState<"phone" | "otp" | "newPin">(
    "phone"
  );
  const [forgotPhone, setForgotPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  // Check if already authenticated
  useEffect(() => {
    const token = getStaffAuthToken();
    if (token) {
      navigate("/staff/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await staffApi.login(phone, pin);
      // Store token in cookie
      setStaffAuthToken(response.token);
      // Call parent callback with staff info
      onLoginSuccess(response.staff);
      // Navigate to dashboard
      navigate("/staff/dashboard", { replace: true });
    } catch (err: any) {
      // Try to extract error message from API error response
      let message = "Login failed. Please try again.";
      if (err?.response?.data?.message) {
        message = err.response.data.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPin = () => {
    setShowForgotPin(true);
    setForgotStep("phone");
    setForgotPhone("");
    setOtp("");
    setNewPin("");
    setConfirmPin("");
    setForgotError("");
    setForgotSuccess("");
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotLoading(true);

    try {
      await staffApi.requestPinReset(forgotPhone);
      setForgotSuccess("OTP sent successfully to your phone number.");
      setForgotStep("otp");
    } catch (err: any) {
      let message = "Failed to send OTP. Please try again.";
      if (err instanceof Error) {
        message = err.message;
      }
      setForgotError(message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotLoading(true);

    try {
      await staffApi.verifyPinReset(forgotPhone, otp, newPin);
      setForgotSuccess(
        "PIN reset successfully! You can now login with your new PIN."
      );
      setTimeout(() => {
        setShowForgotPin(false);
        setForgotStep("phone");
      }, 3000);
    } catch (err: any) {
      let message = "Failed to reset PIN. Please try again.";
      if (err instanceof Error) {
        message = err.message;
      }
      setForgotError(message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPin(false);
    setForgotStep("phone");
    setForgotError("");
    setForgotSuccess("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-4 shadow-lg">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Promise Point
          </h1>
          <p className="text-gray-600">Agrictech Solution - Staff Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Staff Sign In
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone Number Field */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your phone number"
                  pattern="[0-9]{10,11}"
                  maxLength={11}
                />
              </div>
            </div>

            {/* PIN Field */}
            <div>
              <label
                htmlFor="pin"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                PIN
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="pin"
                  type={showPin ? "text" : "password"}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your PIN"
                  pattern="[0-9]{4,6}"
                  maxLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPin ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <button
              onClick={handleForgotPin}
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              Forgot PIN?
            </button>
          </div>
        </div>

        {/* Forgot PIN Modal */}
        {showForgotPin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Reset PIN</h2>
                <button
                  onClick={handleBackToLogin}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {forgotStep === "phone" && (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <p className="text-gray-600 text-sm mb-4">
                    Enter your phone number to receive an OTP for PIN reset.
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value)}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your phone number"
                      pattern="[0-9]{10,11}"
                      maxLength={11}
                    />
                  </div>

                  {forgotError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {forgotError}
                    </div>
                  )}

                  {forgotSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                      {forgotSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      "Send OTP"
                    )}
                  </button>
                </form>
              )}

              {forgotStep === "otp" && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <p className="text-gray-600 text-sm mb-4">
                    Enter the OTP sent to your phone and set a new PIN.
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      OTP
                    </label>
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter 6-digit OTP"
                      pattern="[0-9]{6}"
                      maxLength={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New PIN
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPin ? "text" : "password"}
                        required
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        className="block w-full px-3 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter new PIN (4-6 digits)"
                        pattern="[0-9]{4,6}"
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPin(!showNewPin)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showNewPin ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  {forgotError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {forgotError}
                    </div>
                  )}

                  {forgotSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                      {forgotSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Resetting PIN...
                      </>
                    ) : (
                      "Reset PIN"
                    )}
                  </button>
                </form>
              )}

              <div className="mt-4 text-center">
                <button
                  onClick={handleBackToLogin}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Back to Login
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            &copy; {new Date().getFullYear()} Promise Point Agrictech Solution.
            All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StaffLoginPage;
