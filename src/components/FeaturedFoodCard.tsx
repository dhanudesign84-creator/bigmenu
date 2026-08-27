import React from "react";
import { motion } from "motion/react";
import { Sparkles, Clock } from "lucide-react";
import type { MenuItem, Restaurant } from "../types";

interface FeaturedFoodCardProps {
  food: MenuItem;
  restaurant: Restaurant;
  onSelect: (food: MenuItem) => void;
}

export const FeaturedFoodCard: React.FC<FeaturedFoodCardProps> = ({ food, restaurant, onSelect }) => {
  return (
    <div className="w-full overflow-x-hidden py-2">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1 rounded-md bg-[#F8CB46] text-[#1F1F1F]">
          <Sparkles className="w-4 h-4" />
        </div>
        <h2 className="text-xs sm:text-sm font-bold tracking-wider text-[#1F1F1F] uppercase">
          Chef's Highest-Priced Signature
        </h2>
      </div>

      {/* Featured Food Card - Moves Left to Right smoothly */}
      <motion.div
        id="featured-food-card"
        initial={{ x: -120, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{
          duration: 0.85,
          ease: [0.22, 1, 0.36, 1], // Smooth cubic-bezier without harsh bounce
        }}
        onClick={() => onSelect(food)}
        className="w-full cursor-pointer group bg-white rounded-[20px] border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col sm:flex-row items-stretch"
      >
        {/* Large Food Image */}
        <div className="relative w-full sm:w-2/5 h-48 sm:h-auto min-h-[180px] bg-gray-100 overflow-hidden">
          <img
            src={food.image_url}
            alt={food.name}
            loading="eager"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Badge: Vegetarian / Non-Vegetarian */}
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1.5 border border-gray-100">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                food.vegetarian ? "bg-[#0C831F]" : "bg-red-600"
              }`}
            />
            <span className="text-[11px] font-semibold text-[#1F1F1F]">
              {food.vegetarian ? "Pure Veg" : "Non-Veg"}
            </span>
          </div>

          <div className="absolute top-3 right-3 flex items-center gap-1.5 flex-wrap justify-end">
            {food.prep_time && (
              <div className="bg-white/95 backdrop-blur-xs text-[#1F1F1F] text-[10px] font-extrabold px-2 py-1 rounded-full shadow-sm flex items-center gap-1 border border-gray-100">
                <Clock className="w-3 h-3 text-gray-500" />
                <span>{food.prep_time} mins</span>
              </div>
            )}
            {!food.available && (
              <span className="bg-red-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                Unavailable
              </span>
            )}
            <div className="bg-[#F8CB46] text-[#1F1F1F] text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
              Featured
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5 sm:w-3/5 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base sm:text-lg font-bold text-[#1F1F1F] group-hover:text-[#0C831F] transition-colors line-clamp-1">
                {food.name}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[#686868] mt-1.5 line-clamp-2 leading-relaxed">
              {food.description}
            </p>
          </div>

          {/* Bottom Bar: Price and View Details */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-[#0C831F]">
                {restaurant.currency_symbol || "₹"}
                {food.price}
              </span>
            </div>

            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-50 text-[#1F1F1F] group-hover:bg-[#0C831F] group-hover:text-white transition-colors">
              View Details
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
