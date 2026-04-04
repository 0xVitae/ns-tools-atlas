import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Skull,
  Lightbulb,
  BarChart3,
  Compass,
  ChevronUp,
  List,
} from "lucide-react";

/** Which page is currently active in the footer nav */
type ActivePage = "atlas" | "graveyard" | "requests" | "data";

interface FooterProps {
  /** Which nav button to highlight as active */
  activePage?: ActivePage;
  /** Optional right-side content (e.g. AddProjectForm) */
  rightContent?: React.ReactNode;
  /** Optional center content override */
  centerContent?: React.ReactNode;
  /** Callback to switch to list view */
  onListView?: () => void;
}

function HudButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded border transition-colors ${
        active
          ? "border-foreground/20 bg-muted/50 text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-foreground/10 hover:bg-muted/30"
      }`}
    >
      {icon}
      <span className="text-[9px] font-medium tracking-wider uppercase">
        {label}
      </span>
    </button>
  );
}

export function Footer({
  activePage = "atlas",
  rightContent,
  centerContent,
  onListView,
}: FooterProps) {
  const navigate = useNavigate();
  const [showPanel, setShowPanel] = useState(true);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-40 pointer-events-none">
      <div className="pointer-events-auto">
        <div className="flex justify-center">
          <button
            onClick={() => setShowPanel(!showPanel)}
            className="bg-background/90 backdrop-blur-sm border border-b-0 border-foreground/20 rounded-t-md px-4 py-0.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronUp
              className={`w-4 h-4 transition-transform duration-200 ${
                showPanel ? "" : "rotate-180"
              }`}
            />
          </button>
        </div>

        <div
          className={`transition-all duration-300 ease-in-out ${
            showPanel
              ? "max-h-[200px] opacity-100"
              : "max-h-0 opacity-0 overflow-hidden"
          }`}
        >
          <div className="border-t-2 border-foreground/20">
            <div className="border-t border-foreground/10 bg-background/90 backdrop-blur-sm">
              <div className="px-4 py-2.5">
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Navigation */}
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-1 border border-foreground/15 rounded-lg px-1 py-0.5">
                      <HudButton
                        icon={<Compass className="w-4 h-4" />}
                        label="Atlas"
                        active={activePage === "atlas"}
                        onClick={() => navigate("/")}
                      />
                      {onListView && (
                        <HudButton
                          icon={<List className="w-4 h-4" />}
                          label="List"
                          onClick={onListView}
                        />
                      )}
                    </div>
                    <HudButton
                      icon={<Skull className="w-4 h-4" />}
                      label="Graveyard"
                      active={activePage === "graveyard"}
                      onClick={() => navigate("/graveyard")}
                    />
                    <HudButton
                      icon={<Lightbulb className="w-4 h-4" />}
                      label="Requests"
                      active={activePage === "requests"}
                      onClick={() => navigate("/requests")}
                    />
                    <HudButton
                      icon={<BarChart3 className="w-4 h-4" />}
                      label="Data"
                      active={activePage === "data"}
                      onClick={() => navigate("/data")}
                    />
                  </div>

                  {/* Center */}
                  {centerContent && (
                    <div className="hidden md:flex flex-col items-center gap-1.5">
                      {centerContent}
                    </div>
                  )}

                  {/* Right: Credits + optional content */}
                  <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-2 text-[11px] text-muted-foreground">
                      <a
                        href="https://x.com/byornoste"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground transition-colors"
                      >
                        Built by Byorn
                      </a>
                      <span className="text-foreground/20">|</span>
                      <a
                        href="https://github.com/0xVitae/ns-tools-atlas"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground transition-colors"
                      >
                        GitHub
                      </a>
                      <span className="text-foreground/20">|</span>
                      <a
                        href="/docs"
                        className="hover:text-foreground transition-colors"
                      >
                        Docs
                      </a>
                    </div>
                    {rightContent && (
                      <>
                        <div className="h-5 w-px bg-foreground/15 hidden md:block" />
                        {rightContent}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
