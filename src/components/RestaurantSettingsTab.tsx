import React, { useState } from "react";
import { Store, Save, Lock, Image as ImageIcon, MapPin, Phone, Check, AlertCircle } from "lucide-react";
import type { Restaurant } from "../types";
import { api } from "../lib/api";

interface RestaurantSettingsTabProps {
  restaurant: Restaurant;
  onRefresh: () => void;
}

export const RestaurantSettingsTab: React.FC<RestaurantSettingsTabProps> = ({
  restaurant,
  onRefresh,
}) => {
  const [name, setName] = useState(restaurant.name || "");
  const [subtitle, setSubtitle] = useState(restaurant.subtitle || "");
  const [address, setAddress] = useState(restaurant.address || "");
  const [phone, setPhone] = useState(restaurant.phone || "");
  const [currency, setCurrency] = useState(restaurant.currency_symbol || "₹");
  const [coverUrl, setCoverUrl] = useState(restaurant.cover_image_url || "");

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!name.trim()) {
      setMessage({ type: "error", text: "Restaurant name cannot be empty." });
      return;
    }

    setSavingProfile(true);
    try {
      await api.updateRestaurant({
        name: name.trim(),
        subtitle: subtitle.trim(),
        address: address.trim(),
        phone: phone.trim(),
        currency_symbol: currency.trim() || "₹",
        cover_image_url: coverUrl.trim(),
      });
      onRefresh();
      setMessage({ type: "success", text: "Restaurant profile saved to database!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update restaurant profile." });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!currentPassword || !newPassword) {
      setMessage({ type: "error", text: "Please provide both current and new password." });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New password and confirmation do not match." });
      return;
    }

    setChangingPassword(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage({ type: "success", text: "Owner password updated securely." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to change password." });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {message && (
        <div
          className={`p-3.5 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.type === "success" ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Restaurant Profile Card */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-7 shadow-xs">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-[#F8CB46] text-[#1F1F1F] flex items-center justify-center font-bold">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#1F1F1F]">Restaurant Information</h2>
            <p className="text-xs text-[#686868]">
              Manage the single restaurant brand, tagline, and contact info
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
              Restaurant Name *
            </label>
            <input
              id="settings-restaurant-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ADITYA RESTAURANT"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-[#1F1F1F] focus:bg-white focus:ring-2 focus:ring-[#0C831F] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
              Restaurant Subtitle / Tagline
            </label>
            <input
              id="settings-restaurant-subtitle"
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. Fresh • Delicious • Made With Love"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-[#1F1F1F] focus:bg-white focus:ring-2 focus:ring-[#0C831F] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
                Address / Location
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  id="settings-restaurant-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Station Road, Jaipur"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-[#1F1F1F] focus:bg-white focus:ring-2 focus:ring-[#0C831F] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  id="settings-restaurant-phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-[#1F1F1F] focus:bg-white focus:ring-2 focus:ring-[#0C831F] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
              Currency Symbol
            </label>
            <input
              id="settings-restaurant-currency"
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-24 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-black text-[#0C831F] focus:bg-white focus:ring-2 focus:ring-[#0C831F] focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              id="save-restaurant-settings-btn"
              type="submit"
              disabled={savingProfile}
              className="px-6 py-3 rounded-xl bg-[#0C831F] hover:bg-[#0a6e1a] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{savingProfile ? "Saving to Database..." : "Save Restaurant Settings"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Security & Password Card */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-7 shadow-xs">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-gray-100 text-[#1F1F1F] flex items-center justify-center font-bold">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#1F1F1F]">Owner Security</h2>
            <p className="text-xs text-[#686868]">Update your owner login credentials securely</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-[#1F1F1F] focus:bg-white focus:ring-2 focus:ring-[#0C831F] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
              New Password (min 6 chars)
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-[#1F1F1F] focus:bg-white focus:ring-2 focus:ring-[#0C831F] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-[#1F1F1F] focus:bg-white focus:ring-2 focus:ring-[#0C831F] focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={changingPassword}
              className="px-6 py-2.5 rounded-xl bg-[#1F1F1F] hover:bg-black text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {changingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
