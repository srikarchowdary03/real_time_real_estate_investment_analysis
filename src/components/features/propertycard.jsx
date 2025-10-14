import React, { useMemo, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const BedIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="currentColor"
      d="M3 7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3h6a2 2 0 0 1 2 2v6h-2v-2H5v2H3V7zm2 7h16v-2a1 1 0 0 0-1-1h-7V7H5v7z"
    />
  </svg>
);
const BathIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="currentColor"
      d="M7 3a3 3 0 0 1 3 3v1h8a2 2 0 0 1 2 2v4.5a3.5 3.5 0 0 1-3 3.465V19a2 2 0 1 1-2 0v-1H9v1a2 2 0 1 1-2 0v-1.035A3.5 3.5 0 0 1 4 13.5V12h2v1.5a1.5 1.5 0 1 0 3 0V7.5A1.5 1.5 0 0 0 7.5 6H7a1 1 0 0 1 0-2h.5z"
    />
  </svg>
);
const AreaIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="currentColor"
      d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 2v10h14V7H5zm3 2h2v6H8V9zm6 0h2v6h-2V9z"
    />
  </svg>
);

const HeartIcon = ({ className, filled = false }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.9 0 3.5 1.02 4.28 2.5C11.56 5.02 13.16 4 15.05 4 17.5 4 19.5 6 19.5 8.5c0 3.78-3.33 6.83-8.55 11.53L12 21.35z"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.6}
    />
  </svg>
);

const Badge = ({ children, tone = "neutral", className = "" }) => {
  const tones = {
    neutral: "bg-slate-100 text-slate-700 ring-slate-200",
    brand: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    danger: "bg-rose-50 text-rose-700 ring-rose-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
};

const FALLBACK_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='#eef2ff'/><stop offset='100%' stop-color='#e2e8f0'/>
        </linearGradient>
      </defs>
      <rect width='100%' height='100%' fill='url(#g)' />
      <g fill='#475569' font-family='system-ui, -apple-system, Segoe UI, Roboto' text-anchor='middle'>
        <text x='200' y='150' font-size='18' font-weight='600'>No Photo Available</text>
      </g>
    </svg>`
  );

function formatPrice(value) {
  if (value == null) return "";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `$${Number(value).toLocaleString()}`;
  }
}

export default function PropertyCard({ property, className = "" }) {
  const {
    id,
    price,
    address1,
    address2,
    city,
    state,
    zip,
    beds,
    baths,
    sqft,
    images,
    propertyType,
    isNew,
    hasPriceDrop,
    favorite,
  } = property || {};

  const [imgSrc, setImgSrc] = useState(
    images && images.length > 0 ? images[0] : FALLBACK_SVG
  );
  const [isFav, setIsFav] = useState(Boolean(favorite));

  const handleImgError = useCallback(() => {
    setImgSrc(FALLBACK_SVG);
  }, []);

  const statusBadge = useMemo(() => {
    if (hasPriceDrop) return <Badge tone="danger">PRICE DROP</Badge>;
    if (isNew) return <Badge tone="success">NEW</Badge>;
    return null;
  }, [hasPriceDrop, isNew]);

  const typeBadge = useMemo(() => {
    if (!propertyType) return null;
    return <Badge tone="brand">{propertyType}</Badge>;
  }, [propertyType]);

  const onHeartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFav((v) => !v);
  };

  const priceText = formatPrice(price);
  const fullAddressLine1 = address1 || "";
  const fullAddressLine2 = [address2, city, state, zip].filter(Boolean).join(", ");

  return (
    <Link
      to={`/property/${id}`}
      className={`group block rounded-2xl overflow-hidden ring-1 ring-slate-200 bg-white hover:shadow-xl hover:ring-slate-300 transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${className}`}
      aria-label={`View property at ${fullAddressLine1}, ${fullAddressLine2}`}
    >
      <div className="relative">
        <img
          src={imgSrc}
          onError={handleImgError}
          alt={fullAddressLine1 ? `Photo of ${fullAddressLine1}` : "Property photo"}
          className="w-full aspect-[4/3] object-cover md:h-[300px] md:w-[400px] md:max-w-full"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          {statusBadge}
          {typeBadge}
        </div>
        <button
          onClick={onHeartClick}
          aria-pressed={isFav}
          aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
          className={`absolute top-3 right-3 inline-flex items-center justify-center h-10 w-10 rounded-full backdrop-blur-md ring-1 shadow-md transition transform-gpu hover:shadow-lg hover:scale-105 active:scale-95 ${
            isFav ? "bg-rose-50 text-rose-600 ring-rose-200" : "bg-white/85 text-slate-700 ring-slate-200 hover:bg-white"
          }`}
        >
          <HeartIcon className="h-5 w-5" filled={isFav} />
        </button>
      </div>
      <div className="p-4 md:p-5">
        <div className="flex items-baseline gap-2">
          <div className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            {priceText}
          </div>
          {hasPriceDrop && (
            <span className="text-xs font-medium text-rose-600">Price reduced</span>
          )}
        </div>
        <div className="mt-1 text-sm md:text-[15px] text-slate-700">
          <div className="line-clamp-1">{fullAddressLine1}</div>
          <div className="line-clamp-1 text-slate-500">{fullAddressLine2}</div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-slate-700">
          <span className="inline-flex items-center gap-1.5">
            <BedIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{beds ?? "—"}</span>
            <span className="text-xs text-slate-500 ml-0.5">bd</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BathIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{baths ?? "—"}</span>
            <span className="text-xs text-slate-500 ml-0.5">ba</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <AreaIcon className="h-4 w-4" />
            <span className="text-sm font-medium">
              {sqft ? sqft.toLocaleString() : "—"}
            </span>
            <span className="text-xs text-slate-500 ml-0.5">sqft</span>
          </span>
        </div>
      </div>
      <div className="h-0.5 w-0 bg-indigo-500 group-hover:w-full transition-all duration-300" />
    </Link>
  );
}

PropertyCard.propTypes = {
  property: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    price: PropTypes.number,
    address1: PropTypes.string,
    address2: PropTypes.string,
    city: PropTypes.string,
    state: PropTypes.string,
    zip: PropTypes.string,
    beds: PropTypes.number,
    baths: PropTypes.number,
    sqft: PropTypes.number,
    images: PropTypes.arrayOf(PropTypes.string),
    propertyType: PropTypes.string,
    isNew: PropTypes.bool,
    hasPriceDrop: PropTypes.bool,
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    favorite: PropTypes.bool,
  }).isRequired,
  className: PropTypes.string,
};
