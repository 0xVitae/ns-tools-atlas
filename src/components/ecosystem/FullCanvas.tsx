import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { EcosystemProject, Category } from "@/types/ecosystem";
import {
  buildCategoriesFromProjects,
  getCategoryColor,
  getCategoryName,
} from "@/data/ecosystemData";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import ActionSearchBar, {
  Action,
  ActionSearchBarRef,
} from "@/components/kokonutui/action-search-bar";
import { AddProjectForm } from "./AddProjectForm";

interface FullCanvasProps {
  projects: EcosystemProject[];
  onAddProject: (project: Omit<EcosystemProject, "id">) => void;
  isSubmitting?: boolean;
}

// Product Image Carousel Component with prev/next buttons
const ProductImageCarousel: React.FC<{
  images: string[];
  projectName: string;
}> = ({ images, projectName }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative pt-2">
      {/* Main Image */}
      <div className="rounded-lg overflow-hidden border border-border/50 bg-muted/20">
        <img
          src={images[currentIndex]}
          alt={`${projectName} screenshot ${currentIndex + 1}`}
          className="w-full h-auto object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='60' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='1'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21,15 16,10 5,21'/%3E%3C/svg%3E";
          }}
        />
      </div>

      {/* Navigation - only show if more than 1 image */}
      {images.length > 1 && (
        <>
          {/* Prev/Next Buttons */}
          <button
            onClick={goToPrev}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/90 border border-border/50 flex items-center justify-center hover:bg-background transition-colors shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/90 border border-border/50 flex items-center justify-center hover:bg-background transition-colors shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setCurrentIndex(idx);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  idx === currentIndex
                    ? "bg-primary"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Layout constants
const PADDING = 40;
const GAP = 24;
const TITLE_HEIGHT = 90;
const MIN_BOX_WIDTH = 240;
const MIN_BOX_HEIGHT = 160;
const CELL_WIDTH = 110; // Width per item cell
const CELL_HEIGHT = 100; // Height per item cell (icon + label + spacing)
const ITEMS_PER_ROW_BASE = 4; // Base items per row for width calculation

// Calculate box dimensions based on project count
const calculateBoxSize = (projectCount: number) => {
  const count = Math.max(1, projectCount);
  const cols = Math.min(count, ITEMS_PER_ROW_BASE);
  const rows = Math.ceil(count / ITEMS_PER_ROW_BASE);

  const width = Math.max(MIN_BOX_WIDTH, cols * CELL_WIDTH + 40);
  const height = Math.max(MIN_BOX_HEIGHT, rows * CELL_HEIGHT + 50);

  return { width, height };
};

// Simple column-based layout algorithm
const calculateLayout = (
  categories: Category[],
  projectsByCategory: Record<string, EcosystemProject[]>
) => {
  const layout: Record<
    string,
    { x: number; y: number; width: number; height: number }
  > = {};

  // Only include categories that have at least one project
  const allCategoryIds = new Set(
    Object.keys(projectsByCategory).filter(
      (categoryId) => projectsByCategory[categoryId]?.length > 0
    )
  );

  // Calculate sizes for each category
  const categoryData = Array.from(allCategoryIds).map((id) => {
    const count = projectsByCategory[id]?.length || 0;
    const size = calculateBoxSize(count);
    return { id, ...size, count };
  });

  // Sort by height (tallest first) for better packing
  categoryData.sort((a, b) => b.height - a.height);

  // Use 3 columns
  const numColumns = 3;
  const columnWidths = [300, 320, 300];
  const columnX = [
    PADDING,
    PADDING + columnWidths[0] + GAP,
    PADDING + columnWidths[0] + columnWidths[1] + GAP * 2,
  ];
  const columnY = [TITLE_HEIGHT, TITLE_HEIGHT, TITLE_HEIGHT];

  // Assign each category to the shortest column
  categoryData.forEach(({ id, width, height }) => {
    // Find column with least height
    let minCol = 0;
    for (let i = 1; i < numColumns; i++) {
      if (columnY[i] < columnY[minCol]) {
        minCol = i;
      }
    }

    // Place in that column
    layout[id] = {
      x: columnX[minCol],
      y: columnY[minCol],
      width: columnWidths[minCol],
      height: height,
    };

    // Update column height
    columnY[minCol] += height + GAP;
  });

  // Calculate total canvas dimensions
  const maxHeight = Math.max(...columnY) + PADDING;
  const totalWidth =
    columnX[numColumns - 1] + columnWidths[numColumns - 1] + PADDING;

  return { layout, canvasWidth: totalWidth, canvasHeight: maxHeight };
};

export const FullCanvas: React.FC<FullCanvasProps> = ({
  projects,
  onAddProject,
  isSubmitting,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const searchBarRef = useRef<ActionSearchBarRef>(null);

  // Use refs for transform to avoid re-renders during pan/zoom
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const isPanningRef = useRef(false);
  const startPanRef = useRef({ x: 0, y: 0 });
  const rafIdRef = useRef<number | null>(null);

  // Only use state for UI that needs re-renders
  const [displayScale, setDisplayScale] = useState(100);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  // Build dynamic categories from projects data
  const categories = useMemo(() => {
    return buildCategoriesFromProjects(projects);
  }, [projects]);

  // Group projects by category
  const projectsByCategory = useMemo(() => {
    return projects.reduce((acc, project) => {
      if (!acc[project.category]) acc[project.category] = [];
      acc[project.category].push(project);
      return acc;
    }, {} as Record<string, EcosystemProject[]>);
  }, [projects]);

  // Convert projects to search actions
  const searchActions: Action[] = useMemo(() => {
    return projects.map((project) => {
      return {
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
      };
    });
  }, [projects]);

  // Calculate dynamic layout based on projects
  const {
    layout: dynamicLayout,
    canvasWidth,
    canvasHeight,
  } = useMemo(() => {
    return calculateLayout(categories, projectsByCategory);
  }, [categories, projectsByCategory]);

  // Apply transform directly to DOM (no React re-render)
  const applyTransform = useCallback(() => {
    if (canvasRef.current) {
      const { x, y, scale } = transformRef.current;
      canvasRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    }
  }, []);

  // Center the canvas on load and when layout changes
  useEffect(() => {
    const centerCanvas = () => {
      if (typeof window !== "undefined") {
        const scale = 1;
        const x = (window.innerWidth - canvasWidth * scale) / 2;
        const y = (window.innerHeight - canvasHeight * scale) / 2;
        transformRef.current = { x, y, scale };
        setDisplayScale(100);
        applyTransform();
      }
    };
    centerCanvas();
  }, [applyTransform, canvasWidth, canvasHeight]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  // Get colors based on category (with fallback for new categories)
  const getCategoryProjectColors = (category: string) => {
    const baseColor = getCategoryColor(category);
    // Parse the hex color and create lighter/darker variants
    const hex = baseColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return {
      bg: `rgba(${r}, ${g}, ${b}, 0.15)`,
      text: baseColor,
      border: `rgba(${r}, ${g}, ${b}, 0.4)`,
    };
  };

  // Simple hash function to generate a deterministic number from a string
  const hashString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  // Seeded random number generator for deterministic randomness
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed * 9999) * 10000;
    return x - Math.floor(x);
  };

  // Calculate all item positions for a category using grid-based layout with jitter
  const calculateCategoryPositions = (
    categoryProjects: EcosystemProject[],
    boxWidth: number,
    boxHeight: number,
    _baseSize: number
  ): Record<string, { x: number; y: number }> => {
    if (categoryProjects.length === 0) return {};

    const count = categoryProjects.length;

    // Usable area bounds
    const padding = 24;
    const topPadding = 45;
    const usableWidth = boxWidth - padding * 2;
    const usableHeight = boxHeight - topPadding - padding;

    const positions: Record<string, { x: number; y: number }> = {};

    // For small counts (< 5), use scattered placement for organic look
    if (count < 5) {
      // Predefined scattered positions as percentages of usable area
      // Positions are spread apart to prevent overlaps
      const scatterPatterns: Record<number, { x: number; y: number }[]> = {
        1: [{ x: 0.5, y: 0.5 }],
        2: [
          { x: 0.25, y: 0.35 },
          { x: 0.75, y: 0.65 },
        ],
        3: [
          { x: 0.2, y: 0.25 },
          { x: 0.75, y: 0.35 },
          { x: 0.4, y: 0.75 },
        ],
        4: [
          { x: 0.2, y: 0.25 },
          { x: 0.8, y: 0.2 },
          { x: 0.25, y: 0.75 },
          { x: 0.8, y: 0.7 },
        ],
      };

      const pattern = scatterPatterns[count];
      categoryProjects.forEach((project, index) => {
        const base = pattern[index];
        const seed = hashString(project.id);
        // Small jitter (5%) - just enough for organic feel without causing overlaps
        const jitterX = (seededRandom(seed) - 0.5) * 0.05;
        const jitterY = (seededRandom(seed + 1) - 0.5) * 0.05;

        positions[project.id] = {
          x: padding + (base.x + jitterX) * usableWidth,
          y: topPadding + (base.y + jitterY) * usableHeight,
        };
      });

      return positions;
    }

    // For larger counts, use grid with jitter
    const aspectRatio = usableWidth / usableHeight;
    let cols = Math.ceil(Math.sqrt(count * aspectRatio));
    let rows = Math.ceil(count / cols);

    // Ensure we have enough cells
    while (cols * rows < count) {
      if (usableWidth / cols > usableHeight / rows) {
        cols++;
      } else {
        rows++;
      }
    }

    // Calculate cell size
    const cellWidth = usableWidth / cols;
    const cellHeight = usableHeight / rows;

    // Maximum jitter is 20% of the smaller cell dimension
    const maxJitter = Math.min(cellWidth, cellHeight) * 0.2;

    categoryProjects.forEach((project, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      // Center of grid cell
      const centerX = padding + cellWidth * (col + 0.5);
      const centerY = topPadding + cellHeight * (row + 0.5);

      // Add deterministic jitter based on project ID
      const seed = hashString(project.id);
      const jitterX = (seededRandom(seed) - 0.5) * maxJitter * 2;
      const jitterY = (seededRandom(seed + 1) - 0.5) * maxJitter * 2;

      positions[project.id] = {
        x: centerX + jitterX,
        y: centerY + jitterY,
      };
    });

    return positions;
  };

  // Memoize positions for each category to avoid recalculating on every render
  const categoryPositions = useMemo(() => {
    const allPositions: Record<
      string,
      Record<string, { x: number; y: number }>
    > = {};

    Object.entries(dynamicLayout).forEach(([categoryId, boxLayout]) => {
      const categoryProjects = projectsByCategory[categoryId] || [];
      const baseSize = Math.min(55, Math.max(38, boxLayout.width / 5.5));
      allPositions[categoryId] = calculateCategoryPositions(
        categoryProjects,
        boxLayout.width,
        boxLayout.height,
        baseSize
      );
    });

    return allPositions;
  }, [dynamicLayout, projectsByCategory]);

  // Handle search selection - pan to the selected project
  const handleSearchSelect = useCallback(
    (action: Action) => {
      const project = projects.find((p) => p.id === action.id);
      if (!project) return;

      const boxLayout = dynamicLayout[project.category];
      const pos = categoryPositions[project.category]?.[project.id];
      if (!boxLayout || !pos) return;

      // Calculate the absolute position of the project on the canvas
      const projectX = boxLayout.x + pos.x;
      const projectY = boxLayout.y + pos.y;

      // Pan to center the project on screen
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const scale = transformRef.current.scale;

      transformRef.current.x = rect.width / 2 - projectX * scale;
      transformRef.current.y = rect.height / 2 - projectY * scale;
      applyTransform();

      // Set the selected item to highlight it and grey out others
      setSelectedItem(project.id);
      setHoveredItem(project.id);
    },
    [projects, dynamicLayout, categoryPositions, applyTransform]
  );

  // Clear selection when clicking on canvas background
  const clearSelection = useCallback(() => {
    setSelectedItem(null);
  }, []);

  // Pan handlers - use refs and requestAnimationFrame for smooth performance
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      isPanningRef.current = true;
      startPanRef.current = {
        x: e.clientX - transformRef.current.x,
        y: e.clientY - transformRef.current.y,
      };
      if (containerRef.current) {
        containerRef.current.style.cursor = "grabbing";
      }
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanningRef.current) return;

      // Cancel any pending animation frame
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      // Schedule update on next animation frame
      rafIdRef.current = requestAnimationFrame(() => {
        transformRef.current.x = e.clientX - startPanRef.current.x;
        transformRef.current.y = e.clientY - startPanRef.current.y;
        applyTransform();
      });
    },
    [applyTransform]
  );

  const handleMouseUp = useCallback(() => {
    isPanningRef.current = false;
    if (containerRef.current) {
      containerRef.current.style.cursor = "grab";
    }
  }, []);

  const zoomIn = useCallback(() => {
    const newScale = Math.min(2, transformRef.current.scale * 1.15);
    transformRef.current.scale = newScale;
    applyTransform();
    setDisplayScale(Math.round(newScale * 100));
  }, [applyTransform]);

  const zoomOut = useCallback(() => {
    const newScale = Math.max(0.5, transformRef.current.scale / 1.15);
    transformRef.current.scale = newScale;
    applyTransform();
    setDisplayScale(Math.round(newScale * 100));
  }, [applyTransform]);

  const resetView = useCallback(() => {
    const scale = 1;
    const x = (window.innerWidth - canvasWidth * scale) / 2;
    const y = (window.innerHeight - canvasHeight * scale) / 2;
    transformRef.current = { x, y, scale };
    applyTransform();
    setDisplayScale(100);
  }, [applyTransform, canvasWidth, canvasHeight]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Attach wheel listener with passive: false to allow preventDefault
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault();

      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        const delta = e.deltaY > 0 ? 0.97 : 1.03;
        const newScale = Math.max(
          0.5,
          Math.min(2, transformRef.current.scale * delta)
        );

        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const scaleChange = newScale / transformRef.current.scale;
        transformRef.current.x =
          mouseX - (mouseX - transformRef.current.x) * scaleChange;
        transformRef.current.y =
          mouseY - (mouseY - transformRef.current.y) * scaleChange;

        transformRef.current.scale = newScale;
        applyTransform();
        setDisplayScale(Math.round(newScale * 100));
      });
    };

    container.addEventListener("wheel", wheelHandler, { passive: false });
    return () => container.removeEventListener("wheel", wheelHandler);
  }, [applyTransform]);

  // Cmd+K to focus search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchBarRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 bg-white overflow-hidden">
      {/* Top Bar */}
      <div className="absolute top-4 left-4 z-30">
        <div className="bg-white rounded-xl px-5 py-3 shadow-lg border border-foreground/10 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/favicon.png"
              alt="NS Tools Atlas"
              width="24"
              height="24"
              className="rounded"
            />
            <div>
              <h1 className="text-sm font-bold text-foreground leading-tight">
                NS Tools Atlas
              </h1>
              <p className="text-[10px] text-muted-foreground">
                {projects.length} projects
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Search Bar */}
          <ActionSearchBar
            ref={searchBarRef}
            actions={searchActions}
            placeholder="Find Projects"
            onSelect={handleSearchSelect}
          />
        </div>
      </div>

      {/* Zoom Controls - Stacked below top bar */}
      <div className="absolute top-20 left-4 z-30">
        <div className="bg-white rounded-lg shadow-lg border border-foreground/10 flex flex-col items-center p-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={zoomIn}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <span className="text-[10px] text-muted-foreground py-1">
            {displayScale}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={zoomOut}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <div className="h-px w-6 bg-border my-1" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={resetView}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Add Project Form - Top Right */}
      <div className="absolute top-4 right-4 z-30">
        <AddProjectForm
          onAddProject={onAddProject}
          isSubmitting={isSubmitting}
          categories={categories}
        />
      </div>

      {/* Built by credit */}
      <div className="absolute bottom-6 right-6 z-20">
        <a
          href="https://x.com/byornoste"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-border transition-colors"
        >
          🔨 Built by Byorn
        </a>
      </div>

      {/* Canvas hint */}
      <div className="absolute bottom-6 left-6 z-20 text-xs text-muted-foreground bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-border">
        Drag to pan • Scroll to zoom
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={clearSelection}
      >
        <div
          ref={canvasRef}
          className="origin-top-left will-change-transform bg-white relative"
          style={{
            width: canvasWidth,
            height: canvasHeight,
          }}
        >
          {/* Title on canvas */}
          <div className="flex items-center justify-center gap-3 pt-4 pb-2">
            <svg
              width="36"
              height="24"
              viewBox="0 0 30 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-foreground"
            >
              <path
                d="M9.04883 0C14.4015 1.58136e-05 18.0466 0.857342 21.4111 0.857422C24.5739 0.857419 26.8592 0.730968 29.0273 0.478516C29.2469 0.453142 29.4413 0.621298 29.4414 0.838867V19.2832C29.4411 19.4516 29.323 19.5976 29.1543 19.626C27.6623 19.8749 24.1475 20 21.4111 20C18.4798 19.9999 14.1466 19.1426 9.55859 19.1426C5.14747 19.1426 2.72034 19.3956 0.432617 19.7822C0.207077 19.8203 0.000341557 19.6499 0 19.4248V1.0332C3.69636e-05 0.851129 0.136849 0.697243 0.320312 0.673828C2.56107 0.389876 5.35291 0 9.04883 0ZM13.4951 8.76074C11.9493 8.65328 10.6111 8.66895 9.43164 8.66895V11.1475C10.2548 11.1475 11.7426 11.1495 13.4922 11.2998C13.4903 13.3072 13.492 15.0743 13.5088 15.4326C14.1458 15.5754 14.5286 15.5754 15.791 15.8018V11.5508C17.549 11.7554 18.8433 11.8613 20.1377 11.8613V9.29004C18.7357 9.29004 17.6985 9.187 15.791 8.98242V4.79199C15.7758 4.78999 14.1434 4.57627 13.5088 4.57617C13.5086 4.61678 13.5007 6.53989 13.4951 8.76074Z"
                fill="currentColor"
              />
            </svg>
            <h1
              className="text-2xl font-bold text-foreground"
              style={{ fontFamily: "Georgia, serif" }}
            >
              NS Tools Atlas
            </h1>
          </div>

          {/* Category Boxes - Dynamic Layout */}
          {Object.entries(dynamicLayout).map(([categoryId, boxLayout]) => {
            const category = categories.find((c) => c.id === categoryId);
            const categoryName = category?.name || getCategoryName(categoryId);
            const categoryProjects = projectsByCategory[categoryId] || [];

            return (
              <div
                key={categoryId}
                className="absolute rounded-lg bg-white border-2 border-foreground/80"
                style={{
                  left: boxLayout.x,
                  top: boxLayout.y,
                  width: boxLayout.width,
                  height: boxLayout.height,
                }}
              >
                {/* Category Label */}
                <div className="absolute left-1/2 -translate-x-1/2 -top-3 px-3 py-1 text-xs font-semibold bg-white">
                  {categoryName}
                </div>

                {/* Scattered Items */}
                {categoryProjects.map((project) => {
                  const pos = categoryPositions[categoryId]?.[project.id] || {
                    x: boxLayout.width / 2,
                    y: boxLayout.height / 2,
                  };
                  const colors = getCategoryProjectColors(categoryId);
                  const isHovered = hoveredItem === project.id;
                  const isSelected = selectedItem === project.id;
                  const isGreyedOut = selectedItem !== null && !isSelected;
                  const baseSize = Math.min(
                    55,
                    Math.max(38, boxLayout.width / 5.5)
                  );
                  // Expand size when selected
                  const displaySize = isSelected ? baseSize * 1.3 : baseSize;

                  return (
                    <HoverCard
                      key={project.id}
                      openDelay={100}
                      closeDelay={100}
                      open={isSelected ? true : undefined}
                    >
                      <HoverCardTrigger asChild>
                        <div
                          className="absolute flex flex-col items-center transition-all duration-150 ease-out select-none cursor-pointer"
                          style={{
                            left: pos.x,
                            top: pos.y,
                            transform: `translate(-50%, -50%) ${
                              isSelected
                                ? "scale(1.25)"
                                : isHovered
                                ? "scale(1.12)"
                                : "scale(1)"
                            }`,
                            zIndex: isSelected ? 20 : isHovered ? 10 : 1,
                            opacity: isGreyedOut ? 0.3 : 1,
                            filter: isGreyedOut ? "grayscale(100%)" : "none",
                          }}
                          onMouseEnter={() => setHoveredItem(project.id)}
                          onMouseLeave={() => setHoveredItem(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isSelected) {
                              setSelectedItem(null);
                            } else {
                              setSelectedItem(project.id);
                            }
                          }}
                        >
                          <div
                            className="rounded-lg flex items-center justify-center font-bold cursor-pointer transition-all duration-150 ease-out overflow-hidden"
                            style={{
                              width: displaySize,
                              height: displaySize * 0.72,
                              backgroundColor: colors.bg,
                              color: colors.text,
                              border: `2px solid ${
                                isSelected ? colors.text : colors.border
                              }`,
                              fontSize: project.emoji
                                ? displaySize * 0.4
                                : displaySize * 0.28,
                              boxShadow: isSelected
                                ? "0 8px 24px rgba(0,0,0,0.2)"
                                : isHovered
                                ? "0 6px 16px rgba(0,0,0,0.12)"
                                : "none",
                            }}
                          >
                            {project.imageUrl ? (
                              <img
                                src={project.imageUrl}
                                alt={project.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              project.emoji || getInitials(project.name)
                            )}
                          </div>
                          <div
                            className="mt-1 text-center leading-tight truncate transition-all duration-150 ease-out"
                            style={{
                              fontSize: Math.max(9, displaySize * 0.18),
                              maxWidth: displaySize + 20,
                              color: isSelected
                                ? colors.text
                                : isHovered
                                ? colors.text
                                : "#333",
                              fontWeight: isSelected || isHovered ? 600 : 400,
                            }}
                          >
                            {project.name}
                          </div>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent
                        className={`z-50 ${
                          project.productImages &&
                          project.productImages.length > 0
                            ? "w-96"
                            : "w-72"
                        }`}
                        side="top"
                        sideOffset={12}
                      >
                        <div className="flex flex-col gap-3">
                          {/* Header with emoji/initials/logo and name */}
                          <div className="flex items-center gap-3">
                            <div
                              className="rounded-lg flex items-center justify-center font-bold shrink-0 overflow-hidden"
                              style={{
                                width: 56,
                                height: 48,
                                backgroundColor: colors.bg,
                                color: colors.text,
                                border: `2px solid ${colors.border}`,
                                fontSize: project.emoji ? 28 : 16,
                              }}
                            >
                              {project.imageUrl ? (
                                <img
                                  src={project.imageUrl}
                                  alt={project.name}
                                  className="w-full h-full object-contain p-1"
                                />
                              ) : (
                                project.emoji || getInitials(project.name)
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-sm truncate">
                                {project.name}
                              </span>
                              <span
                                className="text-xs px-1.5 py-0.5 rounded w-fit"
                                style={{
                                  backgroundColor: colors.bg,
                                  color: colors.text,
                                }}
                              >
                                {category?.name || categoryId}
                              </span>
                            </div>
                          </div>

                          {/* Description */}
                          {project.description && (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {project.description}
                            </p>
                          )}

                          {/* Links */}
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            {project.url && (
                              <a
                                href={project.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-sm text-primary hover:underline w-fit"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Website
                              </a>
                            )}
                            {project.guideUrl && (
                              <a
                                href={project.guideUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-sm text-primary hover:underline w-fit"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                Guide
                              </a>
                            )}
                          </div>

                          {/* Product Images Carousel */}
                          {project.productImages &&
                            project.productImages.length > 0 && (
                              <ProductImageCarousel
                                images={project.productImages}
                                projectName={project.name}
                              />
                            )}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  );
                })}
              </div>
            );
          })}

          {/* Footer */}
          {/* <div className="absolute bottom-2 right-4 text-[10px] text-muted-foreground">
            v1.0 • NS Ecosystem Map
          </div> */}
        </div>
      </div>
    </div>
  );
};
