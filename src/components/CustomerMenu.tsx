import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Search, Utensils, Lock, MapPin, RefreshCw, Layers, AlertCircle } from "lucide-react";
import type { Restaurant, Category, MenuItem } from "../types";
import { FeaturedFoodCard } from "./FeaturedFoodCard";
import { RecommendedSection } from "./RecommendedSection";
import { FoodDetailModal } from "./FoodDetailModal";

interface CustomerMenuProps {
  restaurant: Restaurant | null;
  categories: Category[];
  menuItems: MenuItem[];
  loading: boolean;
  onNavigateToOwner: () => void;
  onRefresh: () => void;
}

export const CustomerMenu: React.FC<CustomerMenuProps> = ({
  restaurant,
  categories,
  menuItems,
  loading,
  onNavigateToOwner,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [selectedFood, setSelectedFood] = useState<MenuItem | null>(null);

  // Dynamic merged categories (categories from database + any distinct categories in menu_items)
  const displayCategories = useMemo(() => {
    const map = new Map<string, { id: string; name: string; sort_order: number }>();
    categories.forEach((c) => {
      map.set(c.id.toLowerCase(), { id: c.id, name: c.name, sort_order: c.sort_order });
    });

    menuItems.forEach((item) => {
      if (item.category_id) {
        const key = item.category_id.toLowerCase();
        if (!map.has(key)) {
          // Format category id into human readable name if needed
          const formatted = item.category_id.replace(/^cat_/, "").replace(/_/g, " ");
          const name = formatted.charAt(0).toUpperCase() + formatted.slice(1);
          map.set(key, {
            id: item.category_id,
            name: name || item.category_id,
            sort_order: map.size + 1,
          });
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => a.sort_order - b.sort_order);
  }, [categories, menuItems]);

  // Helper to match item to selected category
  const matchesCategory = (item: MenuItem, catId: string): boolean => {
    if (catId === "all") return true;
    if (item.category_id === catId) return true;
    const catObj = displayCategories.find((c) => c.id === catId);
    if (catObj) {
      if (item.category_id.toLowerCase() === catObj.id.toLowerCase()) return true;
      if (item.category_id.toLowerCase() === catObj.name.toLowerCase()) return true;
    }
    return false;
  };

  // Helper to resolve category name for a dish
  const getCategoryName = (categoryId: string): string => {
    const found = displayCategories.find(
      (c) => c.id.toLowerCase() === categoryId.toLowerCase() || c.name.toLowerCase() === categoryId.toLowerCase()
    );
    if (found) return found.name;
    const formatted = categoryId.replace(/^cat_/, "").replace(/_/g, " ");
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  // Available foods subset for featured calculations
  const availableFoods = useMemo(() => {
    return menuItems.filter((item) => item.available);
  }, [menuItems]);

  // Dynamically calculate the HIGHEST-PRICED available food (or fallback to any highest priced)
  const highestPricedFood = useMemo(() => {
    const pool = availableFoods.length > 0 ? availableFoods : menuItems;
    if (!pool.length) return null;
    const sorted = [...pool].sort((a, b) => b.price - a.price);
    return sorted[0];
  }, [availableFoods, menuItems]);

  // Recommended foods
  const recommendedFoods = useMemo(() => {
    const pool = availableFoods.length > 0 ? availableFoods : menuItems;
    if (!pool.length) return [];
    if (!highestPricedFood) return pool.slice(0, 4);
    return pool.filter((item) => item.id !== highestPricedFood.id).slice(0, 5);
  }, [availableFoods, menuItems, highestPricedFood]);

  // Filter foods based on category & search query (shows BOTH available and unavailable items)
  const filteredFoods = useMemo(() => {
    let result = menuItems;

    // Filter by Category
    if (selectedCategoryId !== "all") {
      result = result.filter((item) => matchesCategory(item, selectedCategoryId));
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((item) => {
        const catName = getCategoryName(item.category_id);
        return (
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          catName.toLowerCase().includes(q) ||
          item.category_id.toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [menuItems, selectedCategoryId, searchQuery, displayCategories]);

  // Loading skeleton state
  if (loading && !restaurant) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center animate-pulse mb-4">
          <Utensils className="w-8 h-8 text-[#F8CB46]" />
        </div>
        <div className="h-6 w-48 bg-gray-200 rounded-md animate-pulse mb-2" />
        <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse mb-8" />
        <div className="w-full max-w-md space-y-4">
          <div className="h-36 bg-gray-200 rounded-2xl animate-pulse" />
          <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
          <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const currentRestaurant: Restaurant = restaurant || {
    id: "default",
    name: "ADITYA RESTAURANT",
    subtitle: "Fresh • Delicious • Made With Love",
    currency_symbol: "₹",
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-[#1F1F1F] flex flex-col items-center">
      {/* Container - constrained for mobile first & elegant on larger screens */}
      <div className="w-full max-w-xl min-h-screen bg-[#F7F7F7] flex flex-col shadow-xs">
        {/* Top Header Banner */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-4 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F8CB46] text-[#1F1F1F] flex items-center justify-center font-bold shadow-xs">
              <Utensils className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-[#1F1F1F] tracking-tight uppercase line-clamp-1">
                {currentRestaurant.name}
              </h1>
              <p className="text-[11px] font-medium text-[#0C831F] line-clamp-1">
                {currentRestaurant.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              title="Refresh Menu"
              aria-label="Refresh Menu"
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-[#1F1F1F] flex items-center justify-center transition-transform active:rotate-180 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Owner Login Link */}
            <button
              id="header-owner-login-btn"
              onClick={onNavigateToOwner}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1F1F1F] hover:bg-black text-white text-xs font-semibold shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Owner</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-4 sm:p-5 flex-1 space-y-5">
          {/* Restaurant Location Snippet */}
          {currentRestaurant.address && (
            <div className="flex items-center text-xs text-[#686868] px-1">
              <div className="flex items-center gap-1 line-clamp-1">
                <MapPin className="w-3.5 h-3.5 text-[#0C831F] shrink-0" />
                <span>{currentRestaurant.address}</span>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="customer-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search delicious food..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-gray-200/90 text-sm text-[#1F1F1F] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F8CB46] focus:border-transparent shadow-xs transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold text-gray-400 hover:text-[#1F1F1F] cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* If No Search Query: Show Featured Highest-Priced Food & Recommended Section */}
          {!searchQuery && (
            <>
              {/* Dynamic Highest-Priced Available Food */}
              {highestPricedFood && (
                <FeaturedFoodCard
                  food={highestPricedFood}
                  restaurant={currentRestaurant}
                  onSelect={(food) => setSelectedFood(food)}
                />
              )}

              {/* Recommended For You Carousel */}
              {recommendedFoods.length > 0 && (
                <RecommendedSection
                  items={recommendedFoods}
                  restaurant={currentRestaurant}
                  onSelect={(food) => setSelectedFood(food)}
                />
              )}
            </>
          )}

          {/* Category Navigation Pills */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#1F1F1F]" />
                <h2 className="text-xs sm:text-sm font-bold tracking-wider text-[#1F1F1F] uppercase">
                  Explore Categories
                </h2>
              </div>
              <span className="text-xs text-[#686868]">
                {filteredFoods.length} {filteredFoods.length === 1 ? "dish" : "dishes"}
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {/* "All" button */}
              <button
                id="cat-pill-all"
                onClick={() => setSelectedCategoryId("all")}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-xs cursor-pointer ${
                  selectedCategoryId === "all"
                    ? "bg-[#1F1F1F] text-white"
                    : "bg-white text-[#686868] border border-gray-200/80 hover:bg-gray-50"
                }`}
              >
                All Dishes ({menuItems.length})
              </button>

              {/* Dynamic Categories */}
              {displayCategories.map((category) => {
                const count = menuItems.filter((item) => matchesCategory(item, category.id)).length;
                const isSelected = selectedCategoryId === category.id;
                return (
                  <button
                    key={category.id}
                    id={`cat-pill-${category.id}`}
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-xs cursor-pointer ${
                      isSelected
                        ? "bg-[#0C831F] text-white"
                        : "bg-white text-[#686868] border border-gray-200/80 hover:bg-gray-50"
                    }`}
                  >
                    {category.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Food Items Grid / List */}
          <div className="space-y-3 pt-1">
            {filteredFoods.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-200/80 my-4">
                <p className="text-base font-semibold text-[#1F1F1F]">
                  {searchQuery
                    ? "No delicious food found."
                    : menuItems.length === 0
                    ? "Menu is being updated. Please check back soon."
                    : "No items in this category."}
                </p>
                <p className="text-xs text-[#686868] mt-1">
                  {searchQuery
                    ? "Try searching for a different dish name or ingredient."
                    : "Please select another category above."}
                </p>
              </div>
            ) : (
              filteredFoods.map((food, idx) => {
                const isAvailable = food.available;
                const catName = getCategoryName(food.category_id);

                return (
                  <motion.div
                    key={food.id}
                    id={`customer-food-card-${food.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.4) }}
                    onClick={() => setSelectedFood(food)}
                    className={`bg-white rounded-2xl p-3.5 sm:p-4 border shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-3.5 group relative overflow-hidden ${
                      isAvailable ? "border-gray-200/80" : "border-gray-200/60 bg-gray-50/50"
                    }`}
                  >
                    {/* Food Image */}
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                      <img
                        src={food.image_url}
                        alt={food.name}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className={`w-full h-full object-cover transition-transform duration-300 ${
                          isAvailable ? "group-hover:scale-105" : "grayscale opacity-80"
                        }`}
                      />
                      {/* Dietary indicator */}
                      <div className="absolute top-1.5 left-1.5 bg-white/90 backdrop-blur-xs p-1 rounded-md shadow-xs">
                        <span
                          className={`block w-2.5 h-2.5 rounded-full ${
                            food.vegetarian ? "bg-[#0C831F]" : "bg-red-600"
                          }`}
                        />
                      </div>

                      {/* Unavailable Overlay on Image */}
                      {!isAvailable && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-1">
                          <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide uppercase shadow-xs">
                            Unavailable
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Food Information */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h3
                            className={`text-sm sm:text-base font-bold transition-colors line-clamp-1 ${
                              isAvailable
                                ? "text-[#1F1F1F] group-hover:text-[#0C831F]"
                                : "text-gray-600 line-through"
                            }`}
                          >
                            {food.name}
                          </h3>
                        </div>

                        {/* Category Label */}
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                            {catName}
                          </span>
                          {!isAvailable && (
                            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                              <AlertCircle className="w-3 h-3" />
                              Unavailable
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#686868] mt-1 line-clamp-2 leading-relaxed">
                          {food.description}
                        </p>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between">
                        <span
                          className={`text-base sm:text-lg font-black ${
                            isAvailable ? "text-[#0C831F]" : "text-gray-400"
                          }`}
                        >
                          {currentRestaurant.currency_symbol || "₹"}
                          {food.price}
                        </span>
                        <span
                          className={`text-[11px] font-semibold flex items-center gap-0.5 ${
                            isAvailable
                              ? "text-gray-500 group-hover:text-[#0C831F]"
                              : "text-gray-400"
                          }`}
                        >
                          {isAvailable ? "Details →" : "View info"}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-auto p-6 text-center text-xs text-[#686868] border-t border-gray-200/80 bg-white">
          <p className="font-semibold text-[#1F1F1F]">{currentRestaurant.name}</p>
          <p className="text-[11px] mt-0.5 text-gray-400">
            Powered by Single Restaurant QR Menu • Updated Live
          </p>
        </footer>
      </div>

      {/* Food Details Modal */}
      <FoodDetailModal
        food={selectedFood}
        categories={displayCategories}
        restaurant={currentRestaurant}
        onClose={() => setSelectedFood(null)}
      />
    </div>
  );
};
