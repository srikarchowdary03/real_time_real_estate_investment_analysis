import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PropertyCard from "../components/features/PropertyCard";

const PAGE_SIZE = 9;

const MOCK = [
  { id: "p1", title: "Harbor Point Apartments", address: "24 Lakeview Dr", city: "Boston", state: "MA", price: 785000, beds: 4, baths: 3, area: 2100, type: "Single Family", image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1600&auto=format&fit=crop", listedAt: "2025-09-12" },
  { id: "p2", title: "City View Apartment", address: "18 Beacon St", city: "Boston", state: "MA", price: 545000, beds: 2, baths: 2, area: 1050, type: "Condo", image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1600&auto=format&fit=crop", listedAt: "2025-10-02" },
  { id: "p3", title: "Cozy Starter Home", address: "77 Maple Ave", city: "Cambridge", state: "MA", price: 499000, beds: 3, baths: 1, area: 1280, type: "Single Family", image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1600&auto=format&fit=crop", listedAt: "2025-09-30" },
  { id: "p4", title: "Luxury Loft", address: "10 Seaport Blvd", city: "Boston", state: "MA", price: 1150000, beds: 3, baths: 3, area: 1800, type: "Condo", image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1600&auto=format&fit=crop", listedAt: "2025-10-06" },
  { id: "p5", title: "Riverside Townhouse", address: "5 Charlesbank Rd", city: "Somerville", state: "MA", price: 869000, beds: 3, baths: 2, area: 1500, type: "Townhouse", image: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c16e?q=80&w=1600&auto=format&fit=crop", listedAt: "2025-08-29" },
];

const BIG_MOCK = Array.from({ length: 10 }).map((_, i) => {
  const base = MOCK[i % MOCK.length];
  return {
    ...base,
    id: `${base.id}-${i + 1}`,
    price: base.price + (i % 7) * 4000 - (i % 3) * 2500,
    beds: base.beds + (i % 2 === 0 ? 0 : 1),
    area: base.area + (i % 5) * 40,
    listedAt: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
  };
});

const SORTS = {
  "price-asc": { label: "Price: Low-High", fn: (a, b) => a.price - b.price },
  "price-desc": { label: "Price: High-Low", fn: (a, b) => b.price - a.price },
  "newest": { label: "Newest", fn: (a, b) => new Date(b.listedAt) - new Date(a.listedAt) },
  "beds-desc": { label: "Beds", fn: (a, b) => b.beds - a.beds || b.price - a.price },
};

function toCardShape(raw) {
  return {
    id: raw.id,
    price: raw.price,
    address1: raw.address,
    city: raw.city,
    state: raw.state,
    beds: raw.beds,
    baths: raw.baths,
    sqft: raw.area,
    images: [raw.image],
    propertyType: raw.type,
    isNew: new Date() - new Date(raw.listedAt) < 14 * 24 * 60 * 60 * 1000,
    hasPriceDrop: false,
  };
}

async function fakeApiFetch({ location, page, pageSize, sortKey, filters }) {
  let rows = BIG_MOCK;

  if (location) {
    const key = location.toLowerCase();
    rows = rows.filter((p) =>
      [p.title, p.address, p.city, p.state, p.type].some((s) => s.toLowerCase().includes(key))
    );
  }

  if (filters.minPrice != null) rows = rows.filter((p) => p.price >= filters.minPrice);
  if (filters.maxPrice != null) rows = rows.filter((p) => p.price <= filters.maxPrice);
  if (filters.beds != null) rows = rows.filter((p) => p.beds >= filters.beds);
  if (filters.baths != null) rows = rows.filter((p) => p.baths >= filters.baths);
  if (filters.type && filters.type.length) rows = rows.filter((p) => filters.type.includes(p.type));

  const sorter = SORTS[sortKey] ?? SORTS["newest"];
  rows = rows.slice().sort(sorter.fn);

  const total = rows.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const items = rows.slice(start, end).map(toCardShape);
  await new Promise((r) => setTimeout(r, 600));
  return { items, total, hasMore: end < total };
}

export default function PropertySearch() {
  const [params, setParams] = useSearchParams();
  const locationParam = params.get("location") || params.get("q") || "";
  const [query, setQuery] = useState(locationParam);
  const [view, setView] = useState("grid");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [filters, setFilters] = useState({ minPrice: "", maxPrice: "", beds: "", baths: "", type: [] });
  const abortRef = useRef(null);

  const appliedFilters = useMemo(() => ({
    minPrice: filters.minPrice === "" ? null : Number(filters.minPrice),
    maxPrice: filters.maxPrice === "" ? null : Number(filters.maxPrice),
    beds: filters.beds === "" ? null : Number(filters.beds),
    baths: filters.baths === "" ? null : Number(filters.baths),
    type: filters.type,
  }), [filters]);

  function updateURL(nextQuery) {
    const next = new URLSearchParams(params);
    if (nextQuery) next.set("location", nextQuery); else next.delete("location");
    setParams(next, { replace: true });
  }

  async function load(reset = false) {
    setErr("");
    setLoading(true);
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fakeApiFetch({
        location: query.trim(),
        page: reset ? 1 : page,
        pageSize: PAGE_SIZE,
        sortKey: sort,
        filters: appliedFilters,
      });
      if (reset) {
        setItems(res.items);
        setPage(1);
      } else {
        setItems((prev) => [...prev, ...res.items]);
      }
      setTotal(res.total);
      setHasMore(res.hasMore);
    } catch {
      setErr("Something went wrong while fetching properties.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (locationParam !== query) setQuery(locationParam);
  }, [locationParam]);

  useEffect(() => {
    load(true);
  }, [sort, JSON.stringify(appliedFilters), query]);

  function onApplyFilters(e) {
    e.preventDefault();
    updateURL(query.trim());
    load(true);
  }

  function clearFilters() {
    setFilters({ minPrice: "", maxPrice: "", beds: "", baths: "", type: [] });
  }

  const gridCols = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5";

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Property Search</h1>
          <p className="text-sm text-slate-500">
            {total} {total === 1 ? "property" : "properties"}{query ? ` for “${query}”` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg ring-1 ring-slate-200 p-0.5">
            <button
              onClick={() => setView("grid")}
              className={`px-3 py-1.5 text-sm rounded-md ${view === "grid" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}
            >
              Grid
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 text-sm rounded-md ${view === "list" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}
            >
              List
            </button>
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-md border-slate-300 text-sm"
          >
            {Object.entries(SORTS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <aside className="md:col-span-1">
          <form onSubmit={onApplyFilters} className="rounded-2xl border p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Location</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="City, address, etc."
                className="mt-1 w-full rounded-md border-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">Min price</label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
                  className="mt-1 w-full rounded-md border-slate-300"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Max price</label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
                  className="mt-1 w-full rounded-md border-slate-300"
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">Beds (min)</label>
                <input
                  type="number"
                  value={filters.beds}
                  onChange={(e) => setFilters((f) => ({ ...f, beds: e.target.value }))}
                  className="mt-1 w-full rounded-md border-slate-300"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Baths (min)</label>
                <input
                  type="number"
                  value={filters.baths}
                  onChange={(e) => setFilters((f) => ({ ...f, baths: e.target.value }))}
                  className="mt-1 w-full rounded-md border-slate-300"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Type</label>
              <div className="mt-1 grid grid-cols-2 gap-2 text-sm text-slate-700">
                {["Single Family", "Condo", "Townhouse"].map((t) => {
                  const checked = filters.type.includes(t);
                  return (
                    <label key={t} className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setFilters((f) => ({
                            ...f,
                            type: e.target.checked ? [...f.type, t] : f.type.filter((x) => x !== t),
                          }))
                        }
                      />
                      {t}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="flex-1 rounded-md bg-slate-900 px-3 py-2 text-white text-sm">
                Apply
              </button>
              <button type="button" onClick={clearFilters} className="rounded-md px-3 py-2 text-sm ring-1 ring-slate-300">
                Reset
              </button>
            </div>
          </form>
        </aside>

        <main className="md:col-span-3">
          {err && (
            <div className="mb-4 rounded-md bg-rose-50 p-3 text-rose-700 ring-1 ring-rose-200">
              {err}
            </div>
          )}

          {loading && items.length === 0 ? (
            <div className={gridCols}>
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl bg-gradient-to-b from-gray-100 to-gray-50" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-12 text-center text-slate-500">
              No properties found.
            </div>
          ) : view === "grid" ? (
            <ul className={gridCols}>
              {items.map((p) => (
                <li key={p.id}>
                  <PropertyCard property={p} />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-4">
              {items.map((p) => (
                <li key={p.id} className="rounded-2xl ring-1 ring-slate-200 overflow-hidden bg-white">
                  <a href={`/property/${p.id}`} className="flex flex-col sm:flex-row">
                    <img
                      src={p.images?.[0]}
                      alt={p.address1}
                      className="h-48 w-full sm:h-40 sm:w-56 object-cover"
                      loading="lazy"
                    />
                    <div className="flex-1 p-4">
                      <div className="text-lg font-semibold">
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(p.price)}
                      </div>
                      <div className="text-sm text-slate-700">{p.address1}</div>
                      <div className="text-sm text-slate-500">{[p.city, p.state].filter(Boolean).join(", ")}</div>
                      <div className="mt-2 text-sm text-slate-700">
                        {p.beds ?? "—"} bd • {p.baths ?? "—"} ba • {p.sqft ? p.sqft.toLocaleString() : "—"} sqft
                      </div>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex items-center justify-center">
            {hasMore && (
              <button
                disabled={loading}
                onClick={async () => {
                  setPage((n) => n + 1);
                  setLoading(true);
                  try {
                    const res = await fakeApiFetch({
                      location: query.trim(),
                      page: page + 1,
                      pageSize: PAGE_SIZE,
                      sortKey: sort,
                      filters: appliedFilters,
                    });
                    setItems((prev) => [...prev, ...res.items]);
                    setHasMore(res.hasMore);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
              >
                {loading ? "Loading…" : "Load more"}
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
