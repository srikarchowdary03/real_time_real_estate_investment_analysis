import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SearchBar from "../components/common/SearchBar";

const HEADER_OFFSET = 72;

export default function Properties() {
  const [params, setParams] = useSearchParams();
  const qParam = params.get("q") ?? "";
  const [query, setQuery] = useState(qParam);
  const [docked, setDocked] = useState(Boolean(qParam));
  const barRef = useRef(null);

  const syncURL = (val) => {
    const next = new URLSearchParams(params);
    if (val) next.set("q", val);
    else next.delete("q");
    setParams(next, { replace: true });
  };

  const runSearch = () => {
    const trimmed = query.trim();
    syncURL(trimmed);
    setDocked(Boolean(trimmed));
  };

  useEffect(() => {
    const nextQ = params.get("q") ?? "";
    if (nextQ !== query) setQuery(nextQ);
    setDocked(Boolean(nextQ));
  }, [params]);

  useEffect(() => {
    function onDocClick(e) {
      if (!docked) return;
      if (query.trim()) return;
      if (barRef.current && !barRef.current.contains(e.target)) {
        setDocked(false);
      }
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
                  onEmptyRequest={() => setDocked(false)}
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
                  onEmptyRequest={() => setDocked(false)}
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

        <div style={{ height: docked ? HEADER_OFFSET : 0 }} />
        <div className="pb-24" />
      </div>
    </div>
  );
}
