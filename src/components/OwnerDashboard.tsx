import React, { useState } from "react";
import {
  Utensils,
  Plus,
  Layers,
  Settings,
  QrCode,
  LogOut,
  Eye,
  CheckCircle2,
  XCircle,
  FolderOpen,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import type { Restaurant, Category, MenuItem } from "../types";
import { api } from "../lib/api";
import { ManageFoodsTab } from "./ManageFoodsTab";
import { AddFoodTab } from "./AddFoodTab";
import { CategoriesTab } from "./CategoriesTab";
import { RestaurantSettingsTab } from "./RestaurantSettingsTab";
import { QrCodeTab } from "./QrCodeTab";

interface OwnerDashboardProps {
  restaurant: Restaurant;
  categories: Category[];
  menuItems: MenuItem[];
  onLogout: () => void;
  onRefresh: () => void;
  onViewMenu: () => void;
}

type TabType = "manage-foods" | "add-food" | "categories" | "settings" | "qr";

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  restaurant,
  categories,
  menuItems,
  onLogout,
  onRefresh,
  onViewMenu,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("manage-foods");

  const totalFoods = menuItems.length;
  const availableFoods = menuItems.filter((i) => i.available).length;
  const unavailableFoods = menuItems.filter((i) => !i.available).length;

  const handleLogoutClick = async () => {
    await api.logout();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-[#1F1F1F] flex flex-col items-center">
      <div className="w-full max-w-4xl min-h-screen flex flex-col shadow-xs pb-12">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0C831F] text-white flex items-center justify-center font-bold shadow-xs">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                  Owner Portal
                </span>
              </div>
              <h1 className="text-base font-black text-[#1F1F1F] tracking-tight truncate max-w-[200px] sm:max-w-xs">
                {restaurant.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onViewMenu}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-[#1F1F1F] hover:bg-gray-50 text-xs font-bold transition-all cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Customer View</span>
            </button>

            <button
              id="owner-logout-btn"
              onClick={handleLogoutClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Dashboard Title & Overview Banner */}
        <div className="px-4 sm:px-6 pt-5">
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#1F1F1F] tracking-tight">
                Manage Your Restaurant
              </h2>
              <p className="text-xs sm:text-sm text-[#686868]">
                Changes update instantly on your live customer digital menu
              </p>
            </div>
            <button
              onClick={onViewMenu}
              className="sm:hidden self-start inline-flex items-center gap-1 text-xs font-bold text-[#0C831F]"
            >
              <span>Preview Customer Menu</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Quick Metrics / Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-[#686868] mb-1">
                <span>Total Foods</span>
                <Utensils className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-[#1F1F1F]">{totalFoods}</p>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-[#686868] mb-1">
                <span>Available</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0C831F]" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-[#0C831F]">{availableFoods}</p>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-[#686868] mb-1">
                <span>Unavailable</span>
                <XCircle className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-gray-600">{unavailableFoods}</p>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-[#686868] mb-1">
                <span>Categories</span>
                <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-[#1F1F1F]">{categories.length}</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mb-6 border-b border-gray-200">
            <button
              id="tab-manage-foods"
              onClick={() => setActiveTab("manage-foods")}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "manage-foods"
                  ? "bg-[#1F1F1F] text-white shadow-xs"
                  : "bg-white text-[#686868] hover:bg-gray-50 border border-gray-200"
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>Manage Foods</span>
            </button>

            <button
              id="tab-add-food"
              onClick={() => setActiveTab("add-food")}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "add-food"
                  ? "bg-[#0C831F] text-white shadow-xs"
                  : "bg-white text-[#686868] hover:bg-gray-50 border border-gray-200"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Food</span>
            </button>

            <button
              id="tab-categories"
              onClick={() => setActiveTab("categories")}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "categories"
                  ? "bg-[#1F1F1F] text-white shadow-xs"
                  : "bg-white text-[#686868] hover:bg-gray-50 border border-gray-200"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Categories</span>
            </button>

            <button
              id="tab-qr"
              onClick={() => setActiveTab("qr")}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "qr"
                  ? "bg-[#1F1F1F] text-white shadow-xs"
                  : "bg-white text-[#686868] hover:bg-gray-50 border border-gray-200"
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>QR Code</span>
            </button>

            <button
              id="tab-settings"
              onClick={() => setActiveTab("settings")}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "settings"
                  ? "bg-[#1F1F1F] text-white shadow-xs"
                  : "bg-white text-[#686868] hover:bg-gray-50 border border-gray-200"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Restaurant Settings</span>
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        <main className="px-4 sm:px-6 flex-1">
          {activeTab === "manage-foods" && (
            <ManageFoodsTab
              menuItems={menuItems}
              categories={categories}
              restaurant={restaurant}
              onRefresh={onRefresh}
              onNavigateToAddFood={() => setActiveTab("add-food")}
            />
          )}

          {activeTab === "add-food" && (
            <AddFoodTab
              categories={categories}
              restaurant={restaurant}
              onSuccess={() => {
                onRefresh();
                setActiveTab("manage-foods");
              }}
              onCancel={() => setActiveTab("manage-foods")}
            />
          )}

          {activeTab === "categories" && (
            <CategoriesTab
              categories={categories}
              menuItems={menuItems}
              onRefresh={onRefresh}
            />
          )}

          {activeTab === "qr" && <QrCodeTab restaurant={restaurant} />}

          {activeTab === "settings" && (
            <RestaurantSettingsTab restaurant={restaurant} onRefresh={onRefresh} />
          )}
        </main>
      </div>
    </div>
  );
};
