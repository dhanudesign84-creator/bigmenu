import React, { useState, useEffect, useCallback } from "react";
import type { Restaurant, Category, MenuItem } from "./types";
import { api } from "./lib/api";
import { CustomerIntro } from "./components/CustomerIntro";
import { CustomerMenu } from "./components/CustomerMenu";
import { OwnerLogin } from "./components/OwnerLogin";
import { OwnerDashboard } from "./components/OwnerDashboard";

export default function App() {
  // Navigation State
  const [currentRoute, setCurrentRoute] = useState<"menu" | "owner-login" | "owner-dashboard">(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path.includes("/owner/dashboard")) return "owner-dashboard";
      if (path.includes("/owner")) return "owner-login";
    }
    return "menu";
  });

  // Data states
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Customer Intro animation state
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    // Only show intro if visiting the customer menu
    if (typeof window !== "undefined") {
      return !window.location.pathname.includes("/owner");
    }
    return true;
  });

  // Navigation handlers
  const navigateTo = useCallback((route: "menu" | "owner-login" | "owner-dashboard") => {
    setCurrentRoute(route);
    let targetPath = "/menu";
    if (route === "owner-login") targetPath = "/owner/login";
    if (route === "owner-dashboard") targetPath = "/owner/dashboard";

    if (typeof window !== "undefined" && window.location.pathname !== targetPath) {
      window.history.pushState({}, "", targetPath);
    }
  }, []);

  // Listen for browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.includes("/owner/dashboard")) {
        setCurrentRoute("owner-dashboard");
      } else if (path.includes("/owner")) {
        setCurrentRoute("owner-login");
      } else {
        setCurrentRoute("menu");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Load all restaurant database data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [restData, catData, itemsData] = await Promise.all([
        api.getRestaurant().catch((err) => {
          console.warn("Restaurant info fetch error:", err);
          return null;
        }),
        api.getCategories().catch((err) => {
          console.warn("Categories fetch error:", err);
          return [];
        }),
        api.getMenuItems().catch((err) => {
          console.error("Supabase menu_items fetch error in customer menu:", err);
          throw err;
        }),
      ]);
      if (restData) setRestaurant(restData);
      setCategories(catData || []);
      setMenuItems(itemsData || []);
    } catch (err: any) {
      console.error("Customer Menu failed to load data:", err);
      setError(err?.message || "Could not load menu items. Please check console for details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auth protection for /owner/dashboard
  useEffect(() => {
    if (currentRoute === "owner-dashboard") {
      const checkSession = async () => {
        const isAuth = await api.checkAuth();
        if (!isAuth) {
          navigateTo("owner-login");
        }
      };
      checkSession();
    }
  }, [currentRoute, navigateTo]);

  // Handle Intro Auto-complete after ~1.4 seconds if customer hasn't tapped yet
  useEffect(() => {
    if (showIntro && currentRoute === "menu") {
      const timer = setTimeout(() => {
        setShowIntro(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showIntro, currentRoute]);

  return (
    <div className="min-h-screen bg-[#F7F7F7] font-sans antialiased text-[#1F1F1F]">
      {/* Error notification banner */}
      {error && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-red-600 text-white text-xs font-semibold shadow-lg">
          {error}
        </div>
      )}

      {/* Customer Opening Experience (Short Restaurant Intro) */}
      {showIntro && restaurant && currentRoute === "menu" && (
        <CustomerIntro
          restaurant={restaurant}
          onComplete={() => setShowIntro(false)}
        />
      )}

      {/* Route Views */}
      {currentRoute === "menu" && (
        <CustomerMenu
          restaurant={restaurant}
          categories={categories}
          menuItems={menuItems}
          loading={loading}
          onNavigateToOwner={() => navigateTo("owner-login")}
          onRefresh={loadData}
        />
      )}

      {currentRoute === "owner-login" && (
        <OwnerLogin
          onLoginSuccess={() => navigateTo("owner-dashboard")}
          onBackToMenu={() => navigateTo("menu")}
        />
      )}

      {currentRoute === "owner-dashboard" && restaurant && (
        <OwnerDashboard
          restaurant={restaurant}
          categories={categories}
          menuItems={menuItems}
          onLogout={() => navigateTo("owner-login")}
          onRefresh={loadData}
          onViewMenu={() => navigateTo("menu")}
        />
      )}
    </div>
  );
}
