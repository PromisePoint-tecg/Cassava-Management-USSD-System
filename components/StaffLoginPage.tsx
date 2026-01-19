import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, Loader2, Eye, EyeOff } from "lucide-react";
import { staffApi } from "../services/staff";
import type { Staff } from "../services/staff";
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
      setStaffAuthToken(response.token);
      onLoginSuccess(response.staff);
      navigate("/staff/dashboard", { replace: true });
    } catch (err: any) {
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
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Full Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
           backgroundImage: `url('/farm.webp')`,
        }}
      >
        {/* Dark overlay for better contrast */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Left Side - Floating Glass Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <div className="w-full h-full flex items-center justify-center px-4 lg:px-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8 absolute top-8">
            <img 
              src="https://res.cloudinary.com/dt9unisic/image/upload/v1768578156/Screenshot_2026-01-16_at_4.41.39_pm_x5zzrb.png" 
              alt="Promise Point Agritech Logo" 
              className="h-14 mx-auto mb-4 drop-shadow-lg"
            />
          </div>

          {/* Floating Glass Login Card */}
          <div className="bg-white/3 backdrop-blur-xl rounded-[2rem] border border-white/25 shadow-[0_8px_32px_0_rgba(0,0,0,0.3),0_1px_3px_0_rgba(255,255,255,0.3)_inset] p-10 lg:p-16 w-full max-w-2xl min-h-[85vh] flex flex-col justify-center relative overflow-hidden">
            {/* Glass effect overlays */}
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/15 via-white/5 to-transparent rounded-t-[2rem] pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/10 to-transparent rounded-b-[2rem] pointer-events-none" />
            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/10 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-[#066f48]/15 blur-2xl rounded-full pointer-events-none" />

            <div className="relative z-10">
              <div className="mb-10">
                <h2 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">Staff Sign In</h2>
                <p className="text-white/90 text-base drop-shadow">Access your staff dashboard</p>
              </div>

              {error && (
                <div className="mb-8 p-5 bg-red-500/20 backdrop-blur-sm border border-red-300/30 rounded-xl">
                  <p className="text-sm text-white drop-shadow">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Phone Number Field */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-base font-medium text-white/95 mb-3 drop-shadow"
                  >
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-white/60" />
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-white/40 focus:border-white/50 focus:bg-white/15 outline-none transition-all text-white placeholder-white/50 text-base"
                      placeholder="Enter your phone number"
                      pattern="[0-9]{10,11}"
                      maxLength={11}
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* PIN Field */}
                <div>
                  <label
                    htmlFor="pin"
                    className="block text-base font-medium text-white/95 mb-3 drop-shadow"
                  >
                    PIN
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-white/60" />
                    </div>
                    <input
                      id="pin"
                      type={showPin ? "text" : "password"}
                      required
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="block w-full pl-12 pr-12 py-4 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-white/40 focus:border-white/50 focus:bg-white/15 outline-none transition-all text-white placeholder-white/50 text-base"
                      placeholder="Enter your PIN"
                      pattern="[0-9]{4,6}"
                      maxLength={6}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    >
                      {showPin ? (
                        <EyeOff className="h-5 w-5 text-white/60 hover:text-white/80" />
                      ) : (
                        <Eye className="h-5 w-5 text-white/60 hover:text-white/80" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center py-4 px-4 rounded-xl transition-all duration-300 group relative overflow-hidden text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-[#066f48]/50 to-emerald-600/50 hover:from-[#066f48] hover:to-emerald-600 border border-white/30 text-base"
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin relative z-10" />
                      <span className="font-semibold relative z-10">Signing in...</span>
                    </>
                  ) : (
                    <span className="font-semibold relative z-10">Sign In</span>
                  )}
                </button>
              </form>

              {/* Forgot PIN Link */}
              <div className="mt-8">
                <button
                  onClick={handleForgotPin}
                  className="text-base text-white/90 hover:text-white font-medium transition-colors drop-shadow"
                >
                  Forgot your PIN?
                </button>
              </div>

              {/* Footer */}
              <p className="text-sm text-white/80 drop-shadow mt-8">
                © 2025 Promise Point Agrictech Solution. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot PIN Modal */}
      {showForgotPin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/25 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] p-8 w-full max-w-md relative overflow-hidden">
            {/* Glass effect overlays */}
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/10 via-white/5 to-transparent rounded-t-[2rem] pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/10 to-transparent rounded-b-[2rem] pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white drop-shadow-lg">Reset PIN</h2>
                <button
                  onClick={handleBackToLogin}
                  className="text-white/70 hover:text-white transition-colors"
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
                  <p className="text-white/90 text-sm mb-4 drop-shadow">
                    Enter your phone number to receive an OTP for PIN reset.
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-white/95 mb-2 drop-shadow">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value)}
                      className="block w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-white/40 focus:border-white/50 focus:bg-white/15 outline-none transition-all text-white placeholder-white/50"
                      placeholder="Enter your phone number"
                      pattern="[0-9]{10,11}"
                      maxLength={11}
                    />
                  </div>

                  {forgotError && (
                    <div className="bg-red-500/20 backdrop-blur-sm border border-red-300/30 text-white px-4 py-3 rounded-xl text-sm drop-shadow">
                      {forgotError}
                    </div>
                  )}

                  {forgotSuccess && (
                    <div className="bg-green-500/20 backdrop-blur-sm border border-green-300/30 text-white px-4 py-3 rounded-xl text-sm drop-shadow">
                      {forgotSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full flex items-center justify-center py-3 px-4 rounded-xl transition-all duration-300 group relative overflow-hidden text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-[#066f48]/50 to-emerald-600/50 hover:from-[#066f48] hover:to-emerald-600 border border-white/30"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                    {forgotLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin relative z-10" />
                        <span className="font-semibold relative z-10">Sending OTP...</span>
                      </>
                    ) : (
                      <span className="font-semibold relative z-10">Send OTP</span>
                    )}
                  </button>
                </form>
              )}

              {forgotStep === "otp" && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <p className="text-white/90 text-sm mb-4 drop-shadow">
                    Enter the OTP sent to your phone and set a new PIN.
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-white/95 mb-2 drop-shadow">
                      OTP
                    </label>
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="block w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-white/40 focus:border-white/50 focus:bg-white/15 outline-none transition-all text-white placeholder-white/50"
                      placeholder="Enter 6-digit OTP"
                      pattern="[0-9]{6}"
                      maxLength={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/95 mb-2 drop-shadow">
                      New PIN
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPin ? "text" : "password"}
                        required
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        className="block w-full px-4 pr-12 py-3 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-white/40 focus:border-white/50 focus:bg-white/15 outline-none transition-all text-white placeholder-white/50"
                        placeholder="Enter new PIN (4-6 digits)"
                        pattern="[0-9]{4,6}"
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPin(!showNewPin)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      >
                        {showNewPin ? (
                          <EyeOff className="h-5 w-5 text-white/60 hover:text-white/80" />
                        ) : (
                          <Eye className="h-5 w-5 text-white/60 hover:text-white/80" />
                        )}
                      </button>
                    </div>
                  </div>

                  {forgotError && (
                    <div className="bg-red-500/20 backdrop-blur-sm border border-red-300/30 text-white px-4 py-3 rounded-xl text-sm drop-shadow">
                      {forgotError}
                    </div>
                  )}

                  {forgotSuccess && (
                    <div className="bg-green-500/20 backdrop-blur-sm border border-green-300/30 text-white px-4 py-3 rounded-xl text-sm drop-shadow">
                      {forgotSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full flex items-center justify-center py-3 px-4 rounded-xl transition-all duration-300 group relative overflow-hidden text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-[#066f48]/50 to-emerald-600/50 hover:from-[#066f48] hover:to-emerald-600 border border-white/30"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                    {forgotLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin relative z-10" />
                        <span className="font-semibold relative z-10">Resetting PIN...</span>
                      </>
                    ) : (
                      <span className="font-semibold relative z-10">Reset PIN</span>
                    )}
                  </button>
                </form>
              )}

              <div className="mt-4 text-center">
                <button
                  onClick={handleBackToLogin}
                  className="text-sm text-white/80 hover:text-white transition-colors drop-shadow"
                >
                  Back to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffLoginPage;