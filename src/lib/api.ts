import type { Restaurant, Category, MenuItem } from "../types";
import {
  supabase,
  isSupabaseConfigured,
  fetchMenuItemsFromSupabase,
  fetchCategoriesFromSupabase,
  fetchRestaurantFromSupabase,
  normalizeSupabaseMenuItem,
  insertMenuItemInSupabase,
  updateMenuItemInSupabase,
  deleteMenuItemFromSupabase,
  uploadImageToSupabaseStorage,
  uploadBase64ToSupabaseStorage,
  sendPasswordResetEmail,
  updateSupabasePassword,
  signInWithSupabaseAuth,
} from "./supabase";

const TOKEN_KEY = "aditya_restaurant_owner_token";
const EMAIL_KEY = "aditya_restaurant_owner_email";

export const api = {
  // Supabase status checker
  isUsingSupabase(): boolean {
    return isSupabaseConfigured();
  },

  // Session helpers
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setSession(token: string, email: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(EMAIL_KEY, email);
    } catch (e) {
      console.error("Storage error:", e);
    }
  },

  clearSession() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EMAIL_KEY);
    } catch (e) {
      console.error("Storage error:", e);
    }
  },

  getOwnerEmail(): string | null {
    try {
      return localStorage.getItem(EMAIL_KEY);
    } catch {
      return null;
    }
  },

  // Public Endpoints
  async getRestaurant(): Promise<Restaurant> {
    if (isSupabaseConfigured()) {
      try {
        const supabaseRestaurant = await fetchRestaurantFromSupabase();
        if (supabaseRestaurant) return supabaseRestaurant;
      } catch (err) {
        console.warn("Could not fetch restaurant from Supabase, using fallback:", err);
      }
    }
    try {
      const res = await fetch("/api/restaurant");
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.data) return json.data;
      }
    } catch {
      // Netlify / Static hosting fallback
    }

    try {
      const saved = localStorage.getItem("restaurant_profile");
      if (saved) return JSON.parse(saved);
    } catch {}

    return {
      id: "aditya_restaurant_01",
      name: "ADITYA RESTAURANT",
      subtitle: "Fresh • Delicious • Made With Love",
      address: "Station Road, Jaipur",
      phone: "+91 98765 43210",
      currency_symbol: "₹",
      logo_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80",
      cover_image_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    };
  },

  async getCategories(): Promise<Category[]> {
    let baseCategories: Category[] = [];
    if (isSupabaseConfigured()) {
      try {
        baseCategories = await fetchCategoriesFromSupabase();
      } catch (err) {
        console.error("Failed to load categories from Supabase:", err);
      }
    }

    // Load custom empty categories
    let customCats: Category[] = [];
    try {
      const saved = localStorage.getItem("custom_empty_categories");
      if (saved) {
        customCats = JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Could not read custom_empty_categories:", e);
    }

    // Combine them, avoiding duplicates by id or name
    const combined = [...baseCategories];
    customCats.forEach((lCat) => {
      const exists = combined.some(
        (c) =>
          c.id.toLowerCase().trim() === lCat.id.toLowerCase().trim() ||
          c.name.toLowerCase().trim() === lCat.name.toLowerCase().trim()
      );
      if (!exists) {
        combined.push(lCat);
      }
    });

    if (combined.length > 0) {
      return combined.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }

    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.data) return json.data;
      }
    } catch {}

    try {
      const saved = localStorage.getItem("restaurant_categories");
      if (saved) return JSON.parse(saved);
    } catch {}

    return [
      { id: "starter", name: "Starters", sort_order: 1 },
      { id: "main", name: "Main Course", sort_order: 2 },
      { id: "breads", name: "Breads", sort_order: 3 },
      { id: "desserts", name: "Desserts", sort_order: 4 },
      { id: "beverages", name: "Beverages", sort_order: 5 },
    ];
  },

  async getMenuItems(_availableOnly = false): Promise<MenuItem[]> {
    // Read directly from Supabase `menu_items` table (primary source of truth)
    try {
      const supabaseItems = await fetchMenuItemsFromSupabase();
      return supabaseItems;
    } catch (err: any) {
      console.error("Failed to fetch menu items from Supabase 'menu_items' table:", err);
      throw err;
    }
  },

  // Auth Endpoints
  async login(email: string, password: string): Promise<{ token: string; email: string }> {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try Supabase Auth
    if (isSupabaseConfigured()) {
      try {
        const { session, user, error } = await signInWithSupabaseAuth(cleanEmail, password);
        if (session && user) {
          const token = session.access_token;
          const userEmail = user.email || cleanEmail;
          this.setSession(token, userEmail);
          return { token, email: userEmail };
        }
        if (error && !error.includes("Invalid login credentials")) {
          console.warn("Supabase Auth sign-in message:", error);
        }
      } catch (sbErr) {
        console.warn("Supabase signIn exception:", sbErr);
      }
    }

    // 2. Try Server API backend
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          this.setSession(json.data.token, json.data.email);
          return json.data;
        }
        if (json.error) {
          throw new Error(json.error);
        }
      }
    } catch (err: any) {
      if (err.message && err.message.includes("Incorrect")) {
        throw err;
      }
    }

    // 3. Static Hosting / Netlify Client Authentication Fallback
    const storedEmail = (localStorage.getItem("owner_email") || "owner@gmail.com").toLowerCase().trim();
    const storedPass = localStorage.getItem("owner_password") || "admin123";

    if (cleanEmail === storedEmail && password === storedPass) {
      const clientToken = `token_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      this.setSession(clientToken, cleanEmail);
      return { token: clientToken, email: cleanEmail };
    }

    throw new Error("Incorrect email or password.");
  },

  /**
   * Request Supabase Password Reset Email
   */
  async sendPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      throw new Error("Please enter a valid registered email address.");
    }

    // 1. Supabase Auth password reset
    if (isSupabaseConfigured()) {
      try {
        const result = await sendPasswordResetEmail(cleanEmail);
        if (result.success) {
          return { success: true };
        }
        if (result.error) {
          throw new Error(result.error);
        }
      } catch (err: any) {
        console.warn("Supabase resetPasswordForEmail error:", err);
        throw new Error(err.message || "Failed to send password reset email.");
      }
    }

    return { success: true };
  },

  /**
   * Update password after clicking the reset link
   */
  async resetPassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!newPassword || newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters.");
    }

    // 1. Supabase Auth update password
    if (isSupabaseConfigured()) {
      try {
        const result = await updateSupabasePassword(newPassword);
        if (result.success) {
          // Sync with local state
          localStorage.setItem("owner_password", newPassword);
          return { success: true };
        }
        if (result.error) {
          throw new Error(result.error);
        }
      } catch (err: any) {
        console.warn("Supabase updateSupabasePassword error:", err);
        throw new Error(err.message || "Failed to update password in Supabase.");
      }
    }

    // Local fallback
    localStorage.setItem("owner_password", newPassword);
    return { success: true };
  },

  async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        // static hosting ignore
      }
    }
    this.clearSession();
  },

  async checkAuth(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.success !== undefined) return Boolean(json.success);
      }
    } catch {
      // static hosting ignore
    }
    return Boolean(token);
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const token = this.getToken();
    if (!token) throw new Error("Unauthorized");

    // Supabase update if configured
    if (isSupabaseConfigured()) {
      try {
        await updateSupabasePassword(newPassword);
      } catch (e) {
        console.warn("Supabase password update in settings:", e);
      }
    }

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) return;
        if (json.error) throw new Error(json.error);
      }
    } catch (err: any) {
      if (err.message && !err.message.includes("fetch")) {
        throw err;
      }
    }

    // Static Hosting / Netlify Fallback
    const storedPass = localStorage.getItem("owner_password") || "admin123";
    if (currentPassword !== storedPass) {
      throw new Error("Current password is incorrect");
    }
    localStorage.setItem("owner_password", newPassword);
  },

  // Owner Protected Actions
  async updateRestaurant(data: Partial<Restaurant>): Promise<Restaurant> {
    const token = this.getToken();
    if (!token) throw new Error("Unauthorized");

    try {
      const res = await fetch("/api/restaurant", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    } catch {}

    const existing = await this.getRestaurant();
    const updated = { ...existing, ...data };
    localStorage.setItem("restaurant_profile", JSON.stringify(updated));
    return updated;
  },

  async addCategory(name: string): Promise<Category> {
    const token = this.getToken();
    if (!token) throw new Error("Unauthorized");

    const cleanName = name.trim();
    const id = cleanName.toLowerCase().replace(/\s+/g, "_");

    if (isSupabaseConfigured()) {
      const newCat: Category = {
        id,
        name: cleanName,
        sort_order: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      try {
        let customCats: Category[] = [];
        const saved = localStorage.getItem("custom_empty_categories");
        if (saved) {
          customCats = JSON.parse(saved);
        }
        if (!customCats.some((c) => c.id === id)) {
          customCats.push(newCat);
          localStorage.setItem("custom_empty_categories", JSON.stringify(customCats));
        }
      } catch (e) {
        console.error("Storage error:", e);
      }

      // Fire background call to server just to keep things in sync if possible, but do not block or crash on it
      fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: cleanName }),
      }).catch(() => {});

      return newCat;
    }

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: cleanName }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to add category");
    return json.data;
  },

  async updateCategory(id: string, name: string): Promise<Category> {
    const token = this.getToken();
    if (!token) throw new Error("Unauthorized");

    const cleanName = name.trim();
    const newId = cleanName.toLowerCase().replace(/\s+/g, "_");

    if (isSupabaseConfigured()) {
      try {
        // 1. Rename category in Supabase for all dishes that currently belong to the old category ID/name
        if (supabase) {
          const { error } = await supabase
            .from("menu_items")
            .update({ category: newId })
            .eq("category", id);

          if (error) {
            console.error("Failed to rename category in Supabase menu_items:", error);
            throw new Error(`Supabase update failed: ${error.message}`);
          }
        }

        // 2. Update custom empty categories in localStorage
        let customCats: Category[] = [];
        const saved = localStorage.getItem("custom_empty_categories");
        if (saved) {
          customCats = JSON.parse(saved);
        }
        customCats = customCats.map((c) => {
          if (c.id === id) {
            return {
              ...c,
              id: newId,
              name: cleanName,
              updated_at: new Date().toISOString(),
            };
          }
          return c;
        });
        localStorage.setItem("custom_empty_categories", JSON.stringify(customCats));

        // 3. Fire-and-forget server sync in background
        fetch(`/api/categories/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: cleanName }),
        }).catch(() => {});

        return {
          id: newId,
          name: cleanName,
          sort_order: 10,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      } catch (err: any) {
        console.error("Failed to update category in Supabase flow:", err);
        throw err;
      }
    }

    const res = await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: cleanName }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to update category");
    return json.data;
  },

  async deleteCategory(id: string): Promise<void> {
    const token = this.getToken();
    if (!token) throw new Error("Unauthorized");

    if (isSupabaseConfigured()) {
      try {
        let customCats: Category[] = [];
        const saved = localStorage.getItem("custom_empty_categories");
        if (saved) {
          customCats = JSON.parse(saved);
        }
        customCats = customCats.filter((c) => c.id !== id);
        localStorage.setItem("custom_empty_categories", JSON.stringify(customCats));
      } catch (e) {
        console.error("Storage error:", e);
      }

      fetch(`/api/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});

      return;
    }

    const res = await fetch(`/api/categories/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to delete category");
  },

  saveItemMetadata(id: string, metadata: { description?: string; vegetarian?: boolean; prep_time?: number }) {
    try {
      const saved = localStorage.getItem("menu_item_metadata") || "{}";
      const data = JSON.parse(saved);
      data[id] = {
        ...(data[id] || {}),
        ...metadata,
      };
      localStorage.setItem("menu_item_metadata", JSON.stringify(data));
    } catch (e) {
      console.warn("Could not save menu item metadata to localStorage:", e);
    }
  },

  async addMenuItem(itemData: Omit<MenuItem, "id" | "created_at" | "updated_at">): Promise<MenuItem> {
    const token = this.getToken();
    if (!token) throw new Error("Unauthorized");

    // Try inserting directly to Supabase menu_items
    if (isSupabaseConfigured()) {
      try {
        const item = await insertMenuItemInSupabase({
          name: itemData.name,
          price: itemData.price,
          category: itemData.category_id || "General",
          image_url: itemData.image_url,
          available: itemData.available,
        });
        if (item) {
          // Save metadata locally for description, vegetarian preference, and preparation time
          this.saveItemMetadata(item.id, {
            description: itemData.description,
            vegetarian: itemData.vegetarian,
            prep_time: itemData.prep_time,
          });

          // Mix into returned object
          item.description = itemData.description;
          item.vegetarian = itemData.vegetarian;
          item.prep_time = itemData.prep_time;

          fetch("/api/menu-items", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(itemData),
          }).catch(() => {});
          return item;
        }
      } catch (err: any) {
        console.warn("Supabase insert error:", err);
      }
    }

    const res = await fetch("/api/menu-items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(itemData),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to add food item");
    return json.data;
  },

  async updateMenuItem(id: string, itemData: Partial<MenuItem>): Promise<MenuItem> {
    const token = this.getToken();
    if (!token) throw new Error("Unauthorized");

    if (isSupabaseConfigured()) {
      try {
        const item = await updateMenuItemInSupabase(id, {
          name: itemData.name,
          price: itemData.price,
          category: itemData.category_id,
          image_url: itemData.image_url,
          available: itemData.available,
        });
        if (item) {
          // Save metadata locally
          this.saveItemMetadata(item.id, {
            description: itemData.description,
            vegetarian: itemData.vegetarian,
            prep_time: itemData.prep_time,
          });

          // Mix into returned object
          if (itemData.description !== undefined) item.description = itemData.description;
          if (itemData.vegetarian !== undefined) item.vegetarian = itemData.vegetarian;
          if (itemData.prep_time !== undefined) item.prep_time = itemData.prep_time;

          fetch(`/api/menu-items/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(itemData),
          }).catch(() => {});
          return item;
        }
      } catch (err: any) {
        console.warn("Supabase update error:", err);
      }
    }

    const res = await fetch(`/api/menu-items/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(itemData),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to update food item");
    return json.data;
  },

  async updatePrice(id: string, price: number): Promise<MenuItem> {
    const token = this.getToken();
    if (!token) throw new Error("Unauthorized");

    if (isSupabaseConfigured()) {
      try {
        const item = await updateMenuItemInSupabase(id, { price });
        if (item) {
          fetch(`/api/menu-items/${id}/price`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ price }),
          }).catch(() => {});
          return item;
        }
      } catch (err: any) {
        console.warn("Supabase price update error:", err);
      }
    }

    const res = await fetch(`/api/menu-items/${id}/price`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ price }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to update price");
    return json.data;
  },

  async updateAvailability(id: string, available: boolean): Promise<MenuItem> {
    const token = this.getToken();
    if (!token) throw new Error("Unauthorized");

    if (isSupabaseConfigured()) {
      try {
        const item = await updateMenuItemInSupabase(id, { available });
        if (item) {
          fetch(`/api/menu-items/${id}/availability`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ available }),
          }).catch(() => {});
          return item;
        }
      } catch (err: any) {
        console.warn("Supabase availability update error:", err);
      }
    }

    const res = await fetch(`/api/menu-items/${id}/availability`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ available }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to update availability");
    return json.data;
  },

  async deleteMenuItem(id: string): Promise<void> {
    const token = this.getToken();
    if (!token) throw new Error("Unauthorized");

    if (isSupabaseConfigured()) {
      try {
        await deleteMenuItemFromSupabase(id);
      } catch (err) {
        console.warn("Supabase delete error:", err);
      }
    }

    const res = await fetch(`/api/menu-items/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to delete food item");
  },

  async uploadImage(file: File): Promise<string> {
    const token = this.getToken();
    if (!token) throw new Error("Unauthorized");

    // 1. Direct Supabase Storage Bucket Upload (menu-images / menu image)
    if (isSupabaseConfigured()) {
      try {
        const publicUrl = await uploadImageToSupabaseStorage(file);
        if (publicUrl) return publicUrl;
      } catch (err: any) {
        console.warn("Supabase storage upload error:", err);
        // If error is specific (like RLS or bucket issue), preserve message or propagate if appropriate
        if (err.message && err.message.includes("permissions required")) {
          throw err;
        }
      }
    }

    // 2. Server API fallback if running full-stack
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.url) return json.url;
      }
    } catch {}

    // 3. Client-side Data URL conversion fallback
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to process image"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(file);
    });
  },

  async uploadBase64(base64Data: string): Promise<string> {
    const token = this.getToken();
    if (!token) throw new Error("Unauthorized");

    // 1. Direct Supabase Storage Bucket Upload
    if (isSupabaseConfigured()) {
      try {
        const publicUrl = await uploadBase64ToSupabaseStorage(base64Data);
        if (publicUrl) return publicUrl;
      } catch (err: any) {
        console.warn("Supabase storage base64 upload error:", err);
        if (err.message && err.message.includes("permissions required")) {
          throw err;
        }
      }
    }

    // 2. Server API fallback
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ base64Data }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.url) return json.url;
      }
    } catch {}

    return base64Data;
  },
};
