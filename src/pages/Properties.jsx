import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SearchBar from "../components/common/SearchBar";
import PropertyCard from "../components/common/propertycard";

const HEADER_OFFSET = 72;

const MOCK = [
  { id: "p1", title: "Modern Family Home", address: "24 Lakeview Dr", city: "Boston", state: "MA", price: 785000, beds: 4, baths: 3, area: 2100, type: "House", image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1600&auto=format&fit=crop", listedAt: "2025-09-12" },
  { id: "p2", title: "City View Apartment", address: "18 Beacon St", city: "Boston", state: "MA", price: 545000, beds: 2, baths: 2, area: 1050, type: "Condo", image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1600&auto=format&fit=crop", listedAt: "2025-10-02" },
  { id: "p3", title: "Cozy Starter Home", address: "77 Maple Ave", city: "Cambridge", state: "MA", price: 499000, beds: 3, baths: 1, area: 1280, type: "House", image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1600&auto=format&fit=crop", listedAt: "2025-09-30" },
  { id: "p4", title: "Luxury Loft", address: "10 Seaport Blvd", city: "Boston", state: "MA", price: 1150000, beds: 3, baths: 3, area: 1800, type: "Condo", image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1600&auto=format&fit=crop", listedAt: "2025-10-06" },
  { id: "p5", title: "Riverside Townhouse", address: "5 Charlesbank Rd", city: "Somerville", state: "MA", price: 869000, beds: 3, baths: 2, area: 1500, type: "Townhouse", image: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c16e?q=80&w=1600&auto=format&fit=crop", listedAt: "2025-08-29" },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

export default function Properties() {
  const [params, setParams] = useSearchParams();
  const qParam = params.get("q") ?? "";
  const [query, setQuery] = useState(qParam);
  const [docked, setDocked] = useState(Boolean(qParam));
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const barRef = useRef(null);

  const syncURL = (val) => {
    const next = new URLSearchParams(params);
    if (val) next.set("q", val); else next.delete("q");
    setParams(next, { replace: true });
  };

  const fakeFetch = (q) =>
    new Promise((res) => {
      const key = (q || "").toLowerCase();
      const data = MOCK.filter((p) =>
        [p.title, p.address, p.city, p.state, p.type].some((s) => s.toLowerCase().includes(key))
      );
      setTimeout(() => res(data), 700);
    });

  const runSearch = async () => {
    const trimmed = query.trim();
    syncURL(trimmed);
    setDocked(Boolean(trimmed));
    if (!trimmed) {
      setResults([]);
      return;
    }
    setLoading(true);
    const data = await fakeFetch(trimmed);
    setResults(data);
    setLoading(false);
  };

  useEffect(() => {
    const nextQ = params.get("q") ?? "";
    if (nextQ !== query) setQuery(nextQ);
    setDocked(Boolean(nextQ));
    if (nextQ) {
      setLoading(true);
      fakeFetch(nextQ).then((d) => { setResults(d); setLoading(false); });
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    function onDocClick(e) {
      if (!docked) return;
      if (query.trim()) return;
      if (barRef.current && !barRef.current.contains(e.target)) setDocked(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [docked, query]);

  return (
    <div className="min-h-[100dvh] bg-white">
      <AnimatePresence initial={false}>
        {docked && (
          <motion.div
            key="topbar"
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="sticky z-20 border-b bg-white/95 backdrop-blur"
            style={{ top: HEADER_OFFSET }}
          >
            <div className="mx-auto max-w-6xl px-4 py-3">
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="flex items-center justify-center"
                ref={barRef}
              >
                <SearchBar
                  value={query}
                  onChange={setQuery}
                  onSubmit={runSearch}
                  onEmptyRequest={() => { setDocked(false); setResults([]); syncURL(""); }}
                  size="sm"
                  layoutId="main-search"
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-6xl px-4">
        <div className="grid min-h-[60vh] place-items-center">
          <AnimatePresence initial={false} mode="wait">
            {!docked && (
              <motion.div
                key="centered"
                layout
                initial={{ opacity: 0, scale: 0.98, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -12 }}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
                className="w-full"
              >
                <div className="mb-6 text-center">
                  <motion.h1
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.05, type: "spring", stiffness: 250, damping: 22 }}
                    className="text-2xl font-semibold tracking-tight text-gray-900"
                  >
                    Find your property
                  </motion.h1>
                  <motion.p
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.12, type: "spring", stiffness: 250, damping: 22 }}
                    className="mt-2 text-sm text-gray-500"
                  >
                    Search by city, address, or keyword
                  </motion.p>
                </div>

                <SearchBar
                  value={query}
                  onChange={setQuery}
                  onSubmit={runSearch}
                  onEmptyRequest={() => { setDocked(false); setResults([]); syncURL(""); }}
                  size="lg"
                  layoutId="main-search"
                />

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="mt-3 text-center text-xs text-gray-400"
                >
                  Press <kbd className="rounded border bg-gray-50 px-1">Enter</kbd> to search
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence initial={false}>
          {docked && (
            <motion.section
              key="results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="pb-20"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {loading ? "Searching…" : `${results.length} ${results.length === 1 ? "result" : "results"}`}
                  {query ? ` for “${query}”` : ""}
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-64 animate-pulse rounded-2xl bg-gradient-to-b from-gray-100 to-gray-50"
                    />
                  ))}
                </div>
              ) : results.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-12 text-center text-gray-500">
                  No matching properties.
                </div>
              ) : (
                <motion.ul
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {results.map((p) => (
                    <li key={p.id}>
                      <PropertyCard property={p} />
                    </li>
                  ))}
                </motion.ul>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        <div style={{ height: docked ? HEADER_OFFSET : 0 }} />
      </div>
    </div>
  );
}
