import React, { useState } from "react";
import { ArrowLeft, Phone, Lock, Loader2, CheckCircle, Mail, Eye, EyeOff } from "lucide-react";
import { apiClient } from "../services/client";

interface AdminForgotPasswordProps {
  onBackToLogin: () => void;
}

const AdminForgotPassword: React.FC<AdminForgotPasswordProps> = ({
  onBackToLogin,
}) => {
  const [step, setStep] = useState<"request" | "verify" | "reset">("request");
  const [method, setMethod] = useState<"email" | "sms">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload =
        method === "email" ? { email } : { phone };

      const response = await apiClient.post<{ message: string }>(
        "/admins/request-password-reset",
        payload
      );

      setSuccess(response.message);
      setStep("verify");
    } catch (err: any) {
      setError(err.message || "Failed to send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload =
        method === "email"
          ? { email, otp }
          : { phone, otp };

      const response = await apiClient.post<{ message: string; resetToken: string }>(
        "/admins/verify-password-reset",
        payload
      );

      setSuccess(response.message);
      setResetToken(response.resetToken);
      setStep("reset");
    } catch (err: any) {
      setError(err.message || "Invalid OTP code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.post<{ message: string }>(
        "/admins/complete-password-reset",
        { resetToken, newPassword }
      );

      setSuccess(response.message);
      // Redirect to login after successful reset
      setTimeout(() => {
        onBackToLogin();
      }, 2000);
    } catch (err: any) {
      // Display the detailed error message from the backend
      const errorMessage = err.message || "Failed to reset password. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Full Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/login-bg.webp')`,
        }}
      >
        {/* Dark overlay for better contrast */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Left Side - Logo and Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-center px-12 xl:px-16">
        <div className="max-w-2xl">
          <img
            src="/logo.png"
            alt="Promise Point Agritech Logo"
            className="h-20 mb-8"
          />
          <h1 className="text-5xl xl:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
            Reset Your Password
          </h1>
          <p className="text-xl text-white/95 leading-relaxed drop-shadow-md">
            Regain access to your admin dashboard. We'll send you a verification code to reset your password securely.
          </p>
        </div>
      </div>

      {/* Right Side - Floating Glass Form */}
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

          {/* Floating Glass Card */}
          <div className="bg-white/3 backdrop-blur-xl rounded-[2rem] border border-white/25 shadow-[0_8px_32px_0_rgba(0,0,0,0.3),0_1px_3px_0_rgba(255,255,255,0.3)_inset] p-10 lg:p-16 w-full max-w-2xl min-h-[85vh] flex flex-col justify-center relative overflow-hidden">
            {/* Glass effect overlays */}
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/15 via-white/5 to-transparent rounded-t-[2rem] pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/10 to-transparent rounded-b-[2rem] pointer-events-none" />
            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/10 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-[#066f48]/15 blur-2xl rounded-full pointer-events-none" />

            <div className="relative z-10">
              {/* Back Button */}
              <button
                onClick={onBackToLogin}
                className="flex items-center text-white/90 hover:text-white mb-8 transition-colors drop-shadow group"
              >
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="text-base font-medium">Back to Login</span>
              </button>

              <div className="mb-10">
                <h2 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">
                  {step === "request" && "Reset Password"}
                  {step === "verify" && "Verify Code"}
                  {step === "reset" && "Set New Password"}
                </h2>
                <p className="text-white/90 text-base drop-shadow">
                  {step === "request" && "Choose your preferred method to receive a verification code"}
                  {step === "verify" && "Enter the verification code sent to you"}
                  {step === "reset" && "Create a strong password for your account"}
                </p>
              </div>

              {error && (
                <div className="mb-8 p-5 bg-red-500/20 backdrop-blur-sm border border-red-300/30 rounded-xl">
                  <p className="text-sm text-white drop-shadow">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-8 p-5 bg-emerald-500/20 backdrop-blur-sm border border-emerald-300/30 rounded-xl">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-white mr-3 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-white drop-shadow">{success}</p>
                  </div>
                </div>
              )}

              {step === "request" ? (
                <form onSubmit={handleRequestReset} className="space-y-6">
                  {/* Method Selector */}
                  <div>
                    <label className="block text-base font-medium text-white/95 mb-3 drop-shadow">
                      Reset Method
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setMethod("email")}
                        className={`flex items-center justify-center px-6 py-4 border-2 rounded-xl font-medium transition-all backdrop-blur-md ${
                          method === "email"
                            ? "border-white/50 bg-white/20 text-white shadow-lg"
                            : "border-white/20 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10"
                        }`}
                      >
                        <Mail className="h-5 w-5 mr-2" />
                        Email
                      </button>
                      <button
                        type="button"
                        onClick={() => setMethod("sms")}
                        className={`flex items-center justify-center px-6 py-4 border-2 rounded-xl font-medium transition-all backdrop-blur-md ${
                          method === "sms"
                            ? "border-white/50 bg-white/20 text-white shadow-lg"
                            : "border-white/20 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10"
                        }`}
                      >
                        <Phone className="h-5 w-5 mr-2" />
                        SMS
                      </button>
                    </div>
                  </div>

                  {/* Email Input */}
                  {method === "email" && (
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-base font-medium text-white/95 mb-3 drop-shadow"
                      >
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-white/60" />
                        </div>
                        <input
                          id="email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="block w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-white/40 focus:border-white/50 focus:bg-white/15 outline-none transition-all text-white placeholder-white/50 text-base"
                          placeholder="admin@promisepointgtnl.com"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  )}

                  {/* Phone Input */}
                  {method === "sms" && (
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-base font-medium text-white/95 mb-3 drop-shadow"
                      >
                        Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-white/60" />
                        </div>
                        <input
                          id="phone"
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="block w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-white/40 focus:border-white/50 focus:bg-white/15 outline-none transition-all text-white placeholder-white/50 text-base"
                          placeholder="+2348123456789"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center py-4 px-4 rounded-xl transition-all duration-300 group relative overflow-hidden text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-[#066f48]/50 to-emerald-600/50 hover:from-[#066f48] hover:to-emerald-600 border border-white/30 text-base"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5 mr-2" />
                        Sending Code...
                      </>
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                        <span className="font-semibold relative z-10">
                          Send Verification Code
                        </span>
                      </>
                    )}
                  </button>
                </form>
              ) : step === "verify" ? (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  {/* OTP Input */}
                  <div>
                    <label
                      htmlFor="otp"
                      className="block text-base font-medium text-white/95 mb-3 drop-shadow"
                    >
                      Verification Code
                    </label>
                    <input
                      id="otp"
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="block w-full px-4 py-4 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-white/40 focus:border-white/50 focus:bg-white/15 outline-none transition-all text-white placeholder-white/50 text-base text-center tracking-widest font-semibold"
                      placeholder="000000"
                      maxLength={6}
                      disabled={loading}
                    />
                    <p className="mt-2 text-sm text-white/70 drop-shadow">
                      Enter the 6-digit code sent to your {method === "email" ? "email" : "phone"}
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center py-4 px-4 rounded-xl transition-all duration-300 group relative overflow-hidden text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-[#066f48]/50 to-emerald-600/50 hover:from-[#066f48] hover:to-emerald-600 border border-white/30 text-base"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5 mr-2" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                        <span className="font-semibold relative z-10">
                          Verify Code
                        </span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCompleteReset} className="space-y-6">

                  {/* New Password Input */}
                  <div>
                    <label
                      htmlFor="newPassword"
                      className="block text-base font-medium text-white/95 mb-3 drop-shadow"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-white/60" />
                      </div>
                      <input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="block w-full pl-12 pr-12 py-4 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-white/40 focus:border-white/50 focus:bg-white/15 outline-none transition-all text-white placeholder-white/50 text-base"
                        placeholder="Enter new password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-5 w-5 text-white/60 hover:text-white/80 transition-colors" />
                        ) : (
                          <Eye className="h-5 w-5 text-white/60 hover:text-white/80 transition-colors" />
                        )}
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-white/70 drop-shadow">
                      Password must contain at least 8 characters with uppercase, lowercase, number and special character
                    </p>
                  </div>

                  {/* Confirm Password Input */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-base font-medium text-white/95 mb-3 drop-shadow"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-white/60" />
                      </div>
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full pl-12 pr-12 py-4 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-white/40 focus:border-white/50 focus:bg-white/15 outline-none transition-all text-white placeholder-white/50 text-base"
                        placeholder="Confirm new password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-white/60 hover:text-white/80 transition-colors" />
                        ) : (
                          <Eye className="h-5 w-5 text-white/60 hover:text-white/80 transition-colors" />
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
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5 mr-2" />
                        Resetting Password...
                      </>
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                        <span className="font-semibold relative z-10">
                          Reset Password
                        </span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Footer */}
              <p className="text-sm text-white/80 drop-shadow mt-8">
                © 2025 Promise Point Agrictech Solution. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminForgotPassword;
