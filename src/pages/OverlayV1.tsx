import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FullCanvas } from "@/components/ecosystem/FullCanvas";
import { useProjects } from "@/hooks/useProjects";

// ── NS Flag SVG ──
const NSFlag = ({ size = 10 }: { size?: number }) => (
  <svg width={size} height={size * 0.7} viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.04883 0C14.4015 1.58136e-05 18.0466 0.857342 21.4111 0.857422C24.5739 0.857419 26.8592 0.730968 29.0273 0.478516C29.2469 0.453142 29.4413 0.621298 29.4414 0.838867V19.2832C29.4411 19.4516 29.323 19.5976 29.1543 19.626C27.6623 19.8749 24.1475 20 21.4111 20C18.4798 19.9999 14.1466 19.1426 9.55859 19.1426C5.14747 19.1426 2.72034 19.3956 0.432617 19.7822C0.207077 19.8203 0.000341557 19.6499 0 19.4248V1.0332C3.69636e-05 0.851129 0.136849 0.697243 0.320312 0.673828C2.56107 0.389876 5.35291 0 9.04883 0ZM13.4951 8.76074C11.9493 8.65328 10.6111 8.66895 9.43164 8.66895V11.1475C10.2548 11.1475 11.7426 11.1495 13.4922 11.2998C13.4903 13.3072 13.492 15.0743 13.5088 15.4326C14.1458 15.5754 14.5286 15.5754 15.791 15.8018V11.5508C17.549 11.7554 18.8433 11.8613 20.1377 11.8613V9.29004C18.7357 9.29004 17.6985 9.187 15.791 8.98242V4.79199C15.7758 4.78999 14.1434 4.57627 13.5088 4.57617C13.5086 4.61678 13.5007 6.53989 13.4951 8.76074Z" fill="currentColor" />
  </svg>
);

// ── Variant A: "Command Bar" ──
// Brutally minimal. No persistent top bar. A tiny floating pill (logo + count)
// anchors top-left. Everything else summoned via Raycast-style command palette (⌘K).
// Actions are floating monochrome dots top-right. Footer is a single whisper line.

const OverlayV1: React.FC = () => {
  const navigate = useNavigate();
  const { data: projects = [], isLoading } = useProjects();
  const [commandOpen, setCommandOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleFilter = (f: string) =>
    setActiveFilters((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen((o) => !o);
        setQuery("");
        setSelectedIndex(0);
      }
      if (e.key === "Escape") setCommandOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (commandOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [commandOpen]);

  const actions = [
    { id: "search", label: "Search projects...", section: "navigate" },
    { id: "list", label: "Switch to list view", section: "navigate", icon: "☰" },
    { id: "data", label: "View engagement data", section: "navigate", icon: "◧" },
    { id: "add", label: "Submit a project", section: "navigate", icon: "+" },
    { id: "graveyard", label: "View graveyard", section: "navigate", icon: "☠" },
    { id: "requests", label: "View requests", section: "navigate", icon: "✦" },
    { id: "docs", label: "Read the docs", section: "links", icon: "→" },
    { id: "github", label: "GitHub repository", section: "links", icon: "→" },
  ];

  const filtered = query
    ? actions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()))
    : actions;

  const handleSelect = useCallback((id: string) => {
    setCommandOpen(false);
    if (id === "data") navigate("/data");
    else if (id === "graveyard") navigate("/graveyard");
    else if (id === "requests") navigate("/requests");
  }, [navigate]);

  const handleKeyNav = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      handleSelect(filtered[selectedIndex].id);
    }
  };

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

      {/* ── Floating pill (top-left) ── */}
      <button
        onClick={() => { setCommandOpen(true); setQuery(""); }}
        className="absolute top-5 left-5 z-50 flex items-center gap-2.5 bg-stone-900 text-white pl-3 pr-4 py-2 rounded-full shadow-xl hover:bg-stone-800 transition-all group"
      >
        <img src="/favicon.png" alt="" width="18" height="18" className="rounded-sm" />
        <span className="text-xs font-semibold tracking-wide">{projects.length} projects</span>
        <kbd className="text-[9px] bg-white/15 rounded px-1.5 py-0.5 font-mono opacity-60 group-hover:opacity-100 transition-opacity">⌘K</kbd>
      </button>

      {/* ── Floating action dots (top-right) ── */}
      <div className="absolute top-5 right-5 z-50 flex flex-col gap-2">
        {[
          { icon: "☰", tip: "List view", action: () => navigate("/") },
          { icon: "◧", tip: "Data", action: () => navigate("/data") },
          { icon: "+", tip: "Add", action: () => {} },
        ].map((a, i) => (
          <button
            key={i}
            onClick={a.action}
            className="w-9 h-9 rounded-full bg-white border border-stone-200 shadow-md flex items-center justify-center text-stone-600 hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all duration-200 text-sm"
            title={a.tip}
          >
            {a.icon}
          </button>
        ))}
      </div>

      {/* ── Command palette overlay ── */}
      {commandOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[2px]"
            onClick={() => setCommandOpen(false)}
            style={{ animation: "v1FadeIn 150ms ease-out" }}
          />
          <div
            className="fixed z-[70] top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg"
            style={{ animation: "v1SlideUp 200ms cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-400 shrink-0">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                  onKeyDown={handleKeyNav}
                  placeholder="Search projects, actions..."
                  className="flex-1 text-sm bg-transparent outline-none placeholder:text-stone-400"
                />
                <kbd className="text-[10px] text-stone-400 bg-stone-100 rounded px-1.5 py-0.5 font-mono">ESC</kbd>
              </div>

              <div className="flex items-center gap-2 px-5 py-3 border-b border-stone-50 bg-stone-50/50">
                <span className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">Filter</span>
                {[
                  { id: "nsOfficial", label: "NS Official", hasFlag: true },
                  { id: "community", label: "Community" },
                  { id: "free", label: "Free" },
                  { id: "paid", label: "Paid" },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => toggleFilter(chip.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                      activeFilters.includes(chip.id)
                        ? "bg-stone-900 text-white"
                        : "bg-white text-stone-600 border border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    {(chip as any).hasFlag && <NSFlag size={9} />}
                    {chip.label}
                  </button>
                ))}
              </div>

              <div className="max-h-64 overflow-y-auto py-2">
                {filtered.map((action, i) => (
                  <button
                    key={action.id}
                    onClick={() => handleSelect(action.id)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${
                      i === selectedIndex ? "bg-stone-100" : "hover:bg-stone-50"
                    }`}
                  >
                    {action.icon && (
                      <span className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-xs text-stone-500">
                        {action.icon}
                      </span>
                    )}
                    <span className="text-sm text-stone-700">{action.label}</span>
                    {i === selectedIndex && (
                      <kbd className="ml-auto text-[10px] text-stone-400 bg-stone-100 rounded px-1.5 py-0.5 font-mono">↵</kbd>
                    )}
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="px-5 py-8 text-center text-sm text-stone-400">No results</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Minimal footer line ── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 text-[11px] text-stone-400">
        <span>{projects.length} projects</span>
        <span className="text-stone-300">·</span>
        <span>Est. Jan 2025</span>
        <span className="text-stone-300">·</span>
        <a href="https://x.com/byornoste" target="_blank" rel="noopener noreferrer" className="hover:text-stone-600 transition-colors">Built by Byorn</a>
        <span className="text-stone-300">·</span>
        <a href="https://github.com/0xVitae/ns-tools-atlas" target="_blank" rel="noopener noreferrer" className="hover:text-stone-600 transition-colors">GitHub</a>
        <span className="text-stone-300">·</span>
        <a href="/docs" className="hover:text-stone-600 transition-colors">Docs</a>
      </div>

      {/* ── Back link ── */}
      <div className="absolute bottom-4 left-5 z-50">
        <button onClick={() => navigate("/")} className="text-[11px] text-stone-400 hover:text-stone-700 transition-colors underline underline-offset-2">
          ← Back to Atlas
        </button>
      </div>
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-40">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-300">Variant A — Command Bar</span>
      </div>

      <style>{`
        @keyframes v1FadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes v1SlideUp { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>
    </div>
  );
};

export default OverlayV1;
