import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { MenuItem, Category, Restaurant } from "../types";

// Default credentials provided for this restaurant project
const DEFAULT_SUPABASE_URL = "https://nksqqsbfuunswyhgpnrj.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_k_kzHqgp7lyT1QiRzY_0MA_kzJFUI55";

function cleanSupabaseUrl(url: string): string {
  if (!url) return "";
  return url.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
}

// Helper to extract Supabase URL and Publishable/Anon Key from various env or config sources
export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const url =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) ||
    (typeof import.meta !== "undefined" && (import.meta.env as any)?.SUPABASE_URL) ||
    (typeof window !== "undefined" && (window as any).__SUPABASE_URL__) ||
    (typeof window !== "undefined" && localStorage.getItem("supabase_url")) ||
    DEFAULT_SUPABASE_URL;

  const anonKey =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY) ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_KEY) ||
    (typeof import.meta !== "undefined" && (import.meta.env as any)?.SUPABASE_ANON_KEY) ||
    (typeof import.meta !== "undefined" && (import.meta.env as any)?.SUPABASE_PUBLISHABLE_KEY) ||
    (typeof window !== "undefined" && (window as any).__SUPABASE_ANON_KEY__) ||
    (typeof window !== "undefined" && localStorage.getItem("supabase_anon_key")) ||
    DEFAULT_SUPABASE_ANON_KEY;

  return {
    url: cleanSupabaseUrl(String(url)),
    anonKey: String(anonKey).trim(),
  };
}

let supabaseInstance: SupabaseClient | null = null;
let configFetchPromise: Promise<void> | null = null;

// Initialize Supabase Client if credentials are present
const { url: initialUrl, anonKey: initialKey } = getSupabaseCredentials();
if (initialUrl && initialKey) {
  try {
    supabaseInstance = createClient(initialUrl, initialKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
  }
}

/**
 * Fetch server configuration if env variables weren't bundled at build time
 */
export async function ensureSupabaseInitialized(): Promise<SupabaseClient | null> {
  if (supabaseInstance) return supabaseInstance;

  if (configFetchPromise) {
    await configFetchPromise;
    return supabaseInstance;
  }

  configFetchPromise = (async () => {
    try {
      const res = await fetch("/api/config");
      if (res.ok) {
        const data = await res.json();
        if (data && data.supabaseUrl && data.supabaseAnonKey) {
          const url = cleanSupabaseUrl(data.supabaseUrl);
          const anonKey = data.supabaseAnonKey.trim();
          supabaseInstance = createClient(url, anonKey, {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
            },
          });
        }
      }
    } catch (e) {
      // Ignore network fetch error if offline or during build
    }
  })();

  await configFetchPromise;
  if (!supabaseInstance) {
    const { url, anonKey } = getSupabaseCredentials();
    if (url && anonKey) {
      supabaseInstance = createClient(url, anonKey);
    }
  }
  return supabaseInstance;
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean((url && anonKey) || supabaseInstance);
}

export const supabase: SupabaseClient | null = supabaseInstance;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseInstance) {
    const { url, anonKey } = getSupabaseCredentials();
    if (url && anonKey) {
      try {
        supabaseInstance = createClient(url, anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          },
        });
      } catch (e) {
        console.error("Error creating Supabase client instance:", e);
      }
    }
  }
  return supabaseInstance;
}

/**
 * Helper to normalize raw database records from the `menu_items` table
 * into the application's MenuItem interface.
 */
export function normalizeSupabaseMenuItem(row: Record<string, any>): MenuItem {
  // Category field resolution
  let categoryVal = "General";
  if (row.category !== undefined && row.category !== null && String(row.category).trim() !== "") {
    categoryVal = String(row.category).trim();
  } else if (row.category_id !== undefined && row.category_id !== null && String(row.category_id).trim() !== "") {
    categoryVal = String(row.category_id).trim();
  } else if (row.category_name !== undefined && row.category_name !== null && String(row.category_name).trim() !== "") {
    categoryVal = String(row.category_name).trim();
  }

  // Price field resolution
  let price = 0;
  if (typeof row.price === "number") {
    price = row.price;
  } else if (typeof row.price === "string") {
    price = parseFloat(row.price) || 0;
  } else if (typeof row.cost === "number" || typeof row.cost === "string") {
    price = parseFloat(String(row.cost)) || 0;
  } else if (typeof row.amount === "number" || typeof row.amount === "string") {
    price = parseFloat(String(row.amount)) || 0;
  }

  // Name field resolution
  const name = String(row.name || row.title || row.dish_name || row.item_name || "Food Item").trim();

  // Description field resolution
  const description = String(row.description || row.desc || row.details || `Delicious freshly prepared ${name}`).trim();

  // Image URL field resolution (fallback to fresh food image if null/empty)
  let imageUrl = row.image_url || row.image || row.photo_url || row.img_url || row.imageUrl || row.cover_image;
  if (!imageUrl || imageUrl === "null" || imageUrl === "undefined" || String(imageUrl).trim() === "") {
    imageUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
  } else {
    imageUrl = String(imageUrl).trim();
  }

  // Availability field resolution
  let available = true;
  if (row.available !== undefined && row.available !== null) {
    available =
      row.available === true ||
      row.available === "true" ||
      row.available === 1 ||
      row.available === "t";
  } else if (row.is_available !== undefined && row.is_available !== null) {
    available =
      row.is_available === true ||
      row.is_available === "true" ||
      row.is_available === 1 ||
      row.is_available === "t";
  } else if (row.status !== undefined && row.status !== null) {
    available = String(row.status).toLowerCase() === "available" || String(row.status).toLowerCase() === "active";
  }

  // Vegetarian field resolution (default true)
  let vegetarian = true;
  if (row.vegetarian !== undefined && row.vegetarian !== null) {
    vegetarian =
      row.vegetarian === true ||
      row.vegetarian === "true" ||
      row.vegetarian === 1 ||
      row.vegetarian === "t";
  } else if (row.is_vegetarian !== undefined && row.is_vegetarian !== null) {
    vegetarian =
      row.is_vegetarian === true ||
      row.is_vegetarian === "true" ||
      row.is_vegetarian === 1 ||
      row.is_vegetarian === "t";
  } else if (row.is_veg !== undefined && row.is_veg !== null) {
    vegetarian =
      row.is_veg === true ||
      row.is_veg === "true" ||
      row.is_veg === 1 ||
      row.is_veg === "t";
  } else if (row.type !== undefined && row.type !== null) {
    vegetarian = String(row.type).toLowerCase() === "veg" || String(row.type).toLowerCase() === "vegetarian";
  }

  return {
    id: String(row.id ?? `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`),
    restaurant_id: String(row.restaurant_id || "aditya_restaurant_01"),
    name,
    description,
    price,
    category_id: categoryVal,
    image_url: imageUrl,
    available,
    vegetarian,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Reads all menu items from the Supabase `menu_items` table.
 */
export async function fetchMenuItemsFromSupabase(): Promise<MenuItem[]> {
  const client = (await ensureSupabaseInitialized()) || getSupabase();
  if (!client) {
    const err = new Error("Supabase is not configured.");
    console.error("Supabase Error:", err.message);
    throw err;
  }

  const { data, error } = await client.from("menu_items").select("*");

  if (error) {
    console.error("Supabase request failed on 'menu_items' table:", error);
    throw new Error(`Supabase query failed: ${error.message || JSON.stringify(error)}`);
  }

  if (!data) {
    return [];
  }

  return data.map(normalizeSupabaseMenuItem);
}

/**
 * Adds a new food item into Supabase `menu_items`
 */
export async function insertMenuItemInSupabase(item: {
  name: string;
  price: number;
  category: string;
  image_url?: string | null;
  available?: boolean;
}): Promise<MenuItem | null> {
  const client = (await ensureSupabaseInitialized()) || getSupabase();
  if (!client) return null;

  const payload: Record<string, any> = {
    name: item.name.trim(),
    price: Number(item.price),
    category: item.category.trim(),
    image_url: item.image_url ? String(item.image_url).trim() : null,
    available: item.available !== undefined ? Boolean(item.available) : true,
  };

  const { data, error } = await client.from("menu_items").insert([payload]).select().single();

  if (error) {
    console.error("Supabase insert error on 'menu_items':", error);
    if (error.code === "42501") {
      console.warn("Supabase RLS Policy Note: To allow direct insert via publishable key, run 'CREATE POLICY \"Allow anon all\" ON public.menu_items FOR ALL USING (true) WITH CHECK (true);' in Supabase SQL editor.");
    }
    throw new Error(`Supabase insert failed: ${error.message}`);
  }

  return data ? normalizeSupabaseMenuItem(data) : null;
}

/**
 * Updates a food item in Supabase `menu_items`
 */
export async function updateMenuItemInSupabase(
  id: string,
  updates: {
    name?: string;
    price?: number;
    category?: string;
    image_url?: string | null;
    available?: boolean;
  }
): Promise<MenuItem | null> {
  const client = (await ensureSupabaseInitialized()) || getSupabase();
  if (!client) return null;

  const payload: Record<string, any> = {};
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.price !== undefined) payload.price = Number(updates.price);
  if (updates.category !== undefined) payload.category = updates.category.trim();
  if (updates.image_url !== undefined) payload.image_url = updates.image_url ? String(updates.image_url).trim() : null;
  if (updates.available !== undefined) payload.available = Boolean(updates.available);

  const { data, error } = await client.from("menu_items").update(payload).eq("id", id).select().single();

  if (error) {
    console.error("Supabase update error on 'menu_items':", error);
    throw new Error(`Supabase update failed: ${error.message}`);
  }

  return data ? normalizeSupabaseMenuItem(data) : null;
}

/**
 * Deletes a food item from Supabase `menu_items`
 */
export async function deleteMenuItemFromSupabase(id: string): Promise<boolean> {
  const client = (await ensureSupabaseInitialized()) || getSupabase();
  if (!client) return false;

  const { error } = await client.from("menu_items").delete().eq("id", id);

  if (error) {
    console.error("Supabase delete error on 'menu_items':", error);
    throw new Error(`Supabase delete failed: ${error.message}`);
  }

  return true;
}

/**
 * Attempts to fetch categories from Supabase `categories` table,
 * or derives unique categories from `menu_items`.
 */
export async function fetchCategoriesFromSupabase(): Promise<Category[]> {
  const client = (await ensureSupabaseInitialized()) || getSupabase();
  if (!client) return [];

  try {
    const { data, error } = await client.from("categories").select("*");
    if (!error && data && data.length > 0) {
      return data.map((c: any, index: number) => ({
        id: String(c.id || `cat_${index}`),
        name: String(c.name || c.title || "Category"),
        sort_order: typeof c.sort_order === "number" ? c.sort_order : index + 1,
        created_at: c.created_at,
        updated_at: c.updated_at,
      }));
    }
  } catch (err) {
    // optional table
  }

  // Derive categories dynamically from menu_items table
  try {
    const items = await fetchMenuItemsFromSupabase();
    const categorySet = new Set<string>();
    items.forEach((item) => {
      if (item.category_id) {
        categorySet.add(item.category_id.trim());
      }
    });

    if (categorySet.size > 0) {
      return Array.from(categorySet).map((cat, idx) => {
        const formatted = cat.replace(/^cat_/, "").replace(/_/g, " ").trim();
        const name = formatted.charAt(0).toUpperCase() + formatted.slice(1);
        return {
          id: cat,
          name: name || cat,
          sort_order: idx + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });
    }
  } catch (err) {
    console.error("Error deriving categories from Supabase menu items:", err);
  }

  return [];
}

/**
 * Attempts to fetch restaurant details from Supabase if a `restaurants` or `restaurant` table exists.
 */
export async function fetchRestaurantFromSupabase(): Promise<Restaurant | null> {
  const client = (await ensureSupabaseInitialized()) || getSupabase();
  if (!client) return null;

  try {
    const { data: restaurantsData, error: err1 } = await client
      .from("restaurants")
      .select("*")
      .limit(1)
      .single();

    if (!err1 && restaurantsData) {
      return {
        id: String(restaurantsData.id),
        name: restaurantsData.name || "ADITYA RESTAURANT",
        subtitle: restaurantsData.subtitle || "Fresh • Delicious • Made With Love",
        address: restaurantsData.address || "Station Road, Jaipur",
        phone: restaurantsData.phone || "+91 98765 43210",
        currency_symbol: restaurantsData.currency_symbol || "₹",
        logo_url: restaurantsData.logo_url,
        cover_image_url: restaurantsData.cover_image_url,
      };
    }
  } catch (e) {
    // Optional table
  }


  return null;
}

/**
 * Storage bucket names candidate list to support user's bucket naming conventions.
 */
export const SUPABASE_IMAGE_BUCKETS = ["menu-images", "menu image", "menu_images", "menuimages"];

/**
 * Converts a base64 string to a Blob with content type.
 */
function base64ToBlob(base64Data: string): { blob: Blob; contentType: string; ext: string } {
  const parts = base64Data.split(";base64,");
  const contentTypeMatch = parts[0]?.match(/data:(.*?)$/);
  const contentType = contentTypeMatch ? contentTypeMatch[1] : "image/jpeg";
  
  let ext = "jpg";
  if (contentType.includes("png")) ext = "png";
  else if (contentType.includes("webp")) ext = "webp";
  else if (contentType.includes("gif")) ext = "gif";
  else if (contentType.includes("svg")) ext = "svg";

  const rawData = atob(parts[1] || parts[0]);
  const rawLength = rawData.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = rawData.charCodeAt(i);
  }

  return { blob: new Blob([uInt8Array], { type: contentType }), contentType, ext };
}

/**
 * Uploads an image File or Blob directly to Supabase Storage in the `menu-images` / `menu image` bucket.
 * Returns the permanent public image URL.
 */
export async function uploadImageToSupabaseStorage(
  file: File | Blob,
  customName?: string
): Promise<string> {
  const client = (await ensureSupabaseInitialized()) || getSupabase();
  if (!client) {
    throw new Error("Supabase client is not initialized.");
  }

  // Derive file extension & MIME type
  let ext = "jpg";
  let contentType = "image/jpeg";

  if (file instanceof File && file.name) {
    const parts = file.name.split(".");
    if (parts.length > 1) {
      ext = parts[parts.length - 1].toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    }
    contentType = file.type || "image/jpeg";
  } else if (file.type) {
    contentType = file.type;
    if (contentType.includes("png")) ext = "png";
    else if (contentType.includes("webp")) ext = "webp";
    else if (contentType.includes("gif")) ext = "gif";
    else if (contentType.includes("svg")) ext = "svg";
  }

  const cleanName = (customName || `dish_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`)
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "_");
  const fileName = `${cleanName}.${ext}`;

  let lastError: any = null;

  // Try candidate buckets starting with menu-images and menu image
  for (const bucket of SUPABASE_IMAGE_BUCKETS) {
    try {
      const { data, error } = await client.storage.from(bucket).upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
        contentType,
      });

      if (!error && data) {
        // Upload successful, retrieve the public URL
        const { data: urlData } = client.storage.from(bucket).getPublicUrl(data.path || fileName);
        if (urlData && urlData.publicUrl) {
          return urlData.publicUrl;
        }
      }

      if (error) {
        lastError = error;
        // If error is not "bucket not found", record error and try next
        if (!error.message?.toLowerCase().includes("not found")) {
          console.warn(`Upload to bucket '${bucket}' encountered:`, error.message);
        }
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Upload exception on bucket '${bucket}':`, err);
    }
  }

  // If last error is RLS policy violation, provide a clean explanation
  if (lastError?.message?.toLowerCase().includes("row-level security") || lastError?.message?.toLowerCase().includes("policy") || lastError?.statusCode === "403") {
    throw new Error(
      "Supabase Storage permissions required: Please ensure your Storage bucket ('menu-images' or 'menu image') is set to Public or has an INSERT policy enabled."
    );
  }

  throw new Error(
    lastError?.message || "Failed to upload image to Supabase Storage. Please check bucket configuration."
  );
}

/**
 * Uploads a base64 encoded image directly to Supabase Storage.
 */
export async function uploadBase64ToSupabaseStorage(
  base64Data: string,
  customName?: string
): Promise<string> {
  const { blob, contentType, ext } = base64ToBlob(base64Data);
  const fileName = customName ? `${customName}.${ext}` : undefined;
  
  const file = new File([blob], fileName || `dish_${Date.now()}.${ext}`, { type: contentType });
  return uploadImageToSupabaseStorage(file, customName);
}

