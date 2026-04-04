import {
  useState,
  useMemo,
  useRef,
  useCallback,
  useEffect,
  lazy,
  Suspense,
} from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "@/components/ecosystem/Canvas";
import { MobileProjectList } from "@/components/ecosystem/MobileProjectList";
import { EcosystemProject } from "@/types/ecosystem";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  buildCategoriesFromProjects,
  getCategoryColor,
  getCategoryName,
} from "@/data/ecosystemData";
import { editProject } from "@/lib/api";
import { AddProjectForm } from "@/components/ecosystem/AddProjectForm";
import { Footer } from "@/components/Footer";
import ActionSearchBar, {
  Action,
  ActionSearchBarRef,
} from "@/components/kokonutui/action-search-bar";
import { toast } from "sonner";
import {
  Search,
  List,
  ChevronLeft,
  ChevronRight,
  Compass,
  Layers,
  Clock,
  Flag,
  ExternalLink,
  BookOpen,
  X,
  Users,
  Calendar,
  Pencil,
  Lightbulb,
  HelpCircle,
  User,
  LogOut,
  ChevronDown,
  ChevronsUpDown,
  MapPin,
  LayoutGrid,
  Globe,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
const mapViewImport = () => import("@/components/ecosystem/MapView");
const MapView = lazy(mapViewImport);

type LeftPanelView =
  | { type: "most-popular" }
  | { type: "latest" }
  | { type: "category"; categoryId: string; categoryName: string }
  | { type: "legend"; filter: "nsOfficial" | "community" }
  | null;

const Index = () => {
  const { data: projects = [], isLoading, error } = useProjects();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"canvas" | "list" | "map">(() =>
    window.location.hash === "#list"
      ? "list"
      : window.location.hash === "#map"
        ? "map"
        : "canvas",
  );
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedProject, setSelectedProject] =
    useState<EcosystemProject | null>(null);
  const [editingProject, setEditingProject] = useState<EcosystemProject | null>(
    null,
  );
  const [addingProject, setAddingProject] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [leftPanel, setLeftPanel] = useState<LeftPanelView>(null);
  const searchBarRef = useRef<ActionSearchBarRef>(null);

  // Preload MapView chunk so switching to map is instant
  useEffect(() => {
    mapViewImport();
  }, []);

  // Cmd+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchBarRef.current?.focus(), 50);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Find projects the logged-in user owns (NS profile URL match)
  const ownedProjectIds = useMemo(() => {
    if (!user?.nsUsername) return new Set<string>();
    const userUrl = `https://ns.com/${user.nsUsername}`.toLowerCase();
    const ids = new Set<string>();
    for (const p of projects) {
      if (
        p.nsProfileUrls?.some(
          (u) =>
            u.toLowerCase() === userUrl ||
            u.toLowerCase() ===
              `https://www.ns.com/${user.nsUsername}`.toLowerCase(),
        )
      ) {
        ids.add(p.id);
      }
    }
    return ids;
  }, [projects, user?.nsUsername]);

  // Convert projects to search actions
  const searchActions: Action[] = useMemo(() => {
    return projects.map((project) => ({
      id: project.id,
      label: project.name,
      icon: project.emoji ? (
        <span className="text-base">{project.emoji}</span>
      ) : (
        <div
          className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold"
          style={{
            backgroundColor: `${getCategoryColor(project.category)}20`,
            color: getCategoryColor(project.category),
          }}
        >
          {project.name.slice(0, 2).toUpperCase()}
        </div>
      ),
      end: getCategoryName(project.category),
    }));
  }, [projects]);

  const handleSearchSelect = useCallback(
    (action: Action) => {
      const project = projects.find((p) => p.id === action.id);
      if (project) {
        setSelectedProject(project);
        setSearchOpen(false);
      }
    },
    [projects],
  );

  const categories = useMemo(
    () => buildCategoriesFromProjects(projects),
    [projects],
  );

  const projectAge = useMemo(() => {
    const months = Math.floor(
      (Date.now() - new Date("2025-01-01").getTime()) /
        (1000 * 60 * 60 * 24 * 30),
    );
    return months >= 12
      ? `${Math.floor(months / 12)}y ${months % 12}mo`
      : `${months}mo`;
  }, []);

  const latestUpdate = useMemo(() => {
    const dates = projects
      .map((p) => p.addedAt)
      .filter(Boolean)
      .map((d) => new Date(d!).getTime());
    if (dates.length === 0) return null;
    const latest = new Date(Math.max(...dates));
    return latest.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [projects]);

  // Compute filtered project list for the left panel
  const leftPanelProjects = useMemo(() => {
    if (!leftPanel) return [];
    switch (leftPanel.type) {
      case "most-popular":
        // Projects with most NS profile URLs (proxy for activity/team size), top 12
        return [...projects]
          .sort(
            (a, b) =>
              (b.nsProfileUrls?.length || 0) - (a.nsProfileUrls?.length || 0),
          )
          .slice(0, 12);
      case "latest":
        return [...projects]
          .filter((p) => p.addedAt)
          .sort(
            (a, b) =>
              new Date(b.addedAt!).getTime() - new Date(a.addedAt!).getTime(),
          )
          .slice(0, 12);
      case "category":
        return projects.filter(
          (p) =>
            p.category?.toLowerCase() === leftPanel.categoryId.toLowerCase(),
        );
      case "legend":
        if (leftPanel.filter === "nsOfficial") {
          return projects.filter((p) => p.tags?.includes("nsOfficial"));
        }
        return projects.filter((p) => !p.tags?.includes("nsOfficial"));
      default:
        return [];
    }
  }, [leftPanel, projects]);

  const leftPanelTitle = useMemo(() => {
    if (!leftPanel) return "";
    switch (leftPanel.type) {
      case "most-popular":
        return "MOST POPULAR";
      case "latest":
        return "LATEST TOOLS";
      case "category":
        return leftPanel.categoryName.toUpperCase();
      case "legend":
        return leftPanel.filter === "nsOfficial" ? "NS OFFICIAL" : "COMMUNITY";
    }
  }, [leftPanel]);

  // IDs to highlight on canvas when a left panel filter is active
  const highlightedIds = useMemo(() => {
    if (!leftPanel) return null;
    return new Set(leftPanelProjects.map((p) => p.id));
  }, [leftPanel, leftPanelProjects]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-mono text-sm tracking-wide">
            LOADING ATLAS...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load projects</p>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isMobile || viewMode === "list") {
    return (
      <MobileProjectList
        projects={projects}
        showViewToggle={!isMobile}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
    );
  }

  return (
    <div
      className={`fixed inset-0 overflow-hidden ${viewMode === "map" ? "dark" : ""}`}
    >
      {/* Main view fills the whole viewport */}
      {viewMode === "map" ? (
        <Suspense fallback={<div className="fixed inset-0 bg-[#0a0a0f]" />}>
          <MapView projects={projects} onSelectProject={setSelectedProject} />
        </Suspense>
      ) : (
        <Canvas
          projects={projects}
          onSelectProject={setSelectedProject}
          highlightedIds={highlightedIds}
          selectedProjectId={selectedProject?.id || null}
        />
      )}

      {/* ======= ANNOUNCEMENT CHYRON ======= */}
      <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
        <div
          className="pointer-events-auto bg-black overflow-hidden"
          style={{ height: 24 }}
        >
          <div className="flex items-center h-full animate-marquee whitespace-nowrap">
            {(() => {
              const latestProjects = projects
                .filter((p) => p.addedAt)
                .sort(
                  (a, b) =>
                    new Date(b.addedAt!).getTime() -
                    new Date(a.addedAt!).getTime(),
                )
                .slice(0, 2);
              const featureItems: {
                emoji: string;
                text: string;
                action: () => void;
              }[] = [
                {
                  emoji: "",
                  text: "NEW FEATURES: 🗺️ Map View — explore the NS ecosystem geographically , 🔍 Cmd+K search — find any project instantly",
                  action: () => {
                    setViewMode("map");
                    window.location.hash = "#map";
                  },
                },
              ];
              const newProjectsItem =
                latestProjects.length > 0
                  ? [
                      {
                        emoji: "",
                        text: `NEW PROJECTS: ${latestProjects.map((p) => `${p.emoji || "•"} ${p.name}`).join(" , ")}`,
                        action: () => setSelectedProject(latestProjects[0]),
                      },
                    ]
                  : [];
              const items = [...featureItems, ...newProjectsItem];
              const all = [...items, ...items];
              return all.map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
                  className="flex items-center text-[10px] font-mono tracking-wider text-white uppercase mx-6 shrink-0 hover:text-white/70 transition-colors cursor-pointer"
                >
                  <span
                    className="mr-2 text-xs not-italic"
                    style={{ fontFamily: "system-ui" }}
                  >
                    {item.emoji}
                  </span>
                  {item.text}
                </button>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* ======= TOP RESOURCE BAR ======= */}
      <div className="absolute top-[24px] left-0 right-0 z-[80] pointer-events-none">
        <div className="pointer-events-auto">
          <div className="border-b-2 border-foreground/20">
            <div className="bg-background/90 backdrop-blur-sm border-b border-foreground/10 px-4 py-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src="/favicon.png"
                    alt="NS Tools Atlas"
                    width="20"
                    height="20"
                    className="rounded"
                  />
                  <span className="text-sm font-bold tracking-wide text-foreground">
                    NS TOOLS
                  </span>
                  <div className="h-4 w-px bg-foreground/20" />
                  <span className="text-[10px] text-muted-foreground font-mono tracking-wider uppercase">
                    ATLAS
                  </span>
                  {/* Expandable Search */}
                  <div className="relative flex items-center ml-2">
                    <button
                      onClick={() => {
                        setSearchOpen(!searchOpen);
                        if (!searchOpen) {
                          setTimeout(() => searchBarRef.current?.focus(), 50);
                        }
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-foreground text-background hover:bg-foreground/80 transition-colors shrink-0"
                    >
                      {searchOpen ? (
                        <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                      ) : (
                        <Search className="w-3.5 h-3.5" strokeWidth={2.5} />
                      )}
                    </button>
                    {searchOpen && (
                      <div
                        className="absolute left-0 top-full mt-1.5 z-[100]"
                        onBlur={(e) => {
                          if (
                            !e.currentTarget.contains(e.relatedTarget as Node)
                          ) {
                            setTimeout(() => setSearchOpen(false), 200);
                          }
                        }}
                      >
                        <ActionSearchBar
                          ref={searchBarRef}
                          actions={searchActions}
                          defaultOpen
                          placeholder="Search projects..."
                          onSelect={handleSearchSelect}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-1">
                  <ResourceChip
                    icon={<Layers className="w-3 h-3" />}
                    label="Projects"
                    value={projects.length}
                  />
                  <ResourceChip
                    icon={<Flag className="w-3 h-3" />}
                    label="Categories"
                    value={categories.length}
                  />
                  <ResourceChip
                    icon={<Clock className="w-3 h-3" />}
                    label="Age"
                    value={projectAge}
                  />
                  <ResourceChip
                    icon={<Compass className="w-3 h-3" />}
                    label="Latest Update"
                    value={latestUpdate || "—"}
                  />
                  {user && (
                    <div className="relative">
                      <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <span className="text-[10px] uppercase tracking-wider">
                          Profile
                        </span>
                      </button>
                      {profileOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-[300]"
                            onClick={() => setProfileOpen(false)}
                          />
                          <div className="absolute right-0 top-full mt-1 z-[310] w-52 border-2 border-foreground/20 rounded-lg bg-background/95 backdrop-blur-sm overflow-hidden">
                            <div className="border border-foreground/5 rounded-lg">
                              <div className="px-3 py-2 border-b border-foreground/10">
                                <p className="text-xs font-semibold text-foreground truncate">
                                  {user.name || user.username}
                                </p>
                                {user.nsUsername && (
                                  <p className="text-[10px] text-muted-foreground">
                                    @{user.nsUsername}
                                  </p>
                                )}
                              </div>
                              {ownedProjectIds.size > 0 && (
                                <div className="py-1">
                                  <div className="px-3 py-1">
                                    <span className="text-[9px] font-bold tracking-[0.15em] text-muted-foreground uppercase">
                                      YOUR PROJECTS
                                    </span>
                                  </div>
                                  {projects
                                    .filter((p) => ownedProjectIds.has(p.id))
                                    .map((p) => (
                                      <button
                                        key={p.id}
                                        onClick={() => {
                                          setEditingProject(
                                            editingProject?.id === p.id
                                              ? null
                                              : p,
                                          );
                                          setProfileOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                                          editingProject?.id === p.id
                                            ? "bg-foreground/5 text-foreground font-medium"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        }`}
                                      >
                                        <Pencil className="w-3 h-3 shrink-0" />
                                        <span className="truncate">
                                          {p.name}
                                        </span>
                                      </button>
                                    ))}
                                </div>
                              )}
                              <div className="border-t border-foreground/10 py-1">
                                <a
                                  href="/api/auth/logout"
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                                >
                                  <LogOut className="w-3 h-3" />
                                  Sign Out
                                </a>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======= EXPLORE TAB BAR ======= */}
      <div className="absolute top-[70px] left-0 right-0 z-[70] pointer-events-none">
        <div className="pointer-events-auto">
          <div className="px-4 py-1 flex items-center gap-2">
            <button
              onClick={() =>
                setLeftPanel(
                  leftPanel?.type === "most-popular"
                    ? null
                    : { type: "most-popular" },
                )
              }
              className={`text-[9px] font-bold tracking-[0.15em] uppercase shrink-0 px-2 py-0.5 rounded transition-colors ${
                leftPanel?.type === "most-popular"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Most Popular
            </button>
            <button
              onClick={() =>
                setLeftPanel(
                  leftPanel?.type === "latest" ? null : { type: "latest" },
                )
              }
              className={`text-[9px] font-bold tracking-[0.15em] uppercase shrink-0 px-2 py-0.5 rounded transition-colors ${
                leftPanel?.type === "latest"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Latest Tools
            </button>
            <div className="ml-auto">
              <button
                onClick={() => {
                  const next = viewMode === "map" ? "canvas" : "map";
                  setViewMode(next);
                  window.location.hash = next === "canvas" ? "" : `#${next}`;
                }}
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-foreground text-background text-[9px] font-bold tracking-[0.15em] uppercase hover:bg-foreground/80 transition-colors"
              >
                {viewMode === "map" ? (
                  <><LayoutGrid className="w-3 h-3" /> Go to Canvas</>
                ) : (
                  <><Globe className="w-3 h-3" /> Go to Map</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======= LEFT PANEL — Legend ======= */}
      <div className="absolute top-[102px] left-3 z-40 hidden md:block pointer-events-auto">
        <Panel title="LEGEND">
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() =>
                setLeftPanel(
                  leftPanel?.type === "legend" &&
                    leftPanel.filter === "nsOfficial"
                    ? null
                    : { type: "legend", filter: "nsOfficial" },
                )
              }
              className={`flex items-center gap-2 px-2 py-1 text-[11px] rounded transition-colors w-full ${
                leftPanel?.type === "legend" &&
                leftPanel.filter === "nsOfficial"
                  ? "bg-foreground/5 text-foreground font-medium"
                  : "text-foreground/80 hover:bg-muted/50"
              }`}
            >
              <svg
                width="10"
                height="7"
                viewBox="0 0 30 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.04883 0C14.4015 1.58136e-05 18.0466 0.857342 21.4111 0.857422C24.5739 0.857419 26.8592 0.730968 29.0273 0.478516C29.2469 0.453142 29.4413 0.621298 29.4414 0.838867V19.2832C29.4411 19.4516 29.323 19.5976 29.1543 19.626C27.6623 19.8749 24.1475 20 21.4111 20C18.4798 19.9999 14.1466 19.1426 9.55859 19.1426C5.14747 19.1426 2.72034 19.3956 0.432617 19.7822C0.207077 19.8203 0.000341557 19.6499 0 19.4248V1.0332C3.69636e-05 0.851129 0.136849 0.697243 0.320312 0.673828C2.56107 0.389876 5.35291 0 9.04883 0ZM13.4951 8.76074C11.9493 8.65328 10.6111 8.66895 9.43164 8.66895V11.1475C10.2548 11.1475 11.7426 11.1495 13.4922 11.2998C13.4903 13.3072 13.492 15.0743 13.5088 15.4326C14.1458 15.5754 14.5286 15.5754 15.791 15.8018V11.5508C17.549 11.7554 18.8433 11.8613 20.1377 11.8613V9.29004C18.7357 9.29004 17.6985 9.187 15.791 8.98242V4.79199C15.7758 4.78999 14.1434 4.57627 13.5088 4.57617C13.5086 4.61678 13.5007 6.53989 13.4951 8.76074Z"
                  fill="currentColor"
                />
              </svg>
              NS Official
            </button>
            <button
              onClick={() =>
                setLeftPanel(
                  leftPanel?.type === "legend" &&
                    leftPanel.filter === "community"
                    ? null
                    : { type: "legend", filter: "community" },
                )
              }
              className={`flex items-center gap-2 px-2 py-1 text-[11px] rounded transition-colors w-full ${
                leftPanel?.type === "legend" && leftPanel.filter === "community"
                  ? "bg-foreground/5 text-foreground font-medium"
                  : "text-foreground/80 hover:bg-muted/50"
              }`}
            >
              <div className="w-[10px]" />
              Community
            </button>
          </div>
        </Panel>

        <div className="mt-2">
          <Panel title="CATEGORIES">
            <div className="flex flex-col gap-0.5 max-h-[240px] overflow-y-auto scrollbar-hide">
              {categories.map((cat) => {
                const count = projects.filter(
                  (p) => p.category?.toLowerCase() === cat.id.toLowerCase(),
                ).length;
                if (count === 0) return null;
                return (
                  <button
                    key={cat.id}
                    onClick={() =>
                      setLeftPanel(
                        leftPanel?.type === "category" &&
                          leftPanel.categoryId === cat.id
                          ? null
                          : {
                              type: "category",
                              categoryId: cat.id,
                              categoryName: cat.name,
                            },
                      )
                    }
                    className={`flex items-center justify-between px-2 py-0.5 text-[11px] rounded transition-colors w-full ${
                      leftPanel?.type === "category" &&
                      leftPanel.categoryId === cat.id
                        ? "bg-foreground/5 text-foreground font-medium"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-sm"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-foreground/80">{cat.name}</span>
                    </div>
                    <span className="text-muted-foreground font-mono text-[10px]">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>

      {/* ======= LEFT SLIDE-IN — Filtered Project List ======= */}
      <div
        className={`absolute top-[102px] left-3 z-50 hidden md:block pointer-events-auto transition-all duration-300 ease-in-out ${
          leftPanel
            ? "translate-x-0 opacity-100"
            : "-translate-x-[120%] opacity-0 pointer-events-none"
        }`}
      >
        {leftPanel && (
          <div className="w-[300px] max-h-[calc(100vh-180px)] flex flex-col">
            <div className="flex">
              <div className="bg-background/90 backdrop-blur-sm border border-b-0 border-foreground/20 rounded-t px-2.5 py-0.5">
                <span className="text-[9px] font-bold tracking-[0.15em] text-muted-foreground uppercase">
                  {leftPanelTitle}
                </span>
              </div>
              <div className="flex-1" />
              <button
                onClick={() => setLeftPanel(null)}
                className="text-muted-foreground hover:text-foreground transition-colors px-1.5 pb-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="border-2 border-foreground/20 rounded-tr rounded-b bg-background/90 backdrop-blur-sm overflow-hidden flex flex-col">
              <div className="border border-foreground/5 rounded-tr rounded-b overflow-y-auto flex-1 scrollbar-hide max-h-[calc(100vh-220px)]">
                {leftPanelProjects.length === 0 ? (
                  <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                    No projects found.
                  </div>
                ) : (
                  <div className="py-1">
                    {leftPanelProjects.map((project) => {
                      const catColor = getCategoryColor(project.category);
                      return (
                        <button
                          key={project.id}
                          onClick={() => {
                            setSelectedProject(project);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 transition-colors text-left"
                        >
                          <div
                            className="w-8 h-8 rounded flex items-center justify-center shrink-0 overflow-hidden"
                            style={{
                              color: catColor,
                              fontSize: project.emoji ? 18 : 10,
                            }}
                          >
                            {project.imageUrl ? (
                              <img
                                src={project.imageUrl}
                                alt={project.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              project.emoji ||
                              project.name
                                .split(" ")
                                .map((w) => w[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-foreground truncate">
                                {project.name}
                              </span>
                              {project.tags?.includes("nsOfficial") && (
                                <svg
                                  width="8"
                                  height="6"
                                  viewBox="0 0 30 20"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="shrink-0"
                                >
                                  <path
                                    d="M9.04883 0C14.4015 1.58136e-05 18.0466 0.857342 21.4111 0.857422C24.5739 0.857419 26.8592 0.730968 29.0273 0.478516C29.2469 0.453142 29.4413 0.621298 29.4414 0.838867V19.2832C29.4411 19.4516 29.323 19.5976 29.1543 19.626C27.6623 19.8749 24.1475 20 21.4111 20C18.4798 19.9999 14.1466 19.1426 9.55859 19.1426C5.14747 19.1426 2.72034 19.3956 0.432617 19.7822C0.207077 19.8203 0.000341557 19.6499 0 19.4248V1.0332C3.69636e-05 0.851129 0.136849 0.697243 0.320312 0.673828C2.56107 0.389876 5.35291 0 9.04883 0ZM13.4951 8.76074C11.9493 8.65328 10.6111 8.66895 9.43164 8.66895V11.1475C10.2548 11.1475 11.7426 11.1495 13.4922 11.2998C13.4903 13.3072 13.492 15.0743 13.5088 15.4326C14.1458 15.5754 14.5286 15.5754 15.791 15.8018V11.5508C17.549 11.7554 18.8433 11.8613 20.1377 11.8613V9.29004C18.7357 9.29004 17.6985 9.187 15.791 8.98242V4.79199C15.7758 4.78999 14.1434 4.57627 13.5088 4.57617C13.5086 4.61678 13.5007 6.53989 13.4951 8.76074Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {project.description ||
                                getCategoryName(project.category)}
                            </p>
                          </div>
                          {leftPanel?.type === "latest" && project.addedAt && (
                            <span className="text-[9px] text-muted-foreground font-mono shrink-0">
                              {new Date(project.addedAt).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" },
                              )}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======= RIGHT PANEL — Project Detail ======= */}
      <div
        className={`absolute ${ownedProjectIds.size > 0 ? "top-[102px]" : "top-14"} right-0 z-[60] hidden md:block pointer-events-auto transition-all duration-300 ease-in-out ${
          selectedProject && !editingProject
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0 pointer-events-none"
        }`}
      >
        {selectedProject && (
          <ProjectDetailPanel
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        )}
      </div>

      {/* ======= RIGHT PANEL — Edit Project ======= */}
      <div
        className={`absolute ${ownedProjectIds.size > 0 ? "top-[102px]" : "top-14"} right-0 z-[60] hidden md:block pointer-events-auto transition-all duration-300 ease-in-out ${
          editingProject
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0 pointer-events-none"
        }`}
      >
        {editingProject && (
          <div className="w-[340px] max-h-[calc(100vh-180px)] flex flex-col">
            {/* Civ-style title tab */}
            <div className="flex justify-between items-end pr-3">
              <div className="bg-background/90 backdrop-blur-sm border border-b-0 border-foreground/20 rounded-t px-2.5 py-0.5 ml-3">
                <span className="text-[9px] font-bold tracking-[0.15em] text-muted-foreground uppercase">
                  EDIT — {editingProject.name}
                </span>
              </div>
              <button
                onClick={() => setEditingProject(null)}
                className="p-1 mb-0.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Panel body with shared form */}
            <div className="border-l-2 border-t-2 border-b-2 border-foreground/20 rounded-l-lg bg-background/95 backdrop-blur-sm overflow-y-auto flex-1">
              <AddProjectForm
                categories={categories}
                editProject={editingProject}
                nsUsername={user?.nsUsername}
                isSubmitting={false}
                renderFormOnly
                onSaveEdit={async (projectId, updates) => {
                  const result = await editProject(projectId, updates);
                  if (result.success) {
                    toast.success("Project updated");
                    setEditingProject(null);
                    window.location.reload();
                  } else {
                    toast.error(result.error || "Failed to save");
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ======= RIGHT PANEL — Add Project (desktop) ======= */}
      <div
        className={`absolute ${ownedProjectIds.size > 0 ? "top-[102px]" : "top-14"} right-0 z-[60] hidden md:block pointer-events-auto transition-all duration-300 ease-in-out ${
          addingProject && !editingProject && !selectedProject
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0 pointer-events-none"
        }`}
      >
        {addingProject && (
          <div className="w-[340px] max-h-[calc(100vh-180px)] flex flex-col">
            <div className="flex justify-between items-end pr-3">
              <div className="bg-background/90 backdrop-blur-sm border border-b-0 border-foreground/20 rounded-t px-2.5 py-0.5 ml-3">
                <span className="text-[9px] font-bold tracking-[0.15em] text-muted-foreground uppercase">
                  ADD PROJECT
                </span>
              </div>
              <button
                onClick={() => setAddingProject(false)}
                className="p-1 mb-0.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="border-l-2 border-t-2 border-b-2 border-foreground/20 rounded-l-lg bg-background/95 backdrop-blur-sm overflow-y-auto flex-1">
              <AddProjectForm
                categories={categories}
                nsUsername={user?.nsUsername}
                isSubmitting={false}
                renderFormOnly
              />
            </div>
          </div>
        )}
      </div>

      {/* ======= FAQ MODAL ======= */}
      {faqOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 backdrop-blur-md"
            onClick={() => setFaqOpen(false)}
          />
          <div className="relative w-[380px] max-w-[90vw] max-h-[80vh] flex flex-col">
            {/* Civ-style title tab */}
            <div className="flex">
              <div className="bg-background/95 backdrop-blur-sm border border-b-0 border-foreground/20 rounded-t px-2.5 py-0.5">
                <span className="text-[9px] font-bold tracking-[0.15em] text-muted-foreground uppercase">
                  NS TOOLS ATLAS — FAQ
                </span>
              </div>
            </div>
            {/* Panel body */}
            <div className="border-2 border-foreground/20 rounded-tr rounded-b bg-background/95 backdrop-blur-sm overflow-y-auto">
              <div className="border border-foreground/5 rounded-tr rounded-b p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <h2 className="text-sm font-bold text-foreground">
                    Quick Guide
                  </h2>
                  <button
                    onClick={() => setFaqOpen(false)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <FaqItem
                  q="What is NS Tools Atlas?"
                  a="An interactive map of tools, projects, and resources in the Network School ecosystem. Explore, discover, and contribute."
                />
                <FaqItem
                  q="How do I add a project?"
                  a='Click the "Add Project" button in the bottom-right corner. Fill in the details and submit for review.'
                />
                <FaqItem
                  q="How do I request a project?"
                  a={
                    "Click the lightbulb button or visit the Requests page. Suggest tools you'd like to see and upvote others."
                  }
                />
                <FaqItem
                  q="Can I edit my project?"
                  a={
                    'Yes — log in with your NS account. If your NS profile URL matches a project, it will appear in the "Your Projects" bar at the top.'
                  }
                />
                <FaqItem
                  q="What are categories?"
                  a="Projects are grouped by type (Networks, Media, Education, etc.). You can also create custom categories when adding a project."
                />

                <div className="pt-2 border-t border-foreground/10">
                  <a
                    href="/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-primary hover:underline font-medium"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    View full documentation
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======= FLOATING ACTION BUTTONS (above footer) ======= */}
      <div className="absolute bottom-[90px] right-4 z-50 pointer-events-auto flex flex-col items-end gap-2">
        <div className="flex flex-col gap-2 items-end">
          <button
            onClick={() => navigate("/requests?new")}
            className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-foreground/20 bg-background/90 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:border-foreground/40 hover:bg-muted/50 transition-all shadow-lg"
          >
            <span className="text-[10px] font-bold tracking-wider uppercase">
              Request Tool
            </span>
            <Lightbulb className="w-5 h-5" />
          </button>
          <button
            onClick={() => setFaqOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-foreground/20 bg-background/90 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:border-foreground/40 hover:bg-muted/50 transition-all shadow-lg"
          >
            <span className="text-[10px] font-bold tracking-wider uppercase">
              Guide
            </span>
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ======= BOTTOM HUD RIBBON ======= */}
      <Footer
        activePage="atlas"
        centerContent={
          <span className="text-muted-foreground text-[10px] font-mono tracking-wider">
            DRAG TO PAN &middot; SCROLL TO ZOOM
          </span>
        }
        rightContent={
          <Button
            size="lg"
            className="rounded-full shadow-lg h-14 px-6 gap-2 text-base hidden md:flex"
            onClick={() => {
              setAddingProject(true);
              setEditingProject(null);
              setSelectedProject(null);
            }}
          >
            <Plus className="h-5 w-5" />
            Add Project
          </Button>
        }
        onListView={() => {
          setViewMode("list");
          window.location.hash = "#list";
        }}
      />
    </div>
  );
};

/* ======= Sub-components ======= */

function ResourceChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-foreground/10 bg-background/50">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span className="text-xs font-semibold text-foreground">{value}</span>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className="flex">
        <div className="bg-background/90 backdrop-blur-sm border border-b-0 border-foreground/20 rounded-t px-2.5 py-0.5">
          <span className="text-[9px] font-bold tracking-[0.15em] text-muted-foreground uppercase">
            {title}
          </span>
        </div>
      </div>
      <div className="border-2 border-foreground/20 rounded-tr rounded-b bg-background/90 backdrop-blur-sm">
        <div className="border border-foreground/5 rounded-tr rounded-b p-1">
          {children}
        </div>
      </div>
    </div>
  );
}

/** Right-side project detail panel — replaces hover cards */
function ProjectDetailPanel({
  project,
  onClose,
}: {
  project: EcosystemProject;
  onClose: () => void;
}) {
  const [imageIndex, setImageIndex] = useState(0);
  const categoryColor = getCategoryColor(project.category);
  const categoryName = getCategoryName(project.category);

  const hex = categoryColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return (
    <div className="w-[340px] max-h-[calc(100vh-180px)] flex flex-col">
      {/* Title tab */}
      <div className="flex justify-end pr-3">
        <div className="bg-background/90 backdrop-blur-sm border border-b-0 border-foreground/20 rounded-t px-2.5 py-0.5">
          <span className="text-[9px] font-bold tracking-[0.15em] text-muted-foreground uppercase">
            PROJECT INTEL
          </span>
        </div>
      </div>

      {/* Panel body */}
      <div className="border-l-2 border-t-2 border-b-2 border-foreground/20 rounded-l-lg bg-background/95 backdrop-blur-sm overflow-hidden flex flex-col">
        <div className="border-l border-t border-b border-foreground/5 rounded-l-lg p-0 overflow-y-auto flex-1 scrollbar-hide">
          {/* Header with colored accent */}
          <div
            className="px-4 py-3 border-b border-foreground/10"
            style={{ backgroundColor: `rgba(${r}, ${g}, ${b}, 0.08)` }}
          >
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col items-center text-center -mt-1">
              {/* Logo / Emoji */}
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center font-bold overflow-hidden"
                style={{
                  color: categoryColor,
                  fontSize: project.emoji ? 36 : 20,
                }}
              >
                {project.imageUrl ? (
                  <img
                    src={project.imageUrl}
                    alt={project.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  project.emoji ||
                  project.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                )}
              </div>
              {/* Title */}
              <h2 className="font-bold text-sm text-foreground mt-2">
                {project.name}
              </h2>
              {/* Tags row */}
              <div className="flex items-center gap-1.5 mt-1.5">
                {project.tags?.includes("nsOfficial") && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-foreground text-background text-[9px] font-medium shrink-0">
                    <svg
                      width="10"
                      height="7"
                      viewBox="0 0 30 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9.04883 0C14.4015 1.58136e-05 18.0466 0.857342 21.4111 0.857422C24.5739 0.857419 26.8592 0.730968 29.0273 0.478516C29.2469 0.453142 29.4413 0.621298 29.4414 0.838867V19.2832C29.4411 19.4516 29.323 19.5976 29.1543 19.626C27.6623 19.8749 24.1475 20 21.4111 20C18.4798 19.9999 14.1466 19.1426 9.55859 19.1426C5.14747 19.1426 2.72034 19.3956 0.432617 19.7822C0.207077 19.8203 0.000341557 19.6499 0 19.4248V1.0332C3.69636e-05 0.851129 0.136849 0.697243 0.320312 0.673828C2.56107 0.389876 5.35291 0 9.04883 0ZM13.4951 8.76074C11.9493 8.65328 10.6111 8.66895 9.43164 8.66895V11.1475C10.2548 11.1475 11.7426 11.1495 13.4922 11.2998C13.4903 13.3072 13.492 15.0743 13.5088 15.4326C14.1458 15.5754 14.5286 15.5754 15.791 15.8018V11.5508C17.549 11.7554 18.8433 11.8613 20.1377 11.8613V9.29004C18.7357 9.29004 17.6985 9.187 15.791 8.98242V4.79199C15.7758 4.78999 14.1434 4.57627 13.5088 4.57617C13.5086 4.61678 13.5007 6.53989 13.4951 8.76074Z"
                        fill="currentColor"
                      />
                    </svg>
                    Official
                  </span>
                )}
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                  style={{
                    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.15)`,
                    color: categoryColor,
                  }}
                >
                  {categoryName}
                </span>
                {project.tags?.includes("free") && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">
                    Free
                  </span>
                )}
                {project.tags?.includes("paid") && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                    Paid
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Content sections */}
          <div className="px-4 py-3 space-y-4">
            {/* Description */}
            {project.description && (
              <p className="text-sm text-foreground/80 leading-relaxed">
                {project.description}
              </p>
            )}

            {/* CTA */}
            {project.url && (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full py-2 rounded-lg border-2 border-foreground/20 bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors"
              >
                Visit Tool
              </a>
            )}

            {/* NS Profiles / Active Users */}
            {project.nsProfileUrls && project.nsProfileUrls.length > 0 && (
              <DetailSection label="NS PROFILES">
                <div className="flex flex-col gap-1.5">
                  {project.nsProfileUrls.map((profileUrl, idx) => {
                    const username = profileUrl.split("/").pop() || profileUrl;
                    return (
                      <a
                        key={idx}
                        href={profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/30 border border-foreground/5 text-xs hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-primary font-medium">
                          @{username}
                        </span>
                      </a>
                    );
                  })}
                </div>
              </DetailSection>
            )}

            {/* Product Images */}
            {project.productImages && project.productImages.length > 0 && (
              <DetailSection label="MEDIA">
                <div className="space-y-2">
                  <div className="rounded-lg overflow-hidden border border-foreground/10 bg-muted/20 aspect-[4/3]">
                    <img
                      src={project.productImages[imageIndex]}
                      alt={`${project.name} screenshot ${imageIndex + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                  {project.productImages.length > 1 && (
                    <div className="flex gap-1.5">
                      {project.productImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setImageIndex(idx)}
                          className={`relative flex-1 aspect-square rounded overflow-hidden border-2 transition-all ${
                            idx === imageIndex
                              ? "border-foreground ring-1 ring-foreground/20"
                              : "border-foreground/10 opacity-60 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={img}
                            alt={`${project.name} thumbnail ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </DetailSection>
            )}

            {/* Products & Plans */}
            <ProductsSection project={project} />

            {/* Status / Released / Location */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold tracking-[0.15em] text-muted-foreground uppercase">
                  Status
                </span>
                <div className="flex items-center gap-1.5 text-xs">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${project.status === "dead" ? "bg-red-500" : "bg-emerald-500"}`}
                  />
                  <span className="text-foreground/80">
                    {project.status === "dead" ? "Inactive" : "Active"}
                  </span>
                </div>
              </div>
              {project.addedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold tracking-[0.15em] text-muted-foreground uppercase">
                    Released
                  </span>
                  <span className="text-xs text-foreground/80">
                    {new Date(project.addedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
              {project.locations &&
                project.locations.length > 0 &&
                (() => {
                  const [lat, lon] = project.locations[0]
                    .split(",")
                    .map(Number);
                  const isNS =
                    Math.abs(lat - 1.3356) < 0.02 &&
                    Math.abs(lon - 103.5943) < 0.02;
                  return (
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold tracking-[0.15em] text-muted-foreground uppercase">
                        Location
                      </span>
                      <span className="text-xs text-foreground/80">
                        {isNS
                          ? "Forest City, MY"
                          : `${lat.toFixed(2)}, ${lon.toFixed(2)}`}
                      </span>
                    </div>
                  );
                })()}
            </div>

            {/* Links */}
            {(project.url || project.guideUrl) && (
              <DetailSection label="LINKS">
                <div className="flex flex-col gap-1.5">
                  {project.url && (
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {project.url.replace(/^https?:\/\/(www\.)?/, "")}
                      </span>
                    </a>
                  )}
                  {project.guideUrl && (
                    <a
                      href={project.guideUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <BookOpen className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Guide</span>
                    </a>
                  )}
                </div>
              </DetailSection>
            )}

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <DetailSection label="TAGS">
                <div className="flex flex-wrap gap-1.5">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded border border-foreground/10 bg-muted/30 text-foreground/70 font-mono uppercase tracking-wider"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </DetailSection>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Products / Plans accordion section shown in the detail panel */
function ProductsSection({ project }: { project: EcosystemProject }) {
  const plans = project.plans;
  const [openItem, setOpenItem] = useState<string>("");
  if (!plans || plans.length === 0) return null;

  return (
    <DetailSection label="PRODUCTS">
      <Accordion
        type="single"
        collapsible
        value={openItem}
        onValueChange={setOpenItem}
        className="w-full space-y-1.5"
      >
        {plans.map((plan, idx) => {
          const value = `plan-${idx}`;
          const isOpen = openItem === value;
          return (
            <AccordionItem
              key={idx}
              value={value}
              className="border border-foreground/10 rounded-lg px-3"
            >
              <AccordionTrigger className="py-2 text-xs font-semibold hover:no-underline gap-2">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="truncate">{plan.name}</span>
                  {!isOpen && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 shrink-0">
                      {plan.price}
                      {plan.interval && (
                        <span className="text-emerald-500">
                          /{plan.interval}
                        </span>
                      )}
                    </span>
                  )}
                  {isOpen && plan.url && (
                    <a
                      href={plan.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-foreground text-background hover:bg-foreground/80 transition-colors shrink-0"
                    >
                      Get Plan
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-xs text-foreground/70 pb-3 pt-0">
                <p className="mb-2 leading-relaxed">{plan.description}</p>
                <ul className="space-y-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 mt-0.5 shrink-0">
                        &bull;
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </DetailSection>
  );
}

/** Labeled section within the detail panel */
function DetailSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[9px] font-bold tracking-[0.15em] text-muted-foreground uppercase mb-1.5">
        {label}
      </div>
      {children}
    </div>
  );
}

/** FAQ item used in the help modal */
function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-foreground">{q}</p>
      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
        {a}
      </p>
    </div>
  );
}

export default Index;
