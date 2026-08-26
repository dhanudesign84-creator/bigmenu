import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { UtensilsCrossed, ChevronRight } from "lucide-react";
import type { Restaurant } from "../types";

interface CustomerIntroProps {
  restaurant: Restaurant;
  onComplete: () => void;
}

export const CustomerIntro: React.FC<CustomerIntroProps> = ({ restaurant, onComplete }) => {
  return (
    <AnimatePresence>
      <motion.div
        id="customer-intro-overlay"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#1F1F1F] text-white px-6 overflow-hidden"
      >
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(248,203,70,0.15)_0,transparent_70%)] pointer-events-none" />

        <div className="relative z-10 max-w-sm w-full text-center flex flex-col items-center">
          {/* Logo icon with subtle pulse */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-20 h-20 rounded-2xl bg-[#F8CB46] text-[#1F1F1F] flex items-center justify-center shadow-2xl mb-6 font-bold"
          >
            <UtensilsCrossed className="w-10 h-10 stroke-[2.2]" />
          </motion.div>

          {/* Restaurant Name - Starts slightly smaller, opacity 0, fades in and moves upward ~20px over 700ms */}
          <motion.h1
            id="intro-restaurant-name"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3 uppercase"
          >
            {restaurant.name || "ADITYA RESTAURANT"}
          </motion.h1>

          {/* Subtitle - appears approx 200ms later */}
          <motion.p
            id="intro-restaurant-subtitle"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-sm sm:text-base font-medium text-[#F8CB46] tracking-wide mb-8"
          >
            {restaurant.subtitle || "Fresh • Delicious • Made With Love"}
          </motion.p>

          {/* Quick enter button */}
          <motion.button
            id="intro-explore-menu-btn"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.8 }}
            onClick={onComplete}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#0C831F] hover:bg-[#0a6e1a] text-white font-semibold text-sm transition-all shadow-lg active:scale-95 cursor-pointer"
          >
            <span>Explore Digital Menu</span>
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
