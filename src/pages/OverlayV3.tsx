import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FullCanvas } from "@/components/ecosystem/FullCanvas";
import { useProjects } from "@/hooks/useProjects";

// ── NS Flag SVG ──
const NSFlag = ({ size = 10 }: { size?: number }) => (
  <svg width={size} height={size * 0.7} viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.04883 0C14.4015 1.58136e-05 18.0466 0.857342 21.4111 0.857422C24.5739 0.857419 26.8592 0.730968 29.0273 0.478516C29.2469 0.453142 29.4413 0.621298 29.4414 0.838867V19.2832C29.4411 19.4516 29.323 19.5976 29.1543 19.626C27.6623 19.8749 24.1475 20 21.4111 20C18.4798 19.9999 14.1466 19.1426 9.55859 19.1426C5.14747 19.1426 2.72034 19.3956 0.432617 19.7822C0.207077 19.8203 0.000341557 19.6499 0 19.4248V1.0332C3.69636e-05 0.851129 0.136849 0.697243 0.320312 0.673828C2.56107 0.389876 5.35291 0 9.04883 0ZM13.4951 8.76074C11.9493 8.65328 10.6111 8.66895 9.43164 8.66895V11.1475C10.2548 11.1475 11.7426 11.1495 13.4922 11.2998C13.4903 13.3072 13.492 15.0743 13.5088 15.4326C14.1458 15.5754 14.5286 15.5754 15.791 15.8018V11.5508C17.549 11.7554 18.8433 11.8613 20.1377 11.8613V9.29004C18.7357 9.29004 17.6985 9.187 15.791 8.98242V4.79199C15.7758 4.78999 14.1434 4.57627 13.5088 4.57617C13.5086 4.61678 13.5007 6.53989 13.4951 8.76074Z" fill="currentColor" />
  </svg>
);

// ── Variant C: "Contextual Fade" ──
// All overlay elements fade to near-invisible after 3s of inactivity, reappearing on
// mouse movement. Ultra-thin frosted-glass strip spans full width at top with everything
// inline. Stats as subtle watermark bottom-left. Credits from a "?" icon bottom-right.

const OverlayV3: React.FC = () => {
  const navigate = useNavigate();
  const { data: projects = [], isLoading } = useProjects();
  const [visible, setVisible] = useState(true);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const resetTimer = useCallback(() => {
    setVisible(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(false), 3000);
  }, []);

  useEffect(() => {
    resetTimer();
    const handler = () => resetTimer();
    window.addEventListener("mousemove", handler);
    window.addEventListener("mousedown", handler);
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("mousemove", handler);
      window.removeEventListener("mousedown", handler);
      window.removeEventListener("keydown", handler);
      clearTimeout(timeoutRef.current);
    };
  }, [resetTimer]);

  const toggleFilter = (f: string) =>
    setActiveFilters((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );

  const overlayOpacity = visible ? 1 : 0.06;

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* ── Real canvas (no overlay) ── */}
      <FullCanvas projects={projects} hideOverlay />

      {/* ── Ultra-thin top strip ── */}
      <div
        className="absolute top-0 left-0 right-0 z-50 h-[44px] flex items-center px-4 gap-3"
        style={{
          opacity: overlayOpacity,
          transition: "opacity 700ms ease-out",
          background: "linear-gradient(to bottom, rgba(255,255,255,0.85), rgba(255,255,255,0.6))",
          backdropFilter: "blur(16px) saturate(1.4)",
          WebkitBackdropFilter: "blur(16px) saturate(1.4)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        {/* Logo + title */}
        <div className="flex items-center gap-2 shrink-0">
          <img src="/favicon.png" alt="" width="18" height="18" className="rounded-sm" />
          <span className="text-xs font-semibold text-stone-700">NS Tools Atlas</span>
          <span className="text-[10px] text-stone-400 tabular-nums">{projects.length}</span>
        </div>

        <div className="w-px h-4 bg-stone-200 shrink-0" />

        {/* Inline search */}
        <div className={`relative transition-all duration-300 ${searchFocused ? "w-64" : "w-40"}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Find..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full h-7 pl-8 pr-3 rounded-md bg-white/60 border border-stone-200/60 text-[11px] text-stone-700 placeholder:text-stone-400 outline-none focus:bg-white focus:border-stone-300 transition-all"
          />
        </div>

        <div className="w-px h-4 bg-stone-200 shrink-0" />

        {/* Filter pills (legend integrated) */}
        <div className="flex items-center gap-1.5">
          {[
            { id: "nsOfficial", label: "Official", hasFlag: true },
            { id: "community", label: "Community" },
            { id: "free", label: "Free" },
            { id: "paid", label: "Paid" },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => toggleFilter(pill.id)}
              className={`inline-flex items-center gap-1 h-6 px-2 rounded-md text-[10px] font-medium transition-all duration-200 ${
                activeFilters.includes(pill.id)
                  ? "bg-stone-800 text-white shadow-sm"
                  : "bg-white/50 text-stone-500 border border-stone-200/50 hover:bg-white hover:border-stone-300"
              }`}
            >
              {(pill as any).hasFlag && <NSFlag size={8} />}
              {pill.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {[
            { icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" />
                <line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" />
              </svg>
            ), tip: "List", action: () => navigate("/") },
            { icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
              </svg>
            ), tip: "Data", action: () => navigate("/data") },
            { icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" />
              </svg>
            ), tip: "Add", action: () => {} },
          ].map((a, i) => (
            <button
              key={i}
              onClick={a.action}
              className="w-7 h-7 rounded-md flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-white/80 transition-all"
              title={a.tip}
            >
              {a.icon}
            </button>
          ))}
        </div>

        {/* Status pill */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-px h-4 bg-stone-200" />
          <div className="flex items-center gap-1 text-[10px] text-stone-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Live
          </div>
        </div>
      </div>

      {/* ── Stats watermark (bottom-left) ── */}
      <div
        className="absolute bottom-5 left-5 z-40"
        style={{ opacity: overlayOpacity * 0.5, transition: "opacity 700ms ease-out" }}
      >
        <p className="text-[11px] text-stone-400 font-mono">
          {projects.length} projects · est. jan 2025
        </p>
      </div>

      {/* ── Credits "?" bubble (bottom-right) ── */}
      <div
        className="absolute bottom-5 right-5 z-40"
        style={{ opacity: Math.max(overlayOpacity, 0.3), transition: "opacity 700ms ease-out" }}
        onMouseEnter={() => setCreditsOpen(true)}
        onMouseLeave={() => setCreditsOpen(false)}
      >
        <div className="relative">
          {creditsOpen && (
            <div
              className="absolute bottom-10 right-0 whitespace-nowrap px-4 py-3 rounded-xl shadow-lg border border-stone-200/60 flex flex-col gap-1.5 text-[11px]"
              style={{
                background: "rgba(255,255,255,0.9)",
                backdropFilter: "blur(12px)",
                animation: "v3FadeUp 200ms ease-out",
              }}
            >
              <a href="https://x.com/byornoste" target="_blank" rel="noopener noreferrer" className="text-stone-600 hover:text-stone-900 transition-colors">Built by Byorn</a>
              <a href="https://github.com/0xVitae/ns-tools-atlas" target="_blank" rel="noopener noreferrer" className="text-stone-600 hover:text-stone-900 transition-colors">GitHub</a>
              <a href="https://cal.com/byorn/15min?user=byorn" target="_blank" rel="noopener noreferrer" className="text-stone-600 hover:text-stone-900 transition-colors">Office Hours</a>
              <a href="/docs" className="text-stone-600 hover:text-stone-900 transition-colors">Docs</a>
            </div>
          )}
          <button className="w-8 h-8 rounded-full bg-white/80 border border-stone-200/60 shadow-sm backdrop-blur-sm flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-white transition-all text-sm font-medium">
            ?
          </button>
        </div>
      </div>

      {/* ── Back link ── */}
      <div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40"
        style={{ opacity: overlayOpacity, transition: "opacity 700ms ease-out" }}
      >
        <button onClick={() => navigate("/")} className="text-[11px] text-stone-400 hover:text-stone-700 transition-colors underline underline-offset-2">
          ← Back to Atlas
        </button>
      </div>
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40" style={{ opacity: overlayOpacity, transition: "opacity 700ms ease-out" }}>
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-300">Variant C — Contextual Fade</span>
      </div>

      <style>{`
        @keyframes v3FadeUp { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default OverlayV3;
