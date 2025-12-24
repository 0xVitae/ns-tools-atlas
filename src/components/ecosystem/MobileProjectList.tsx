import React, { useState, useMemo } from "react";
import { EcosystemProject, Category } from "@/types/ecosystem";
import {
  buildCategoriesFromProjects,
  getCategoryColor,
  getCategoryName,
} from "@/data/ecosystemData";
import { ExternalLink, BookOpen, ChevronRight, Search, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { AddProjectForm } from "./AddProjectForm";

interface MobileProjectListProps {
  projects: EcosystemProject[];
  onAddProject: (project: Omit<EcosystemProject, "id">) => void;
  isSubmitting?: boolean;
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

            {/* Product Images */}
            {project.productImages && project.productImages.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900">Screenshots</h4>
                <div className="relative rounded-xl overflow-hidden border border-gray-100">
                  <img
                    src={project.productImages[currentImageIndex]}
                    alt={`${project.name} screenshot ${currentImageIndex + 1}`}
                    className="w-full h-auto"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
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
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<EcosystemProject | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Build categories from projects
  const categories = useMemo(() => {
    return buildCategoriesFromProjects(projects);
  }, [projects]);

  // Filter projects by search
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

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

            {/* Add Project Button */}
            <AddProjectForm
              onAddProject={onAddProject}
              isSubmitting={isSubmitting}
              categories={categories}
              isMobile={true}
            />
          </div>

          {/* Search Bar */}
          <div className="relative">
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
                          onClick={() => setSelectedProject(project)}
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
        onClose={() => setSelectedProject(null)}
        categories={categories}
      />
    </div>
  );
};
