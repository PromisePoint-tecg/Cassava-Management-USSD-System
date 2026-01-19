import React, { useState } from "react";
import { Lock, User, Loader2 } from "lucide-react";
import { login, introspect } from "../api/auth";
import type { AdminInfo } from "../api/auth";
import LeafInlineLoader, { LeafLoader } from "./Loader";

interface LoginPageProps {
  onLoginSuccess: (admin: AdminInfo) => void;
  onForgotPassword?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onForgotPassword,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Step 1: Login to get token (stored in cookie automatically)
      await login({ email, password });

      // Step 2: Get admin info using introspect endpoint
      const adminInfo = await introspect();

      // Step 3: Call parent callback with admin info
      onLoginSuccess(adminInfo);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again."
      );
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
            Empowering Farmers, Growing Communities
          </h1>
          <p className="text-xl text-white/95 leading-relaxed drop-shadow-md">
            Your trusted partner in agricultural innovation. Connecting farmers to markets, credit, and opportunities.
          </p>
        </div>
      </div>

      {/* Right Side - Floating Glass Login Form */}
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

          {/* Floating Glass Login Card - Much Larger */}
          <div className="bg-white/3 backdrop-blur-xl rounded-[2rem] border border-white/25 shadow-[0_8px_32px_0_rgba(0,0,0,0.3),0_1px_3px_0_rgba(255,255,255,0.3)_inset] p-10 lg:p-16 w-full max-w-2xl min-h-[85vh] flex flex-col justify-center relative overflow-hidden">
            {/* Glass effect overlays */}
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/15 via-white/5 to-transparent rounded-t-[2rem] pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/10 to-transparent rounded-b-[2rem] pointer-events-none" />
            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/10 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-[#066f48]/15 blur-2xl rounded-full pointer-events-none" />

            <div className="relative z-10">
              <div className="mb-10">
                <h2 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">Welcome Back</h2>
                <p className="text-white/90 text-base drop-shadow">Sign in to access your admin dashboard</p>
              </div>

              {error && (
                <div className="mb-8 p-5 bg-red-500/20 backdrop-blur-sm border border-red-300/30 rounded-xl">
                  <p className="text-sm text-white drop-shadow">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-base font-medium text-white/95 mb-3 drop-shadow"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-white/60" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-white/40 focus:border-white/50 focus:bg-white/15 outline-none transition-all text-white placeholder-white/50 text-base"
                      placeholder="Enter your email"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-base font-medium text-white/95 mb-3 drop-shadow"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-white/60" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-white/40 focus:border-white/50 focus:bg-white/15 outline-none transition-all text-white placeholder-white/50 text-base"
                      placeholder="Enter your password"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                {loading ? (
                  <LeafInlineLoader />
                ) : (
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center py-4 px-4 rounded-xl transition-all duration-300 group relative overflow-hidden text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-[#066f48]/50 to-emerald-600/50 hover:from-[#066f48] hover:to-emerald-600 border border-white/30 text-base"
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                    <span className="font-semibold relative z-10">Sign In</span>
                  </button>
                )}
              </form>

              {/* Forgot Password Link */}
              {onForgotPassword && (
                <div className="mt-8 ">
                  <button
                    onClick={onForgotPassword}
                    className="text-base text-white/90 hover:text-white font-medium transition-colors drop-shadow"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}

              {/* Footer */}
              <p className=" text-sm text-white/80 drop-shadow mt-8">
                © 2025 Promise Point Agrictech Solution. All rights reserved.
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>

  );
};

export default LoginPage;