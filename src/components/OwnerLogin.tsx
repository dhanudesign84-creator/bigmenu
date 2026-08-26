import React, { useState } from "react";
import { Lock, Mail, Eye, EyeOff, ArrowLeft, KeyRound, CheckCircle2, Loader2, Sparkles, Send, HelpCircle, AlertCircle } from "lucide-react";
import { api } from "../lib/api";

interface OwnerLoginProps {
  onLoginSuccess: () => void;
  onBackToMenu: () => void;
  onOpenResetPassword?: () => void;
}

export const OwnerLogin: React.FC<OwnerLoginProps> = ({ onLoginSuccess, onBackToMenu }) => {
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
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

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!resetEmail.trim()) {
      setErrorMessage("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    try {
      await api.sendPasswordReset(resetEmail.trim());
      setResetSuccess(true);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to send password reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchToLogin = () => {
    setMode("login");
    setErrorMessage("");
    setResetSuccess(false);
  };

  const switchToForgot = () => {
    setMode("forgot");
    setErrorMessage("");
    setResetSuccess(false);
    if (email) setResetEmail(email);
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
        {mode === "login" ? (
          /* ---------------- OWNER LOGIN VIEW ---------------- */
          <>
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
                className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="owner-password-input"
                    className="block text-xs font-bold uppercase tracking-wider text-[#1F1F1F]"
                  >
                    Owner Password
                  </label>
                  <button
                    type="button"
                    onClick={switchToForgot}
                    className="text-xs font-semibold text-[#0C831F] hover:text-[#0a6e1a] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
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
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>Login to Dashboard</span>
                )}
              </button>
            </form>
          </>
        ) : (
          /* ---------------- FORGOT PASSWORD VIEW ---------------- */
          <>
            {resetSuccess ? (
              /* Success confirmation state */
              <div className="text-center py-2 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 text-[#0C831F] flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[#1F1F1F] tracking-tight">Check Your Email</h2>
                  <p className="text-xs sm:text-sm text-[#686868] mt-1.5 leading-relaxed">
                    We've sent a secure password reset link to:
                  </p>
                  <p className="font-semibold text-xs sm:text-sm text-[#1F1F1F] mt-1 bg-gray-50 py-1.5 px-3 rounded-lg inline-block border border-gray-100">
                    {resetEmail}
                  </p>
                  <p className="text-[11px] text-[#686868] mt-3">
                    Click the link inside the email to create your new password.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={switchToLogin}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#0C831F] hover:bg-[#0a6e1a] text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Owner Login</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Password Reset Request Form */
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-[#0C831F] flex items-center justify-center font-bold shadow-xs mb-3">
                    <Mail className="w-7 h-7 stroke-[2.2]" />
                  </div>
                  <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full mb-1.5">
                    <Sparkles className="w-3 h-3" />
                    Supabase Authentication
                  </div>
                  <h1 className="text-2xl font-black text-[#1F1F1F] tracking-tight">Forgot Password?</h1>
                  <p className="text-xs sm:text-sm text-[#686868] mt-1">
                    Enter your registered owner email to receive a secure reset link.
                  </p>
                </div>

                {/* Error Alert */}
                {errorMessage && (
                  <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="owner-reset-email-input"
                      className="block text-xs font-bold uppercase tracking-wider text-[#1F1F1F] mb-1.5"
                    >
                      Registered Owner Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="owner-reset-email-input"
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="e.g. owner@gmail.com"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-[#1F1F1F] placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C831F] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#0C831F] hover:bg-[#0a6e1a] text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Reset Email...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Password Reset Link</span>
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={switchToLogin}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#686868] hover:text-[#1F1F1F] transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Login</span>
                    </button>
                  </div>
                </form>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

