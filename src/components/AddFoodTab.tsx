import React, { useState } from "react";
import { UploadCloud, Image as ImageIcon, X, Check, Loader2, Sparkles, AlertCircle } from "lucide-react";
import type { Category, Restaurant } from "../types";
import { api } from "../lib/api";

interface AddFoodTabProps {
  categories: Category[];
  restaurant: Restaurant;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddFoodTab: React.FC<AddFoodTabProps> = ({
  categories,
  restaurant,
  onSuccess,
  onCancel,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [available, setAvailable] = useState(true);
  const [vegetarian, setVegetarian] = useState(true);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const processFile = (file: File) => {
    // Validate image format
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setErrorMessage("Please select a valid image format (JPG, PNG, or WEBP).");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage("Image is too large. Please select an image under 15MB.");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setErrorMessage("");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setSelectedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Food name cannot be empty.");
      return;
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setErrorMessage("Price must be a valid positive number.");
      return;
    }

    if (!categoryId) {
      setErrorMessage("Category must be selected.");
      return;
    }

    setSubmitting(true);
    try {
      let finalImageUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";

      // Upload image to Supabase Storage bucket (`menu-images` / `menu image`)
      if (selectedFile) {
        setUploading(true);
        try {
          finalImageUrl = await api.uploadImage(selectedFile);
        } catch (uploadErr: any) {
          console.warn("Storage upload failed, fallback to preview:", uploadErr);
          if (imagePreview && imagePreview.startsWith("data:")) {
            finalImageUrl = imagePreview;
          }
        }
      } else if (imagePreview && imagePreview.startsWith("data:")) {
        setUploading(true);
        try {
          finalImageUrl = await api.uploadBase64(imagePreview);
        } catch (uploadErr) {
          finalImageUrl = imagePreview;
        }
      }

      // Add item to Supabase database (`menu_items`)
      await api.addMenuItem({
        restaurant_id: restaurant.id,
        name: name.trim(),
        description: description.trim(),
        price: Math.round(numPrice * 100) / 100,
        category_id: categoryId,
        image_url: finalImageUrl,
        available,
        vegetarian,
      });

      onSuccess();
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to add food. Please try again.");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-7 shadow-xs">
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-[#1F1F1F]">Add Food</h2>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              Supabase Connected
            </span>
          </div>
          <p className="text-xs text-[#686868] mt-0.5">Upload dish photo to Supabase Storage and publish to customer menu</p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 rounded-xl text-gray-400 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {errorMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Large Image Upload Area */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1F1F1F]">
              Food Image (Supabase Storage)
            </label>
            {selectedFile && (
              <span className="text-[11px] font-medium text-[#0C831F]">
                {(selectedFile.size / 1024).toFixed(0)} KB ready
              </span>
            )}
          </div>

          {imagePreview ? (
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 max-w-sm group">
              <img
                src={imagePreview}
                alt="Selected Food Preview"
                className="w-full h-48 sm:h-56 object-cover"
              />
              <div className="p-3 bg-white flex items-center justify-between border-t border-gray-100">
                <label className="text-xs font-bold text-[#0C831F] hover:underline cursor-pointer flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Change Photo</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                >
                  Remove Photo
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
                isDragOver
                  ? "border-[#0C831F] bg-green-50/60 scale-[1.01]"
                  : "border-gray-300 hover:border-[#0C831F] bg-gray-50/50"
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#1F1F1F]">Upload Food Image</h4>
              <p className="text-xs text-[#686868] mt-1 mb-4">
                Drag & drop your dish photo here, or click to browse (JPG, PNG, WEBP)
              </p>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F1F1F] hover:bg-black text-white text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95">
                <ImageIcon className="w-4 h-4" />
                <span>Select from Phone / Computer</span>
                <input
                  id="add-food-image-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Food Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
            Food Name *
          </label>
          <input
            id="add-food-name-input"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Paneer Tikka Masala"
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-[#1F1F1F] focus:bg-white focus:ring-2 focus:ring-[#0C831F] focus:outline-none transition-all"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
            Description
          </label>
          <textarea
            id="add-food-desc-input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Tender paneer cubes marinated in spices and grilled to perfection."
            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-[#1F1F1F] focus:bg-white focus:ring-2 focus:ring-[#0C831F] focus:outline-none transition-all"
          />
        </div>

        {/* Price and Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
              Price ({restaurant.currency_symbol || "₹"}) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center font-bold text-[#0C831F]">
                {restaurant.currency_symbol || "₹"}
              </span>
              <input
                id="add-food-price-input"
                type="number"
                step="1"
                min="1"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="249"
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-[#1F1F1F] font-bold focus:bg-white focus:ring-2 focus:ring-[#0C831F] focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
              Category *
            </label>
            <select
              id="add-food-category-select"
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-[#1F1F1F] focus:bg-white focus:ring-2 focus:ring-[#0C831F] focus:outline-none transition-all"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Availability and Dietary Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Availability Toggle */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
              Availability
            </label>
            <button
              type="button"
              id="add-food-availability-toggle"
              onClick={() => setAvailable(!available)}
              className={`w-full py-3 px-4 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all shadow-xs cursor-pointer ${
                available ? "bg-[#0C831F] text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              {available ? "AVAILABLE (Shown on Menu)" : "UNAVAILABLE (Hidden)"}
            </button>
          </div>

          {/* Dietary Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
              Dietary Type
            </label>
            <button
              type="button"
              id="add-food-dietary-toggle"
              onClick={() => setVegetarian(!vegetarian)}
              className={`w-full py-3 px-4 rounded-xl text-xs font-extrabold tracking-wider transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 ${
                vegetarian
                  ? "bg-green-50 text-[#0C831F] border-2 border-[#0C831F]"
                  : "bg-red-50 text-red-600 border-2 border-red-600"
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  vegetarian ? "bg-[#0C831F]" : "bg-red-600"
                }`}
              />
              <span>{vegetarian ? "Pure Vegetarian" : "Non-Vegetarian"}</span>
            </button>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-xs font-bold text-[#1F1F1F] hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="submit-add-food-btn"
            type="submit"
            disabled={submitting || uploading}
            className="flex-1 py-3 px-4 rounded-xl bg-[#0C831F] hover:bg-[#0a6e1a] text-white text-xs font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {uploading || submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{uploading ? "Uploading to Supabase Storage..." : "Saving to Supabase..."}</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Add Food</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
