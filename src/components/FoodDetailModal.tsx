import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import type { MenuItem, Restaurant, Category } from "../types";

interface FoodDetailModalProps {
  food: MenuItem | null;
  categories: Category[];
  restaurant: Restaurant;
  onClose: () => void;
}

export const FoodDetailModal: React.FC<FoodDetailModalProps> = ({
  food,
  categories,
  restaurant,
  onClose,
}) => {
  if (!food) return null;

  const categoryName = categories.find((c) => c.id === food.category_id)?.name || "Delicious Dish";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Content */}
        <motion.div
          id="food-detail-modal"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
        >
          {/* Close Button X */}
          <button
            id="close-food-modal-btn"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/50 text-white hover:bg-black/70 flex items-center justify-center backdrop-blur-sm transition-transform active:scale-90 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Large Food Image */}
          <div className="relative w-full h-64 sm:h-72 bg-gray-100 shrink-0">
            <img
              src={food.image_url}
              alt={food.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            {/* Dietary Badge */}
            <div className="absolute bottom-3 left-4 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 border border-gray-100">
              <span
                className={`w-3 h-3 rounded-full ${
                  food.vegetarian ? "bg-[#0C831F]" : "bg-red-600"
                }`}
              />
              <span className="text-xs font-bold text-[#1F1F1F]">
                {food.vegetarian ? "100% Vegetarian" : "Non-Vegetarian"}
              </span>
            </div>

            {/* Category tag */}
            <div className="absolute top-4 left-4 bg-[#F8CB46] text-[#1F1F1F] text-xs font-bold px-3 py-1 rounded-full shadow-sm">
              {categoryName}
            </div>
          </div>

          {/* Content Details */}
          <div className="p-6 overflow-y-auto space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#1F1F1F]">
                  {food.name}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {food.available ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0C831F]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Available Fresh
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Temporarily Unavailable
                    </span>
                  )}
                  {food.prep_time && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      {food.prep_time} mins
                    </span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-[#0C831F]">
                  {restaurant.currency_symbol || "₹"}
                  {food.price}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="pt-2 border-t border-gray-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#686868] mb-1.5">
                Taste & Preparation
              </h4>
              <p className="text-sm sm:text-base text-[#1F1F1F] leading-relaxed">
                {food.description || "Prepared fresh with supreme quality ingredients and traditional spices."}
              </p>
            </div>

            {/* Restaurant Info Reminder */}
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs text-[#686868]">
              <span>Made with love at {restaurant.name}</span>
              <span className="font-semibold text-[#1F1F1F]">Dine-In Menu</span>
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-full bg-[#1F1F1F] text-white hover:bg-black font-semibold text-sm transition-transform active:scale-95 cursor-pointer"
            >
              Back to Menu
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
