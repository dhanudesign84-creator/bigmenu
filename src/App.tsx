import React, { useState, useEffect, useCallback } from "react";
import type { Restaurant, Category, MenuItem } from "./types";
import { api } from "./lib/api";
import { onSupabaseAuthStateChange } from "./lib/supabase";
import { CustomerIntro } from "./components/CustomerIntro";
import { CustomerMenu } from "./components/CustomerMenu";
import { OwnerLogin } from "./components/OwnerLogin";
import { OwnerDashboard } from "./components/OwnerDashboard";
import { ResetPassword } from "./components/ResetPassword";

export default function App() {
  // Navigation State: "/" -> "menu", "/login" -> "owner-login", "/admin" -> "owner-dashboard"
  const [currentRoute, setCurrentRoute] = useState<"menu" | "owner-login" | "owner-dashboard" | "owner-reset-password">(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash || "";
      const search = window.location.search || "";

      if (path.includes("reset-password") || hash.includes("type=recovery") || search.includes("type=recovery")) {
        return "owner-reset-password";
      }
      if (path === "/admin" || path.startsWith("/admin/") || path.includes("/owner/dashboard")) {
        return "owner-dashboard";
      }
      if (path === "/login" || path.startsWith("/login/") || path === "/owner" || path.startsWith("/owner/login") || path.startsWith("/owner/")) {
        return "owner-login";
      }
    }
    // Default public route is ALWAYS the Customer Menu at "/"
    return "menu";
  });

  // Data states
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(false);

  // Customer Intro animation state (only for customer menu)
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname.toLowerCase();
      return path === "/" || path === "/menu" || path === "";
    }
    return true;
  });

  // Navigation handlers
  const navigateTo = useCallback((route: "menu" | "owner-login" | "owner-dashboard" | "owner-reset-password", replace = false) => {
    setCurrentRoute(route);
    let targetPath = "/";
    if (route === "owner-login") targetPath = "/login";
    if (route === "owner-dashboard") targetPath = "/admin";
    if (route === "owner-reset-password") targetPath = "/reset-password";

    if (typeof window !== "undefined" && window.location.pathname !== targetPath) {
      if (replace) {
        window.history.replaceState({}, "", targetPath);
      } else {
        window.history.pushState({}, "", targetPath);
      }
    }
  }, []);

  // Listen for Supabase PASSWORD_RECOVERY event
  useEffect(() => {
    const { unsubscribe } = onSupabaseAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setCurrentRoute("owner-reset-password");
        if (typeof window !== "undefined" && window.location.pathname !== "/reset-password") {
          window.history.pushState({}, "", "/reset-password");
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Listen for browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash || "";
      const search = window.location.search || "";

      if (path.includes("reset-password") || hash.includes("type=recovery") || search.includes("type=recovery")) {
        setCurrentRoute("owner-reset-password");
      } else if (path === "/admin" || path.startsWith("/admin/") || path.includes("/owner/dashboard")) {
        setCurrentRoute("owner-dashboard");
      } else if (path === "/login" || path.startsWith("/login/") || path === "/owner" || path.startsWith("/owner/login") || path.startsWith("/owner/")) {
        setCurrentRoute("owner-login");
      } else {
        setCurrentRoute("menu");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Load all restaurant database data (publicly readable for customer menu)
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

  // Auth protection for /admin route: redirect unauthenticated users to /login
  useEffect(() => {
    if (currentRoute === "owner-dashboard") {
      let isMounted = true;
      setAuthChecking(true);
      const verifyAuth = async () => {
        try {
          const isAuth = await api.checkAuth();
          if (!isAuth && isMounted) {
            // Unauthenticated user trying to access /admin -> redirect to /login
            navigateTo("owner-login", true);
          }
        } catch (e) {
          if (isMounted) {
            navigateTo("owner-login", true);
          }
        } finally {
          if (isMounted) {
            setAuthChecking(false);
          }
        }
      };
      verifyAuth();
      return () => {
        isMounted = false;
      };
    } else {
      setAuthChecking(false);
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
      {/* 1. Public Customer Restaurant Menu: "/" */}
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

      {/* 2. Restaurant Owner Login: "/login" */}
      {currentRoute === "owner-login" && (
        <OwnerLogin
          onLoginSuccess={() => navigateTo("owner-dashboard")}
          onBackToMenu={() => navigateTo("menu")}
          onOpenResetPassword={() => navigateTo("owner-reset-password")}
        />
      )}

      {/* 3. Password Recovery: "/reset-password" */}
      {currentRoute === "owner-reset-password" && (
        <ResetPassword
          onBackToLogin={() => navigateTo("owner-login")}
          onSuccess={() => navigateTo("owner-login")}
        />
      )}

      {/* 4. Protected Owner Management Dashboard: "/admin" */}
      {currentRoute === "owner-dashboard" && (
        authChecking ? (
          <div className="min-h-screen bg-[#F7F7F7] flex flex-col items-center justify-center p-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center animate-pulse mb-3">
              <div className="w-5 h-5 border-2 border-amber-800 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-sm font-semibold text-[#1F1F1F]">Checking Owner Authorization...</p>
          </div>
        ) : restaurant ? (
          <OwnerDashboard
            restaurant={restaurant}
            categories={categories}
            menuItems={menuItems}
            onLogout={() => navigateTo("owner-login", true)}
            onRefresh={loadData}
            onViewMenu={() => navigateTo("menu")}
          />
        ) : null
      )}
    </div>
  );
}
