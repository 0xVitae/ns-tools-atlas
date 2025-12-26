import React, { useState, useMemo, useEffect, useCallback } from "react";
import { EcosystemProject, Category } from "@/types/ecosystem";
import {
  buildCategoriesFromProjects,
  getCategoryColor,
  getCategoryName,
  generateProjectSlug,
} from "@/data/ecosystemData";
import { ExternalLink, BookOpen, ChevronRight, Search, X, LayoutGrid, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AddProjectForm } from "./AddProjectForm";
import { ProjectTag } from "@/types/ecosystem";

interface MobileProjectListProps {
  projects: EcosystemProject[];
  onAddProject: (project: Omit<EcosystemProject, "id">) => void;
  isSubmitting?: boolean;
  showViewToggle?: boolean;
  viewMode?: "canvas" | "list";
  onViewModeChange?: (mode: "canvas" | "list") => void;
}

// Get colors based on category
const getCategoryProjectColors = (category: string) => {
  const baseColor = getCategoryColor(category);
  const hex = baseColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return {
    bg: `rgba(${r}, ${g}, ${b}, 0.08)`,
    text: baseColor,
    border: `rgba(${r}, ${g}, ${b}, 0.2)`,
    accent: `rgba(${r}, ${g}, ${b}, 0.12)`,
  };
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

// Project Card Component
const ProjectCard: React.FC<{
  project: EcosystemProject;
  colors: ReturnType<typeof getCategoryProjectColors>;
  onClick: () => void;
}> = ({ project, colors, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 active:scale-[0.98] transition-transform duration-150"
      style={{
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {/* Icon/Logo */}
      <div
        className="shrink-0 w-11 h-11 rounded-lg flex items-center justify-center overflow-hidden"
        style={{
          backgroundColor: colors.bg,
          border: `1.5px solid ${colors.border}`,
        }}
      >
        {project.imageUrl ? (
          <img
            src={project.imageUrl}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        ) : project.emoji ? (
          <span className="text-lg">{project.emoji}</span>
        ) : (
          <span
            className="text-xs font-bold"
            style={{ color: colors.text }}
          >
            {getInitials(project.name)}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <h3 className="font-semibold text-[15px] text-gray-900 truncate leading-tight">
          {project.name}
        </h3>
        {project.description && (
          <p className="text-[13px] text-gray-500 truncate mt-0.5">
            {project.description}
          </p>
        )}
      </div>

      {/* Arrow */}
      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
    </button>
  );
};

// Project Detail Drawer
const ProjectDetailDrawer: React.FC<{
  project: EcosystemProject | null;
  open: boolean;
  onClose: () => void;
  categories: Category[];
}> = ({ project, open, onClose, categories }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance to trigger navigation (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (project?.productImages) {
      if (isLeftSwipe && currentImageIndex < project.productImages.length - 1) {
        setCurrentImageIndex((prev) => prev + 1);
      } else if (isRightSwipe && currentImageIndex > 0) {
        setCurrentImageIndex((prev) => prev - 1);
      }
    }
  };

  // Reset image index when project changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [project?.id]);

  if (!project) return null;

  const colors = getCategoryProjectColors(project.category);
  const category = categories.find((c) => c.id === project.category);
  const categoryName = category?.name || getCategoryName(project.category);

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <div className="overflow-y-auto">
          <DrawerHeader className="pb-0">
            <div className="flex items-start gap-4">
              {/* Large Icon */}
              <div
                className="shrink-0 w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden"
                style={{
                  backgroundColor: colors.bg,
                  border: `2px solid ${colors.border}`,
                }}
              >
                {project.imageUrl ? (
                  <img
                    src={project.imageUrl}
                    alt={project.name}
                    className="w-full h-full object-cover"
                  />
                ) : project.emoji ? (
                  <span className="text-3xl">{project.emoji}</span>
                ) : (
                  <span
                    className="text-lg font-bold"
                    style={{ color: colors.text }}
                  >
                    {getInitials(project.name)}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0 pt-1">
                <DrawerTitle className="text-xl font-bold text-left">
                  {project.name}
                </DrawerTitle>
                <span
                  className="inline-block text-xs font-medium px-2 py-1 rounded-md mt-2"
                  style={{
                    backgroundColor: colors.bg,
                    color: colors.text,
                  }}
                >
                  {categoryName}
                </span>
              </div>
            </div>
          </DrawerHeader>

          <div className="px-4 pb-8 pt-4 space-y-5">
            {/* Description */}
            {project.description && (
              <p className="text-[15px] text-gray-600 leading-relaxed">
                {project.description}
              </p>
            )}

            {/* Links */}
            {(project.url || project.guideUrl) && (
              <div className="flex flex-wrap gap-3">
                {project.url && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors"
                    style={{
                      backgroundColor: colors.text,
                      color: "white",
                    }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visit Website
                  </a>
                )}
                {project.guideUrl && (
                  <a
                    href={project.guideUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm border transition-colors"
                    style={{
                      borderColor: colors.border,
                      color: colors.text,
                    }}
                  >
                    <BookOpen className="w-4 h-4" />
                    View Guide
                  </a>
                )}
              </div>
            )}

            {/* NS Profile Links */}
            {project.nsProfileUrls && project.nsProfileUrls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {project.nsProfileUrls.map((profileUrl, idx) => {
                  // Extract username from URL like https://ns.com/alexignatov
                  const username = profileUrl.split('/').pop() || profileUrl;
                  return (
                    <a
                      key={idx}
                      href={profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: colors.bg,
                        color: colors.text,
                      }}
                    >
                      @{username}
                    </a>
                  );
                })}
              </div>
            )}

            {/* Product Images */}
            {project.productImages && project.productImages.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">Screenshots</h4>
                  {project.productImages.length > 1 && (
                    <span className="text-xs text-gray-400">
                      {currentImageIndex + 1} / {project.productImages.length}
                    </span>
                  )}
                </div>
                <div
                  className="relative rounded-xl overflow-hidden border border-gray-100 touch-pan-y"
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                >
                  <img
                    src={project.productImages[currentImageIndex]}
                    alt={`${project.name} screenshot ${currentImageIndex + 1}`}
                    className="w-full h-auto select-none pointer-events-none"
                    draggable={false}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  {/* Swipe hint overlay for multiple images */}
                  {project.productImages.length > 1 && (
                    <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
                      <div
                        className={`w-8 h-8 rounded-full bg-black/20 flex items-center justify-center transition-opacity ${
                          currentImageIndex > 0 ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        <ChevronRight className="w-4 h-4 text-white rotate-180" />
                      </div>
                      <div
                        className={`w-8 h-8 rounded-full bg-black/20 flex items-center justify-center transition-opacity ${
                          currentImageIndex < project.productImages.length - 1
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      >
                        <ChevronRight className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
                {project.productImages.length > 1 && (
                  <div className="flex justify-center gap-2">
                    {project.productImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          idx === currentImageIndex
                            ? "bg-gray-900"
                            : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export const MobileProjectList: React.FC<MobileProjectListProps> = ({
  projects,
  onAddProject,
  isSubmitting,
  showViewToggle,
  onViewModeChange,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<EcosystemProject | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [activeTagFilters, setActiveTagFilters] = useState<ProjectTag[]>([]);

  // Build categories from projects
  const categories = useMemo(() => {
    return buildCategoriesFromProjects(projects);
  }, [projects]);

  // Toggle a tag filter on/off
  const toggleTagFilter = (tag: ProjectTag) => {
    setActiveTagFilters((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Filter projects by search and tags
  const filteredProjects = useMemo(() => {
    let result = projects;

    // Filter by tags first (OR logic)
    if (activeTagFilters.length > 0) {
      result = result.filter((project) =>
        project.tags?.some((tag) => activeTagFilters.includes(tag))
      );
    }

    // Then filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [projects, searchQuery, activeTagFilters]);

  // Group projects by category
  const projectsByCategory = useMemo(() => {
    return filteredProjects.reduce((acc, project) => {
      if (!acc[project.category]) acc[project.category] = [];
      acc[project.category].push(project);
      return acc;
    }, {} as Record<string, EcosystemProject[]>);
  }, [filteredProjects]);

  // Get sorted category IDs (by number of projects)
  const sortedCategoryIds = useMemo(() => {
    return Object.keys(projectsByCategory).sort(
      (a, b) => projectsByCategory[b].length - projectsByCategory[a].length
    );
  }, [projectsByCategory]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Start with all categories expanded
  React.useEffect(() => {
    if (expandedCategories.size === 0 && sortedCategoryIds.length > 0) {
      setExpandedCategories(new Set(sortedCategoryIds));
    }
  }, [sortedCategoryIds, expandedCategories.size]);

  // Select a project and update the URL hash
  const selectProject = useCallback(
    (project: EcosystemProject | null) => {
      setSelectedProject(project);
      if (project) {
        const slug = generateProjectSlug(project.name);
        history.replaceState(null, "", `#${slug}`);
      } else {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    },
    []
  );

  // Find project by URL hash slug
  const findProjectBySlug = useCallback(
    (slug: string): EcosystemProject | undefined => {
      return projects.find((p) => generateProjectSlug(p.name) === slug);
    },
    [projects]
  );

  // Handle URL hash on mount and hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove the # prefix
      if (hash) {
        const project = findProjectBySlug(hash);
        if (project) {
          setSelectedProject(project);
        }
      }
    };

    // Handle initial hash on mount
    handleHashChange();

    // Listen for hash changes (browser back/forward)
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [findProjectBySlug]);

  return (
    <div className="min-h-screen bg-gray-50/80 pb-safe">
      {/* Fixed Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="px-4 pt-4 pb-3">
          {/* Title Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <img
                src="/favicon.png"
                alt="NS Tools Atlas"
                width="28"
                height="28"
                className="rounded-lg"
              />
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">
                  NS Tools Atlas
                </h1>
                <p className="text-xs text-gray-500">
                  {projects.length} projects
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View Toggle - always show if handler provided */}
              {onViewModeChange && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 rounded-full border-gray-200"
                  onClick={() => onViewModeChange("canvas")}
                  title="Switch to canvas view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              )}

              {/* Add Project Button */}
              <AddProjectForm
                onAddProject={onAddProject}
                isSubmitting={isSubmitting}
                categories={categories}
                isMobile={!showViewToggle}
              />
            </div>
          </div>

          {/* Search Bar with Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 h-10 bg-gray-50 border-gray-200 rounded-xl text-[15px] placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              )}
            </div>

            {/* Filter Button */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-xl border-gray-200 bg-gray-50 relative"
                >
                  <ListFilter className="h-4 w-4 text-gray-500" />
                  {activeTagFilters.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" side="bottom" align="end">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground px-2 py-1">
                    Filter by tags
                  </span>
                  <button
                    className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted transition-colors ${
                      activeTagFilters.includes("nsOfficial") ? "bg-muted" : ""
                    }`}
                    onClick={() => toggleTagFilter("nsOfficial")}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        activeTagFilters.includes("nsOfficial")
                          ? "bg-primary border-primary"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {activeTagFilters.includes("nsOfficial") && (
                        <svg
                          className="w-3 h-3 text-primary-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1">
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
                    </span>
                  </button>
                  <button
                    className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted transition-colors ${
                      activeTagFilters.includes("free") ? "bg-muted" : ""
                    }`}
                    onClick={() => toggleTagFilter("free")}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        activeTagFilters.includes("free")
                          ? "bg-primary border-primary"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {activeTagFilters.includes("free") && (
                        <svg
                          className="w-3 h-3 text-primary-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-emerald-600">Free</span>
                  </button>
                  <button
                    className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted transition-colors ${
                      activeTagFilters.includes("paid") ? "bg-muted" : ""
                    }`}
                    onClick={() => toggleTagFilter("paid")}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        activeTagFilters.includes("paid")
                          ? "bg-primary border-primary"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {activeTagFilters.includes("paid") && (
                        <svg
                          className="w-3 h-3 text-primary-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-amber-600">Paid</span>
                  </button>
                  {activeTagFilters.length > 0 && (
                    <>
                      <div className="h-px bg-border my-1" />
                      <button
                        className="px-2 py-1.5 rounded text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        onClick={() => setActiveTagFilters([])}
                      >
                        Clear filters
                      </button>
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-5">
        {sortedCategoryIds.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No projects found
          </div>
        ) : (
          sortedCategoryIds.map((categoryId) => {
            const categoryProjects = projectsByCategory[categoryId];
            const category = categories.find((c) => c.id === categoryId);
            const categoryName = category?.name || getCategoryName(categoryId);
            const colors = getCategoryProjectColors(categoryId);
            const isExpanded = expandedCategories.has(categoryId);

            return (
              <div key={categoryId}>
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(categoryId)}
                  className="w-full flex items-center justify-between mb-2 px-1"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: colors.text }}
                    />
                    <h2 className="text-sm font-semibold text-gray-900">
                      {categoryName}
                    </h2>
                    <span className="text-xs text-gray-400 font-medium">
                      {categoryProjects.length}
                    </span>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {/* Project List */}
                {isExpanded && (
                  <div className="space-y-2">
                    {categoryProjects.map((project, idx) => (
                      <div
                        key={project.id}
                        className="animate-in fade-in-0 slide-in-from-bottom-1"
                        style={{ animationDelay: `${idx * 30}ms`, animationFillMode: "backwards" }}
                      >
                        <ProjectCard
                          project={project}
                          colors={colors}
                          onClick={() => selectProject(project)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-6 text-center">
        <a
          href="https://x.com/byornoste"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Built by Byorn
        </a>
      </div>

      {/* Project Detail Drawer */}
      <ProjectDetailDrawer
        project={selectedProject}
        open={!!selectedProject}
        onClose={() => selectProject(null)}
        categories={categories}
      />
    </div>
  );
};
