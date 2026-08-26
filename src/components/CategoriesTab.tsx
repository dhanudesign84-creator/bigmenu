import React, { useState } from "react";
import { Plus, Edit2, Trash2, Check, X, Layers, AlertTriangle } from "lucide-react";
import type { Category, MenuItem } from "../types";
import { api } from "../lib/api";

interface CategoriesTabProps {
  categories: Category[];
  menuItems: MenuItem[];
  onRefresh: () => void;
}

export const CategoriesTab: React.FC<CategoriesTabProps> = ({
  categories,
  menuItems,
  onRefresh,
}) => {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await api.addCategory(newCategoryName.trim());
      setNewCategoryName("");
      onRefresh();
      setSuccessMessage("Category added successfully!");
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to add category.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const saveEdit = async (id: string) => {
    if (!editingName.trim()) return;
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await api.updateCategory(id, editingName.trim());
      setEditingId(null);
      onRefresh();
      setSuccessMessage("Category renamed!");
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to update category.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    const assignedCount = menuItems.filter((i) => i.category_id === cat.id).length;
    if (assignedCount > 0) {
      setErrorMessage(
        `Cannot delete "${cat.name}" because it contains ${assignedCount} food items. Please reassign or delete the dishes first.`
      );
      return;
    }

    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await api.deleteCategory(cat.id);
      onRefresh();
      setSuccessMessage("Category deleted.");
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to delete category.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Info */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#F8CB46] text-[#1F1F1F] flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#1F1F1F]">Manage Categories</h2>
            <p className="text-xs text-[#686868]">
              Add, rename, or remove categories to organize your food menu
            </p>
          </div>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage("")} className="text-gray-400 hover:text-black">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs font-semibold flex items-center justify-between">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage("")} className="text-gray-400 hover:text-black">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Add Category Form */}
        <form onSubmit={handleAddCategory} className="flex gap-2">
          <input
            id="new-category-input"
            type="text"
            required
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="e.g. Tandoori Specials, Beverages..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs sm:text-sm text-[#1F1F1F] focus:bg-white focus:ring-2 focus:ring-[#0C831F] focus:outline-none"
          />
          <button
            id="add-category-submit-btn"
            type="submit"
            disabled={loading || !newCategoryName.trim()}
            className="px-5 py-2.5 rounded-xl bg-[#0C831F] hover:bg-[#0a6e1a] text-white text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </form>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#686868] mb-3">
          Existing Categories ({categories.length})
        </h3>

        {categories.length === 0 ? (
          <p className="text-xs text-[#686868] py-4 text-center">No categories created yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {categories.map((cat) => {
              const assignedCount = menuItems.filter((i) => i.category_id === cat.id).length;
              const isEditing = editingId === cat.id;

              return (
                <div
                  key={cat.id}
                  className="py-3.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                >
                  <div className="flex-1 flex items-center gap-3">
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1 max-w-sm">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg border border-[#0C831F] focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => saveEdit(cat.id)}
                          className="p-1.5 rounded-lg bg-[#0C831F] text-white hover:bg-[#0a6e1a]"
                          title="Save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#1F1F1F]">{cat.name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[#686868] text-[11px] font-semibold">
                          {assignedCount} {assignedCount === 1 ? "dish" : "dishes"}
                        </span>
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => startEdit(cat)}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#1F1F1F] text-xs font-semibold cursor-pointer active:scale-95 transition-all"
                        title="Rename Category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold cursor-pointer active:scale-95 transition-all"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
