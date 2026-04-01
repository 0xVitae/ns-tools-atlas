import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FullCanvas } from "@/components/ecosystem/FullCanvas";
import { useProjects } from "@/hooks/useProjects";

// ── NS Flag SVG ──
const NSFlag = ({ size = 10 }: { size?: number }) => (
  <svg width={size} height={size * 0.7} viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.04883 0C14.4015 1.58136e-05 18.0466 0.857342 21.4111 0.857422C24.5739 0.857419 26.8592 0.730968 29.0273 0.478516C29.2469 0.453142 29.4413 0.621298 29.4414 0.838867V19.2832C29.4411 19.4516 29.323 19.5976 29.1543 19.626C27.6623 19.8749 24.1475 20 21.4111 20C18.4798 19.9999 14.1466 19.1426 9.55859 19.1426C5.14747 19.1426 2.72034 19.3956 0.432617 19.7822C0.207077 19.8203 0.000341557 19.6499 0 19.4248V1.0332C3.69636e-05 0.851129 0.136849 0.697243 0.320312 0.673828C2.56107 0.389876 5.35291 0 9.04883 0ZM13.4951 8.76074C11.9493 8.65328 10.6111 8.66895 9.43164 8.66895V11.1475C10.2548 11.1475 11.7426 11.1495 13.4922 11.2998C13.4903 13.3072 13.492 15.0743 13.5088 15.4326C14.1458 15.5754 14.5286 15.5754 15.791 15.8018V11.5508C17.549 11.7554 18.8433 11.8613 20.1377 11.8613V9.29004C18.7357 9.29004 17.6985 9.187 15.791 8.98242V4.79199C15.7758 4.78999 14.1434 4.57627 13.5088 4.57617C13.5086 4.61678 13.5007 6.53989 13.4951 8.76074Z" fill="currentColor" />
  </svg>
);

// ── Rail nav items ──
const NAV_ITEMS = [
  {
    id: "search",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
      </svg>
    ),
    label: "Search",
  },
  {
    id: "filter",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
      </svg>
    ),
    label: "Filter",
  },
  { id: "divider1", icon: null, label: "" },
  { id: "official", icon: <NSFlag size={16} />, label: "NS Official", toggle: true },
  {
    id: "community",
    icon: <div className="w-4 h-3 rounded-[2px] border-[1.5px] border-current opacity-40" />,
    label: "Community",
    toggle: true,
  },
  { id: "divider2", icon: null, label: "" },
  {
    id: "list",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" />
        <line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" />
      </svg>
    ),
    label: "List view",
  },
  {
    id: "data",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
    label: "Data",
  },
  {
    id: "add",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" />
      </svg>
    ),
    label: "Add project",
  },
];

// ── Variant B: "Edge Rail" ──
// Narrow dark vertical rail on the left (48px collapsed, 240px on hover).
// All controls live here. Canvas unobstructed on three sides. IDE sidebar model.

const OverlayV2: React.FC = () => {
  const navigate = useNavigate();
  const { data: projects = [], isLoading } = useProjects();
  const [expanded, setExpanded] = useState(false);
  const [activeToggles, setActiveToggles] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleActive = (id: string) =>
    setActiveToggles((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

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

      {/* ── Edge Rail ── */}
      <div
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => { setExpanded(false); setSearchOpen(false); }}
        className="absolute top-0 left-0 h-full z-50 flex flex-col bg-stone-950 text-stone-300 shadow-2xl overflow-hidden"
        style={{
          width: expanded ? 240 : 48,
          transition: "width 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-3 h-14 border-b border-stone-800 shrink-0">
          <img src="/favicon.png" alt="" width="22" height="22" className="rounded-sm shrink-0" />
          <div className="overflow-hidden transition-all duration-300" style={{ opacity: expanded ? 1 : 0, width: expanded ? "auto" : 0 }}>
            <p className="text-xs font-semibold text-white whitespace-nowrap">NS Tools Atlas</p>
            <p className="text-[10px] text-stone-500 whitespace-nowrap">{projects.length} projects</p>
          </div>
        </div>

        {/* Inline search */}
        {expanded && searchOpen && (
          <div className="px-3 py-2 border-b border-stone-800">
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find projects..."
              className="w-full bg-stone-900 border border-stone-700 rounded-md px-3 py-1.5 text-xs text-white placeholder:text-stone-500 outline-none focus:border-stone-500 transition-colors font-mono"
            />
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 py-2 flex flex-col gap-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            if (item.id.startsWith("divider")) {
              return <div key={item.id} className="h-px bg-stone-800 mx-3 my-1" />;
            }
            const isActive = activeToggles.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "search") setSearchOpen((o) => !o);
                  else if (item.id === "list") navigate("/");
                  else if (item.id === "data") navigate("/data");
                  else if ((item as any).toggle) toggleActive(item.id);
                }}
                className={`flex items-center gap-3 mx-1.5 rounded-md transition-all duration-150 ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "hover:bg-white/5 text-stone-400 hover:text-stone-200"
                }`}
                style={{ height: 36, paddingLeft: 11, paddingRight: 12 }}
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">{item.icon}</div>
                <span
                  className="text-[11px] whitespace-nowrap overflow-hidden transition-all duration-300 font-mono"
                  style={{ opacity: expanded ? 1 : 0, width: expanded ? "auto" : 0 }}
                >
                  {item.label}
                </span>
                {(item as any).toggle && expanded && (
                  <div className={`ml-auto w-3 h-3 rounded-full border transition-all ${
                    isActive ? "bg-emerald-400 border-emerald-400" : "border-stone-600"
                  }`} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom stats */}
        <div className="border-t border-stone-800 px-3 py-3 shrink-0">
          {expanded ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] text-stone-500 font-mono">PROJECTS</span>
                <span className="text-xs text-white font-semibold">{projects.length}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] text-stone-500 font-mono">SINCE</span>
                <span className="text-xs text-stone-300">Jan 2025</span>
              </div>
              <div className="h-px bg-stone-800 my-1" />
              <div className="flex items-center gap-2 text-[10px] text-stone-500">
                <a href="https://x.com/byornoste" target="_blank" rel="noopener noreferrer" className="hover:text-stone-300 transition-colors">Byorn</a>
                <span className="text-stone-700">|</span>
                <a href="https://github.com/0xVitae/ns-tools-atlas" target="_blank" rel="noopener noreferrer" className="hover:text-stone-300 transition-colors">GitHub</a>
                <span className="text-stone-700">|</span>
                <a href="/docs" className="hover:text-stone-300 transition-colors">Docs</a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-[9px] text-stone-600">
              <span>{projects.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Back link ── */}
      <div className="absolute bottom-4 right-5 z-40">
        <button onClick={() => navigate("/")} className="text-[11px] text-stone-400 hover:text-stone-700 transition-colors underline underline-offset-2">
          ← Back to Atlas
        </button>
      </div>
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-40">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-300">Variant B — Edge Rail</span>
      </div>
    </div>
  );
};

export default OverlayV2;
