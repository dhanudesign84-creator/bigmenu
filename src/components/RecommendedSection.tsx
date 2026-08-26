import React from "react";
import { motion } from "motion/react";
import { ThumbsUp } from "lucide-react";
import type { MenuItem, Restaurant } from "../types";

interface RecommendedSectionProps {
  items: MenuItem[];
  restaurant: Restaurant;
  onSelect: (food: MenuItem) => void;
}

export const RecommendedSection: React.FC<RecommendedSectionProps> = ({ items, restaurant, onSelect }) => {
  if (!items || items.length === 0) return null;

  return (
    <section className="my-6">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="p-1 rounded-md bg-[#0C831F]/10 text-[#0C831F]">
          <ThumbsUp className="w-4 h-4" />
        </div>
        <h2 className="text-xs sm:text-sm font-bold tracking-wider text-[#1F1F1F] uppercase">
          Recommended For You
        </h2>
      </div>

      {/* Horizontal Scroll Container for smooth browsing */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {items.map((food, idx) => (
          <motion.div
            key={food.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
            onClick={() => onSelect(food)}
            className="shrink-0 w-64 sm:w-72 bg-white rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col justify-between group"
          >
            {/* Image Banner */}
            <div className="relative h-36 w-full bg-gray-100 overflow-hidden">
              <img
                src={food.image_url}
                alt={food.name}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs border border-gray-100">
                <span
                  className={`w-2 h-2 rounded-full ${
                    food.vegetarian ? "bg-[#0C831F]" : "bg-red-600"
                  }`}
                />
                <span className="text-[10px] font-semibold text-[#1F1F1F]">
                  {food.vegetarian ? "Veg" : "Non-Veg"}
                </span>
              </div>
              {!food.available && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    Unavailable
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-3.5 flex flex-col justify-between flex-1">
              <div>
                <h3 className="font-bold text-sm text-[#1F1F1F] group-hover:text-[#0C831F] transition-colors line-clamp-1">
                  {food.name}
                </h3>
                <p className="text-xs text-[#686868] mt-1 line-clamp-2 leading-relaxed">
                  {food.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-base font-extrabold text-[#0C831F]">
                  {restaurant.currency_symbol || "₹"}
                  {food.price}
                </span>
                <span className="text-[11px] font-medium text-gray-500 group-hover:text-[#1F1F1F]">
                  Tap to view
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
