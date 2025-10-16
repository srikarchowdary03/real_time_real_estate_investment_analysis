import React from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

export default function SearchBar({ value, onChange, onSubmit, onEmptyRequest, size = "lg", layoutId }) {
  const isLg = size === "lg";

  const handleSubmit = () => {
    const trimmed = (value ?? "").trim();
    if (!trimmed) onEmptyRequest?.();
    onSubmit();
  };

  const handleBlur = () => {
    if (!(value ?? "").trim()) onEmptyRequest?.();
  };

  return (
    <motion.div
      layoutId={layoutId}
      layout
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      className={isLg ? "mx-auto w-full sm:w-3/4 md:w-2/3" : "mx-auto w-full sm:w-2/3 md:w-1/2"}
    >
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          onBlur={handleBlur}
          placeholder="Search by city, address, or keyword…"
          className={
            "w-full rounded-2xl border border-gray-300 bg-white pr-28 outline-none ring-0 transition-colors focus:border-gray-400 " +
            (isLg ? "px-5 py-4 pl-12 text-base" : "px-4 py-3 pl-11 text-sm")
          }
        />
        <Search
          className={
            "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 " +
            (isLg ? "h-5 w-5" : "h-4 w-4")
          }
        />
      </div>
    </motion.div>
  );
}
