import React from "react";
import { motion } from "framer-motion";
import { BedDouble, Bath, Home as HomeIcon, MapPin } from "lucide-react";

const itemVariants = {
  hidden: { opacity: 0, y: 22, scale: 0.98, rotateX: -6 },
  show: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: { type: "spring", stiffness: 400, damping: 28 } },
};

export default function PropertyCard({ property }) {
  const { image, title, address, city, state, price, beds, baths, area, type, listedAt } = property;

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -6 }}
      className="group relative rounded-2xl bg-gradient-to-b from-gray-50 to-white p-[1px] shadow-sm"
      style={{ perspective: 1200 }}
    >
      <div className="rounded-2xl bg-white">
        <div className="relative h-44 w-full overflow-hidden rounded-t-2xl">
          <motion.img
            src={image}
            alt={title}
            initial={{ scale: 1.03 }}
            whileHover={{ scale: 1.06 }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
            className="h-full w-full object-cover"
          />
          <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold backdrop-blur-sm">
            {type}
          </span>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>

        <div className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h4 className="line-clamp-1 text-base font-semibold tracking-tight">{title}</h4>
            <div className="shrink-0 text-right">
              <div className="whitespace-nowrap text-sm font-bold text-red-600">${price.toLocaleString()}</div>
              <div className="text-[10px] text-gray-400">Listed {new Date(listedAt).toLocaleDateString()}</div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{address}, {city}, {state}</span>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-700">
            <span className="inline-flex items-center gap-1"><BedDouble className="h-4 w-4" /> {beds} bd</span>
            <span className="inline-flex items-center gap-1"><Bath className="h-4 w-4" /> {baths} ba</span>
            <span className="inline-flex items-center gap-1"><HomeIcon className="h-4 w-4" /> {area.toLocaleString()} sqft</span>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-3 -bottom-4 z-[-1] h-8 rounded-2xl bg-black/5 blur-xl transition-opacity duration-300 group-hover:opacity-70" />
    </motion.div>
  );
}
