import React, { useState } from "react";
import { Edit2, Trash2, Check, X, Search, Plus, Filter, Image as ImageIcon, CheckCircle2, XCircle } from "lucide-react";
import type { MenuItem, Category, Restaurant } from "../types";
import { api } from "../lib/api";

interface ManageFoodsTabProps {
  menuItems: MenuItem[];
  categories: Category[];
  restaurant: Restaurant;
  onRefresh: () => void;
  onNavigateToAddFood: () => void;
}

export const ManageFoodsTab: React.FC<ManageFoodsTabProps> = ({
  menuItems,
  categories,
  restaurant,
  onRefresh,
  onNavigateToAddFood,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>("");
  const [itemToEdit, setItemToEdit] = useState<MenuItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit Modal form states
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editAvailable, setEditAvailable] = useState(true);
  const [editVegetarian, setEditVegetarian] = useState(true);
  const [editUploadLoading, setEditUploadLoading] = useState(false);

  const openEditModal = (item: MenuItem) => {
    setItemToEdit(item);
    setEditName(item.name);
    setEditDesc(item.description);
    setEditPrice(String(item.price));
    setEditCategory(item.category_id);
    setEditImage(item.image_url);
    setEditAvailable(item.available);
    setEditVegetarian(item.vegetarian);
    setStatusMessage(null);
  };

  const closeEditModal = () => {
    setItemToEdit(null);
  };

  // Quick Price Edit Handler
  const startPriceEdit = (item: MenuItem) => {
    setEditingPriceId(item.id);
    setTempPrice(String(item.price));
  };

  const savePriceEdit = async (itemId: string) => {
    const numPrice = Number(tempPrice);
    if (isNaN(numPrice) || numPrice <= 0) {
      setStatusMessage({ type: "error", text: "Please enter a valid positive price." });
      return;
    }
    setLoadingAction(true);
    try {
      await api.updatePrice(itemId, numPrice);
      setEditingPriceId(null);
      onRefresh();
      setStatusMessage({ type: "success", text: "Price updated immediately!" });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to update price." });
    } finally {
      setLoadingAction(false);
    }
  };

  // Quick Availability Toggle Handler
  const toggleAvailability = async (item: MenuItem) => {
    setLoadingAction(true);
    try {
      await api.updateAvailability(item.id, !item.available);
      onRefresh();
      setStatusMessage({
        type: "success",
        text: `${item.name} is now ${!item.available ? "AVAILABLE" : "UNAVAILABLE"}`,
      });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to toggle availability." });
    } finally {
      setLoadingAction(false);
    }
  };

  // Save Full Edit
  const handleSaveFullEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemToEdit) return;

    if (!editName.trim()) {
      setStatusMessage({ type: "error", text: "Food name cannot be empty." });
      return;
    }
    const numPrice = Number(editPrice);
    if (isNaN(numPrice) || numPrice <= 0) {
      setStatusMessage({ type: "error", text: "Price must be a valid positive number." });
      return;
    }

    setLoadingAction(true);
    try {
      await api.updateMenuItem(itemToEdit.id, {
        name: editName.trim(),
        description: editDesc.trim(),
        price: numPrice,
        category_id: editCategory,
        image_url: editImage,
        available: editAvailable,
        vegetarian: editVegetarian,
      });
      closeEditModal();
      onRefresh();
      setStatusMessage({ type: "success", text: "Changes saved! Customer menu updated." });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to save changes." });
    } finally {
      setLoadingAction(false);
    }
  };

  // Delete Confirmation Handler
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setLoadingAction(true);
    try {
      await api.deleteMenuItem(itemToDelete.id);
      setItemToDelete(null);
      onRefresh();
      setStatusMessage({ type: "success", text: "Food item deleted from menu." });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to delete food item." });
    } finally {
      setLoadingAction(false);
    }
  };

  // Image Upload inside Edit modal
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEditUploadLoading(true);
    try {
      const url = await api.uploadImage(file);
      setEditImage(url);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Image upload failed. Please try again." });
    } finally {
      setEditUploadLoading(false);
    }
  };

  // Filter items for owner view
  const filteredItems = menuItems.filter((item) => {
    const matchCategory = selectedCategoryId === "all" || item.category_id === selectedCategoryId;
    const catName = categories.find((c) => c.id === item.category_id)?.name || "";
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      catName.toLowerCase().includes(q);
    return matchCategory && matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* Top action bar: Search, Category Filter, and Add Food Button */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex-1 flex gap-2">
          {/* Search bar */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter foods..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0C831F]"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0C831F] text-[#1F1F1F]"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Add Food Fast Button */}
        <button
          onClick={onNavigateToAddFood}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0C831F] hover:bg-[#0a6e1a] text-white text-xs sm:text-sm font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Food</span>
        </button>
      </div>

      {/* Status banner message */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
            statusMessage.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-gray-400 hover:text-black">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Menu Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
            <p className="text-sm font-bold text-[#1F1F1F]">No food items yet.</p>
            <p className="text-xs text-[#686868] mt-1">Start by adding delicious items to your menu.</p>
            <button
              onClick={onNavigateToAddFood}
              className="mt-4 px-4 py-2 rounded-xl bg-[#0C831F] text-white text-xs font-bold shadow-xs"
            >
              + Add Your First Food
            </button>
          </div>
        ) : (
          filteredItems.map((item) => {
            const categoryName = categories.find((c) => c.id === item.category_id)?.name || "Dish";
            const isEditingPrice = editingPriceId === item.id;

            return (
              <div
                key={item.id}
                id={`owner-food-item-${item.id}`}
                className={`bg-white rounded-2xl p-3.5 sm:p-4 border transition-all shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  item.available ? "border-gray-200" : "border-amber-200 bg-amber-50/20"
                }`}
              >
                {/* Left: Image & Details */}
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 left-1 bg-white/90 p-0.5 rounded-sm">
                      <span
                        className={`block w-2 h-2 rounded-full ${
                          item.vegetarian ? "bg-[#0C831F]" : "bg-red-600"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-[#1F1F1F] truncate">
                        {item.name}
                      </h3>
                      {/* Availability Tag */}
                      <button
                        onClick={() => toggleAvailability(item)}
                        title="Click to toggle availability"
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-transform active:scale-95 ${
                          item.available
                            ? "bg-green-100 text-[#0C831F] hover:bg-green-200"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {item.available ? "AVAILABLE" : "UNAVAILABLE"}
                      </button>
                    </div>

                    <p className="text-xs text-[#686868] mt-0.5 line-clamp-1">
                      {item.description || "No description provided."}
                    </p>

                    <div className="flex items-center gap-3 mt-1.5 text-xs text-[#686868]">
                      <span className="px-2 py-0.5 bg-gray-100 rounded-md text-[11px] font-semibold text-[#1F1F1F]">
                        {categoryName}
                      </span>

                      {/* Quick Price Edit Widget */}
                      <div className="flex items-center gap-1">
                        {isEditingPrice ? (
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-[#0C831F]">{restaurant.currency_symbol}</span>
                            <input
                              type="number"
                              value={tempPrice}
                              onChange={(e) => setTempPrice(e.target.value)}
                              className="w-16 px-1.5 py-0.5 text-xs font-bold border border-[#0C831F] rounded-md focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => savePriceEdit(item.id)}
                              className="p-1 rounded bg-[#0C831F] text-white hover:bg-[#0a6e1a]"
                              title="Save Price"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingPriceId(null)}
                              className="p-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                              title="Cancel"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startPriceEdit(item)}
                            className="inline-flex items-center gap-1 font-black text-sm text-[#0C831F] hover:underline cursor-pointer"
                            title="Click to quickly edit price"
                          >
                            <span>
                              {restaurant.currency_symbol || "₹"}
                              {item.price}
                            </span>
                            <Edit2 className="w-2.5 h-2.5 opacity-60" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    id={`edit-food-btn-${item.id}`}
                    onClick={() => openEditModal(item)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#1F1F1F] text-xs font-semibold cursor-pointer active:scale-95 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    id={`delete-food-btn-${item.id}`}
                    onClick={() => setItemToDelete(item)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold cursor-pointer active:scale-95 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Food Modal */}
      {itemToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-lg font-black text-[#1F1F1F]">Edit Food Item</h2>
              <button onClick={closeEditModal} className="p-1 rounded-full text-gray-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFullEdit} className="space-y-4">
              {/* Image Preview & Upload */}
              <div>
                <label className="block text-xs font-bold uppercase text-[#1F1F1F] mb-1.5">
                  Food Image
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0 border">
                    <img src={editImage} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <label className="inline-block px-3 py-2 bg-gray-100 hover:bg-gray-200 text-[#1F1F1F] text-xs font-bold rounded-xl cursor-pointer">
                      <span>{editUploadLoading ? "Uploading..." : "Change Image from Gallery"}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-[#686868] mt-1">Supports JPG, PNG, WEBP</p>
                  </div>
                </div>
              </div>

              {/* Food Name */}
              <div>
                <label className="block text-xs font-bold uppercase text-[#1F1F1F] mb-1">
                  Food Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0C831F] focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase text-[#1F1F1F] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0C831F] focus:outline-none"
                />
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#1F1F1F] mb-1">
                    Price ({restaurant.currency_symbol || "₹"})
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0C831F] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#1F1F1F] mb-1">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0C831F] focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Availability & Dietary Type */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#1F1F1F] mb-1">
                    Availability
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditAvailable(!editAvailable)}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      editAvailable ? "bg-[#0C831F] text-white" : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {editAvailable ? "AVAILABLE" : "UNAVAILABLE"}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#1F1F1F] mb-1">
                    Dietary Type
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditVegetarian(!editVegetarian)}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      editVegetarian ? "bg-green-50 text-[#0C831F] border border-[#0C831F]" : "bg-red-50 text-red-600 border border-red-600"
                    }`}
                  >
                    {editVegetarian ? "Pure Vegetarian" : "Non-Vegetarian"}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-[#1F1F1F] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="flex-1 py-2.5 rounded-xl bg-[#0C831F] text-white text-xs font-bold hover:bg-[#0a6e1a] shadow-xs"
                >
                  {loadingAction ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-[#1F1F1F]">Delete this food item?</h3>
            <p className="text-xs text-[#686868]">
              Are you sure you want to delete <strong>"{itemToDelete.name}"</strong>? It will immediately be removed from the customer menu.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-[#1F1F1F] hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={loadingAction}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {loadingAction ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
