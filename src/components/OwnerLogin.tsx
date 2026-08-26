import React, { useState } from "react";
import { Lock, Mail, Eye, EyeOff, UtensilsCrossed, ArrowLeft, KeyRound } from "lucide-react";
import { api } from "../lib/api";

interface OwnerLoginProps {
  onLoginSuccess: () => void;
  onBackToMenu: () => void;
}

export const OwnerLogin: React.FC<OwnerLoginProps> = ({ onLoginSuccess, onBackToMenu }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both Owner Gmail and Owner Password.");
      return;
    }

    setLoading(true);
    try {
      await api.login(email.trim(), password);
      onLoginSuccess();
    } catch (err: any) {
      setErrorMessage(err?.message || "Incorrect email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col justify-center items-center px-4 py-8">
      {/* Back to Menu navigation */}
      <button
        onClick={onBackToMenu}
        className="mb-6 inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#686868] hover:text-[#1F1F1F] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Customer Menu</span>
      </button>

      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-200/80 shadow-lg p-6 sm:p-8">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F8CB46] text-[#1F1F1F] flex items-center justify-center font-bold shadow-md mb-3">
            <Lock className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-black text-[#1F1F1F] tracking-tight">Owner Login</h1>
          <p className="text-xs sm:text-sm text-[#686868] mt-1">
            Access private restaurant management dashboard
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            id="owner-login-error"
            className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold text-center"
          >
            {errorMessage}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="owner-gmail-input"
              className="block text-xs font-bold uppercase tracking-wider text-[#1F1F1F] mb-1.5"
            >
              Owner Gmail / Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="owner-gmail-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@gmail.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-[#1F1F1F] placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C831F] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="owner-password-input"
              className="block text-xs font-bold uppercase tracking-wider text-[#1F1F1F] mb-1.5"
            >
              Owner Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                id="owner-password-input"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-11 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-[#1F1F1F] placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C831F] focus:border-transparent transition-all"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#1F1F1F] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            id="owner-login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#0C831F] hover:bg-[#0a6e1a] text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? "Authenticating..." : "Login to Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
};
