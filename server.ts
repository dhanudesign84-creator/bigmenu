import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import type { Restaurant, Category, MenuItem } from "./src/types";

const app = express();
const PORT = 3000;

// Setup folders for persistent storage
const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const DB_FILE = path.join(DATA_DIR, "db.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, "food-" + uniqueSuffix + ext);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Password Hashing Helper
function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const finalSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, finalSalt, 1000, 64, "sha512").toString("hex");
  return { hash, salt: finalSalt };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  const check = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return check === hash;
}

// In-memory token sessions
const activeSessions = new Map<string, { email: string; expiresAt: number }>();

function createSession(email: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  activeSessions.set(token, {
    email,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  return token;
}

function validateAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Unauthorized access" });
  }
  const token = authHeader.substring(7);
  const session = activeSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) activeSessions.delete(token);
    return res.status(401).json({ success: false, error: "Session expired or invalid" });
  }
  next();
}

interface DatabaseSchema {
  restaurant: Restaurant;
  categories: Category[];
  menu_items: MenuItem[];
  owner: {
    email: string;
    password_hash: string;
    password_salt: string;
  };
}

// Seed initial state
const DEFAULT_SALT = crypto.randomBytes(16).toString("hex");
const DEFAULT_HASH = crypto.pbkdf2Sync("CHANGE_THIS_PASSWORD", DEFAULT_SALT, 1000, 64, "sha512").toString("hex");

const initialDatabase: DatabaseSchema = {
  restaurant: {
    id: "aditya_restaurant_01",
    name: "ADITYA RESTAURANT",
    subtitle: "Fresh • Delicious • Made With Love",
    address: "Station Road, Near City Center, Jaipur, Rajasthan",
    phone: "+91 98765 43210",
    currency_symbol: "₹",
    logo_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80",
    cover_image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  categories: [
    { id: "cat_main", name: "Main Course", sort_order: 1, created_at: new Date().toISOString() },
    { id: "cat_starters", name: "Starters", sort_order: 2, created_at: new Date().toISOString() },
    { id: "cat_breads", name: "Breads", sort_order: 3, created_at: new Date().toISOString() },
    { id: "cat_rice", name: "Rice & Biryani", sort_order: 4, created_at: new Date().toISOString() },
    { id: "cat_desserts", name: "Desserts", sort_order: 5, created_at: new Date().toISOString() },
    { id: "cat_beverages", name: "Beverages", sort_order: 6, created_at: new Date().toISOString() },
  ],
  menu_items: [],
  owner: {
    email: "owner@gmail.com",
    password_hash: DEFAULT_HASH,
    password_salt: DEFAULT_SALT,
  },
};

function readDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDatabase, null, 2), "utf8");
      return initialDatabase;
    }
    const data = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database file, using fallback:", err);
    return initialDatabase;
  }
}

function saveDatabase(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving database file:", err);
  }
}

// Middleware
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
app.use("/uploads", express.static(UPLOADS_DIR));

// ----------------------------------------------------
// Public APIs
// ----------------------------------------------------

// 0. Public Config (Supabase public credentials if available)
app.get("/api/config", (_req, res) => {
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://nksqqsbfuunswyhgpnrj.supabase.co";
  const supabaseAnonKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_k_kzHqgp7lyT1QiRzY_0MA_kzJFUI55";

  res.json({
    success: true,
    supabaseUrl: supabaseUrl.trim(),
    supabaseAnonKey: supabaseAnonKey.trim(),
  });
});

// 1. Restaurant Profile
app.get("/api/restaurant", (_req, res) => {
  const db = readDatabase();
  res.json({ success: true, data: db.restaurant });
});

// 2. Categories
app.get("/api/categories", (_req, res) => {
  const db = readDatabase();
  const sorted = [...db.categories].sort((a, b) => a.sort_order - b.sort_order);
  res.json({ success: true, data: sorted });
});

// 3. Menu Items (Supports ?available_only=true or public view)
app.get("/api/menu-items", (req, res) => {
  const db = readDatabase();
  const availableOnly = req.query.available_only === "true";
  let items = db.menu_items;
  if (availableOnly) {
    items = items.filter((item) => item.available);
  }
  res.json({ success: true, data: items });
});

// ----------------------------------------------------
// Authentication APIs
// ----------------------------------------------------

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Incorrect email or password." });
  }
  const db = readDatabase();
  const cleanEmail = email.trim().toLowerCase();
  const ownerEmail = db.owner.email.trim().toLowerCase();

  if (cleanEmail !== ownerEmail) {
    return res.status(401).json({ success: false, error: "Incorrect email or password." });
  }

  const isValid = verifyPassword(password, db.owner.password_hash, db.owner.password_salt);
  if (!isValid) {
    return res.status(401).json({ success: false, error: "Incorrect email or password." });
  }

  const token = createSession(cleanEmail);
  res.json({
    success: true,
    data: {
      email: cleanEmail,
      token,
      expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000,
    },
  });
});

app.post("/api/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    activeSessions.delete(token);
  }
  res.json({ success: true });
});

app.get("/api/auth/me", validateAuth, (req, res) => {
  const authHeader = req.headers.authorization!;
  const token = authHeader.substring(7);
  const session = activeSessions.get(token);
  const db = readDatabase();
  res.json({
    success: true,
    data: {
      email: session?.email || db.owner.email,
      restaurant: db.restaurant,
    },
  });
});

app.post("/api/auth/change-password", validateAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, error: "Password must be at least 6 characters long." });
  }

  const db = readDatabase();
  const isValid = verifyPassword(currentPassword, db.owner.password_hash, db.owner.password_salt);
  if (!isValid) {
    return res.status(400).json({ success: false, error: "Current password does not match." });
  }

  const { hash, salt } = hashPassword(newPassword);
  db.owner.password_hash = hash;
  db.owner.password_salt = salt;
  saveDatabase(db);

  res.json({ success: true, message: "Password updated successfully." });
});

// ----------------------------------------------------
// Owner Protected APIs
// ----------------------------------------------------

// 1. Update Restaurant Profile
app.put("/api/restaurant", validateAuth, (req, res) => {
  const updates = req.body;
  const db = readDatabase();
  db.restaurant = {
    ...db.restaurant,
    ...updates,
    updated_at: new Date().toISOString(),
  };
  saveDatabase(db);
  res.json({ success: true, data: db.restaurant });
});

// 2. Add Category
app.post("/api/categories", validateAuth, (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: "Category name is required." });
  }
  const db = readDatabase();
  const newCat: Category = {
    id: "cat_" + Date.now(),
    name: name.trim(),
    sort_order: db.categories.length + 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.categories.push(newCat);
  saveDatabase(db);
  res.json({ success: true, data: newCat });
});

// 3. Edit Category
app.put("/api/categories/:id", validateAuth, (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: "Category name is required." });
  }
  const db = readDatabase();
  const idx = db.categories.findIndex((c) => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: "Category not found." });
  }
  db.categories[idx].name = name.trim();
  db.categories[idx].updated_at = new Date().toISOString();
  saveDatabase(db);
  res.json({ success: true, data: db.categories[idx] });
});

// 4. Delete Category (Safe deletion check)
app.delete("/api/categories/:id", validateAuth, (req, res) => {
  const { id } = req.params;
  const db = readDatabase();
  // Check if any foods exist in this category
  const assignedItems = db.menu_items.filter((item) => item.category_id === id);
  if (assignedItems.length > 0) {
    return res.status(400).json({
      success: false,
      error: `Cannot delete category: contains ${assignedItems.length} food items. Please reassign or delete them first.`,
    });
  }
  db.categories = db.categories.filter((c) => c.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// 5. Add Menu Item
app.post("/api/menu-items", validateAuth, (req, res) => {
  const { name, description, price, category_id, image_url, available, vegetarian } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: "Food name is required." });
  }
  const numPrice = Number(price);
  if (isNaN(numPrice) || numPrice <= 0) {
    return res.status(400).json({ success: false, error: "Price must be a valid positive number." });
  }
  if (!category_id) {
    return res.status(400).json({ success: false, error: "Category must be selected." });
  }

  const db = readDatabase();
  const newItem: MenuItem = {
    id: "item_" + Date.now(),
    restaurant_id: db.restaurant.id,
    name: name.trim(),
    description: (description || "").trim(),
    price: Math.round(numPrice * 100) / 100,
    category_id,
    image_url: image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    available: available !== false,
    vegetarian: vegetarian !== false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.menu_items.unshift(newItem);
  saveDatabase(db);
  res.json({ success: true, data: newItem });
});

// 6. Edit Menu Item (Full update)
app.put("/api/menu-items/:id", validateAuth, (req, res) => {
  const { id } = req.params;
  const { name, description, price, category_id, image_url, available, vegetarian } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: "Food name is required." });
  }
  const numPrice = Number(price);
  if (isNaN(numPrice) || numPrice <= 0) {
    return res.status(400).json({ success: false, error: "Price must be a valid positive number." });
  }
  if (!category_id) {
    return res.status(400).json({ success: false, error: "Category must be selected." });
  }

  const db = readDatabase();
  const idx = db.menu_items.findIndex((item) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: "Food item not found." });
  }

  db.menu_items[idx] = {
    ...db.menu_items[idx],
    name: name.trim(),
    description: (description || "").trim(),
    price: Math.round(numPrice * 100) / 100,
    category_id,
    image_url: image_url || db.menu_items[idx].image_url,
    available: Boolean(available),
    vegetarian: Boolean(vegetarian),
    updated_at: new Date().toISOString(),
  };

  saveDatabase(db);
  res.json({ success: true, data: db.menu_items[idx] });
});

// 7. Quick Price Edit (Patch)
app.patch("/api/menu-items/:id/price", validateAuth, (req, res) => {
  const { id } = req.params;
  const { price } = req.body;
  const numPrice = Number(price);
  if (isNaN(numPrice) || numPrice <= 0) {
    return res.status(400).json({ success: false, error: "Price must be a valid positive number." });
  }

  const db = readDatabase();
  const idx = db.menu_items.findIndex((item) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: "Food item not found." });
  }

  db.menu_items[idx].price = Math.round(numPrice * 100) / 100;
  db.menu_items[idx].updated_at = new Date().toISOString();
  saveDatabase(db);
  res.json({ success: true, data: db.menu_items[idx] });
});

// 8. Quick Availability Toggle (Patch)
app.patch("/api/menu-items/:id/availability", validateAuth, (req, res) => {
  const { id } = req.params;
  const { available } = req.body;

  const db = readDatabase();
  const idx = db.menu_items.findIndex((item) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: "Food item not found." });
  }

  db.menu_items[idx].available = Boolean(available);
  db.menu_items[idx].updated_at = new Date().toISOString();
  saveDatabase(db);
  res.json({ success: true, data: db.menu_items[idx] });
});

// 9. Delete Menu Item
app.delete("/api/menu-items/:id", validateAuth, (req, res) => {
  const { id } = req.params;
  const db = readDatabase();
  const itemToDelete = db.menu_items.find((item) => item.id === id);
  if (!itemToDelete) {
    return res.status(404).json({ success: false, error: "Food item not found." });
  }

  // If the image was uploaded locally, safely clean up file
  if (itemToDelete.image_url && itemToDelete.image_url.startsWith("/uploads/")) {
    const filename = path.basename(itemToDelete.image_url);
    const filePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error("Could not remove deleted item image file:", e);
      }
    }
  }

  db.menu_items = db.menu_items.filter((item) => item.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// 10. File Upload endpoint (Supports multipart form or base64 payload)
app.post("/api/upload", validateAuth, upload.single("image"), (req, res) => {
  if (req.file) {
    const fileUrl = `/uploads/${req.file.filename}`;
    return res.json({ success: true, url: fileUrl });
  }

  // Fallback for base64 uploads from camera/canvas
  const { base64Data, filename } = req.body;
  if (base64Data && typeof base64Data === "string") {
    try {
      const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ success: false, error: "Invalid image format." });
      }
      const buffer = Buffer.from(matches[2], "base64");
      const ext = matches[1].split("/")[1] || "jpg";
      const fname = "food-" + Date.now() + "-" + Math.round(Math.random() * 1e9) + "." + ext;
      const targetPath = path.join(UPLOADS_DIR, fname);
      fs.writeFileSync(targetPath, buffer);
      return res.json({ success: true, url: `/uploads/${fname}` });
    } catch (err) {
      console.error("Base64 upload failed:", err);
      return res.status(500).json({ success: false, error: "Image upload failed. Please try again." });
    }
  }

  return res.status(400).json({ success: false, error: "No image file provided." });
});

// ----------------------------------------------------
// Vite Middleware / Production Server
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Restaurant QR Menu Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
