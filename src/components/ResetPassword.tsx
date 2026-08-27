import React, { useState, useEffect } from "react";
import { Lock, KeyRound, Eye, EyeOff, Check, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { api } from "../lib/api";

interface ResetPasswordProps {
  onBackToLogin: () => void;
  onSuccess: () => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ onBackToLogin, onSuccess }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);

  // Check URL error params if recovery link expired or invalid
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash || "";
      const search = window.location.search || "";
      const fullUrl = hash + search;

      if (fullUrl.includes("error_description")) {
        const match = fullUrl.match(/error_description=([^&]+)/);
        if (match && match[1]) {
          setErrorMessage(decodeURIComponent(match[1].replace(/\+/g, " ")));
        }
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!newPassword) {
      setErrorMessage("Please enter your new password.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-check and try again.");
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(newPassword);
      setIsCompleted(true);
      // Clean URL hash
      if (typeof window !== "undefined" && window.history.replaceState) {
        window.history.replaceState({}, "", "/login");
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || "Failed to update password. Your reset link may have expired. Please request a new one."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col justify-center items-center px-4 py-8">
      {/* Back to Login */}
      <button
        onClick={onBackToLogin}
        className="mb-6 inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#686868] hover:text-[#1F1F1F] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Owner Login</span>
      </button>

      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-200/80 shadow-lg p-6 sm:p-8">
        {isCompleted ? (
          /* Success Card */
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 text-[#0C831F] flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#1F1F1F] tracking-tight">Password Reset Complete!</h2>
              <p className="text-xs sm:text-sm text-[#686868] mt-1.5 leading-relaxed">
                Your owner password has been successfully updated in Supabase Auth. You can now log in with your new credentials.
              </p>
            </div>

            <div className="pt-3">
              <button
                onClick={() => {
                  onSuccess();
                  onBackToLogin();
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-[#0C831F] hover:bg-[#0a6e1a] text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Return to Owner Login</span>
              </button>
            </div>
          </div>
        ) : (
          /* Create New Password Form */
          <div>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F8CB46] text-[#1F1F1F] flex items-center justify-center font-bold shadow-md mb-3">
                <KeyRound className="w-7 h-7 stroke-[2.2]" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold mb-2">
                <Sparkles className="w-3 h-3" />
                Supabase Auth Recovery
              </div>
              <h1 className="text-2xl font-black text-[#1F1F1F] tracking-tight">Create New Password</h1>
              <p className="text-xs sm:text-sm text-[#686868] mt-1">
                Enter your new password below to secure your owner account.
              </p>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-[#1F1F1F] placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C831F] focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#1F1F1F] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-[#1F1F1F] placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C831F] focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#1F1F1F] cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Requirements hint */}
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-[11px] text-[#686868] space-y-1">
                <div className={`flex items-center gap-1.5 ${newPassword.length >= 6 ? "text-emerald-700 font-medium" : ""}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 6 ? "bg-emerald-500" : "bg-gray-300"}`} />
                  <span>Must be at least 6 characters long</span>
                </div>
                <div className={`flex items-center gap-1.5 ${newPassword && confirmPassword && newPassword === confirmPassword ? "text-emerald-700 font-medium" : ""}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${newPassword && confirmPassword && newPassword === confirmPassword ? "bg-emerald-500" : "bg-gray-300"}`} />
                  <span>Both passwords must match</span>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#0C831F] hover:bg-[#0a6e1a] text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Set New Password</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
