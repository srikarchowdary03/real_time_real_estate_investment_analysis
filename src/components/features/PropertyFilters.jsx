import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  SlidersHorizontal,
  ChevronDown,
  DollarSign,
  Bed,
  Bath,
  Home,
  Check,
  X,
} from "lucide-react";

export default function PropertyFilters({
  initial = { minPrice: "", maxPrice: "", beds: "", baths: "", type: [], status: "" },
  onApply,
  onClear,
  collapsible = true,
  syncToURL = true,
  className = "",
}) {
  const [local, setLocal] = useState(initial);
  const [open, setOpen] = useState(true);
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    setLocal(initial);
  }, [JSON.stringify(initial)]);

  const TYPES = ["Single Family", "Condo", "Townhouse", "Multi-Family", "Land"];
  const BED_OPTS = ["", "1", "2", "3", "4", "5"];
  const BATH_OPTS = ["", "1", "2", "3", "4"];
  const STATUS = ["For Sale", "Sold", "Pending"];

  const activeCount = useMemo(() => {
    let n = 0;
    if (local.minPrice !== "" && local.minPrice != null) n++;
    if (local.maxPrice !== "" && local.maxPrice != null) n++;
    if (local.beds !== "" && local.beds != null) n++;
    if (local.baths !== "" && local.baths != null) n++;
    if (local.type && local.type.length) n++;
    if (local.status) n++;
    return n;
  }, [local]);

  const writeQueryParams = (next) => {
    if (!syncToURL) return;
    const qp = new URLSearchParams(params);
    const setOrDel = (key, val) => {
      if (val === "" || val == null || (Array.isArray(val) && val.length === 0)) {
        qp.delete(key);
      } else {
        qp.set(key, Array.isArray(val) ? val.join(",") : String(val));
      }
    };
    setOrDel("minPrice", next.minPrice);
    setOrDel("maxPrice", next.maxPrice);
    setOrDel("beds", next.beds);
    setOrDel("baths", next.baths);
    setOrDel("type", next.type);
    setOrDel("status", next.status);
    setParams(qp, { replace: true });
  };

  const handleApply = (e) => {
    e?.preventDefault?.();
    writeQueryParams(local);
    onApply?.({ ...local });
  };

  const handleClear = () => {
    const cleared = { minPrice: "", maxPrice: "", beds: "", baths: "", type: [], status: "" };
    setLocal(cleared);
    writeQueryParams(cleared);
    onClear?.();
  };

  const toggleType = (t) => {
    setLocal((f) => {
      const exists = f.type.includes(t);
      return { ...f, type: exists ? f.type.filter((x) => x !== t) : [...f.type, t] };
    });
  };

  const Chip = ({ active, children, onClick, ariaLabel }) => (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition",
        active
          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
        "focus:outline-none focus:ring-2 focus:ring-slate-300",
      ].join(" ")}
    >
      {active ? <Check className="h-4 w-4" /> : null}
      {children}
    </button>
  );

  const Segmented = ({ value, setValue, options, anyLabel = "Any", name }) => (
    <div className="flex flex-wrap gap-2">
      <Chip
        active={value === ""}
        onClick={() => setValue("")}
        ariaLabel={`${name}: Any`}
      >
        {anyLabel}
      </Chip>
      {options
        .filter((v) => v !== "")
        .map((v) => (
          <Chip
            key={v}
            active={value === v}
            onClick={() => setValue(v)}
            ariaLabel={`${name}: ${v}+`}
          >
            {v}+
          </Chip>
        ))}
    </div>
  );

  return (
    <aside
      className={[
        "rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm",
        "p-4 md:p-5 sticky top-4",
        className,
      ].join(" ")}
    >

      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
          {activeCount > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-[11px] font-semibold text-white">
              {activeCount}
            </span>
          )}
        </div>

        {collapsible && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 ring-1 ring-slate-200 md:hidden"
            aria-expanded={open}
          >
            {open ? "Hide" : "Show"} <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      <form
        onSubmit={handleApply}
        className={[
          collapsible ? (open ? "block" : "hidden md:block") : "",
          "space-y-5",
        ].join(" ")}
      >
        <section>
          <label className="mb-2 block text-sm font-medium text-slate-800">
            Price range
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                <DollarSign className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={local.minPrice}
                onChange={(e) => setLocal((f) => ({ ...f, minPrice: e.target.value }))}
                placeholder="Min"
                className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 shadow-xs focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                <DollarSign className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={local.maxPrice}
                onChange={(e) => setLocal((f) => ({ ...f, maxPrice: e.target.value }))}
                placeholder="Max"
                className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 shadow-xs focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>
        </section>

        <section>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-800">
            <Bed className="h-4 w-4 text-slate-500" />
            Bedrooms
          </label>
          <Segmented
            name="Bedrooms"
            value={local.beds}
            setValue={(v) => setLocal((f) => ({ ...f, beds: v }))}
            options={BED_OPTS}
            anyLabel="Any"
          />
        </section>

        <section>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-800">
            <Bath className="h-4 w-4 text-slate-500" />
            Bathrooms
          </label>
          <Segmented
            name="Bathrooms"
            value={local.baths}
            setValue={(v) => setLocal((f) => ({ ...f, baths: v }))}
            options={BATH_OPTS}
            anyLabel="Any"
          />
        </section>

        <section>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-800">
            <Home className="h-4 w-4 text-slate-500" />
            Property type
          </label>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => {
              const active = local.type.includes(t);
              return (
                <Chip
                  key={t}
                  active={active}
                  onClick={() => toggleType(t)}
                  ariaLabel={`Type: ${t}`}
                >
                  {t}
                </Chip>
              );
            })}
          </div>
        </section>

        <section>
          <label className="mb-2 block text-sm font-medium text-slate-800">Status</label>
          <div className="flex flex-wrap gap-2">
            <Chip
              active={local.status === ""}
              onClick={() => setLocal((f) => ({ ...f, status: "" }))}
              ariaLabel="Status: Any"
            >
              Any
            </Chip>
            {STATUS.map((s) => (
              <Chip
                key={s}
                active={local.status === s}
                onClick={() => setLocal((f) => ({ ...f, status: s }))}
                ariaLabel={`Status: ${s}`}
              >
                {s}
              </Chip>
            ))}
          </div>
        </section>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
            aria-label="Apply filters"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
            aria-label="Clear all filters"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        </div>
      </form>
    </aside>
  );
}
