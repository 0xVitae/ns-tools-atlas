import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { EcosystemProject, Category, ProjectTag } from "@/types/ecosystem";
import {
  buildCategoriesFromProjects,
  getCategoryColor,
  getCategoryName,
  generateProjectSlug,
} from "@/data/ecosystemData";
import ActionSearchBar, {
  Action,
  ActionSearchBarRef,
} from "@/components/kokonutui/action-search-bar";
import { measureCellDimensions } from "@/lib/textMeasure";

interface CanvasProps {
  projects: EcosystemProject[];
  onSelectProject?: (project: EcosystemProject | null) => void;
  /** When set, only these project IDs are highlighted; the rest are greyed out */
  highlightedIds?: Set<string> | null;
  /** Externally selected project ID — Canvas will highlight and pan to it */
  selectedProjectId?: string | null;
}

// Layout constants
const PADDING = 40;
const GAP = 24;
const TITLE_HEIGHT = 90;
const MIN_BOX_WIDTH = 180;
const MIN_BOX_HEIGHT = 140;
const ITEMS_PER_ROW_BASE = 3;

// Calculate box dimensions based on actual project names (measured via pretext)
const calculateBoxSize = (projectNames: string[]) => {
  const count = Math.max(1, projectNames.length);
  const cols = Math.min(count, ITEMS_PER_ROW_BASE);
  const rows = Math.ceil(count / ITEMS_PER_ROW_BASE);

  const { cellWidth, cellHeight } = measureCellDimensions(projectNames);
  const width = Math.max(MIN_BOX_WIDTH, cols * cellWidth + 40);
  const height = Math.max(MIN_BOX_HEIGHT, rows * cellHeight + 50);

  return { width, height, cellWidth, cellHeight };
};

// Simple column-based layout algorithm
const calculateLayout = (
  categories: Category[],
  projectsByCategory: Record<string, EcosystemProject[]>,
) => {
  const layout: Record<
    string,
    { x: number; y: number; width: number; height: number }
  > = {};

  // Only include categories that have at least one project
  const allCategoryIds = new Set(
    Object.keys(projectsByCategory).filter(
      (categoryId) => projectsByCategory[categoryId]?.length > 0,
    ),
  );

  // Calculate sizes for each category using actual project names
  const categoryData = Array.from(allCategoryIds).map((id) => {
    const names = (projectsByCategory[id] || []).map((p) => p.name);
    const size = calculateBoxSize(names);
    return { id, ...size, count: names.length };
  });

  // Sort by height (tallest first) for better packing
  categoryData.sort((a, b) => b.height - a.height);

  // Use 3 columns with dynamic widths
  const numColumns = 3;
  const columnMaxWidths = [0, 0, 0];
  const columnY = [TITLE_HEIGHT, TITLE_HEIGHT, TITLE_HEIGHT];
  const columnAssignments: Array<{
    id: string;
    width: number;
    height: number;
    col: number;
  }> = [];

  // First pass: assign boxes to columns and track max widths
  categoryData.forEach(({ id, width, height }) => {
    // Find column with least height
    let minCol = 0;
    for (let i = 1; i < numColumns; i++) {
      if (columnY[i] < columnY[minCol]) {
        minCol = i;
      }
    }

    // Track max width for this column
    columnMaxWidths[minCol] = Math.max(columnMaxWidths[minCol], width);
    columnAssignments.push({ id, width, height, col: minCol });

    // Update column height
    columnY[minCol] += height + GAP;
  });

  // Calculate column X positions based on actual max widths
  const columnX = [
    PADDING,
    PADDING + columnMaxWidths[0] + GAP,
    PADDING + columnMaxWidths[0] + columnMaxWidths[1] + GAP * 2,
  ];

  // Reset column Y for second pass
  const columnY2 = [TITLE_HEIGHT, TITLE_HEIGHT, TITLE_HEIGHT];

  // Second pass: assign final positions using actual widths
  columnAssignments.forEach(({ id, width, height, col }) => {
    layout[id] = {
      x: columnX[col],
      y: columnY2[col],
      width: width,
      height: height,
    };
    columnY2[col] += height + GAP;
  });

  // Calculate total canvas dimensions
  const maxHeight = Math.max(...columnY) + PADDING;
  const totalWidth =
    columnX[numColumns - 1] + columnMaxWidths[numColumns - 1] + PADDING;

  return { layout, canvasWidth: totalWidth, canvasHeight: maxHeight };
};

export const Canvas: React.FC<CanvasProps> = ({
  projects,
  onSelectProject,
  highlightedIds,
  selectedProjectId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const searchBarRef = useRef<ActionSearchBarRef>(null);

  // Use refs for transform to avoid re-renders during pan/zoom
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const isPanningRef = useRef(false);
  const startPanRef = useRef({ x: 0, y: 0 });
  const rafIdRef = useRef<number | null>(null);

  // Touch-related refs for mobile support
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const lastPinchDistRef = useRef<number | null>(null);
  const lastPinchCenterRef = useRef<{ x: number; y: number } | null>(null);
  const isTouchPanningRef = useRef(false);

  // Only use state for UI that needs re-renders
  const [displayScale, setDisplayScale] = useState(100);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [activeTagFilters, setActiveTagFilters] = useState<ProjectTag[]>([]);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch device on mount
  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice(
        "ontouchstart" in window ||
          navigator.maxTouchPoints > 0 ||
          window.matchMedia("(pointer: coarse)").matches,
      );
    };
    checkTouchDevice();
  }, []);

  // Build dynamic categories from projects data
  const categories = useMemo(() => {
    return buildCategoriesFromProjects(projects);
  }, [projects]);

  // Filter projects based on active tag filters (OR logic)
  const filteredProjects = useMemo(() => {
    if (activeTagFilters.length === 0) return projects;
    return projects.filter((project) =>
      project.tags?.some((tag) => activeTagFilters.includes(tag)),
    );
  }, [projects, activeTagFilters]);

  // Group filtered projects by category (normalize to lowercase for case-insensitive matching)
  const projectsByCategory = useMemo(() => {
    return filteredProjects.reduce(
      (acc, project) => {
        const key = project.category?.toLowerCase() || project.category;
        if (!acc[key]) acc[key] = [];
        acc[key].push(project);
        return acc;
      },
      {} as Record<string, EcosystemProject[]>,
    );
  }, [filteredProjects]);

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
        // Use 50% zoom on mobile/touch devices for better overview
        const isMobile =
          window.innerWidth < 768 ||
          "ontouchstart" in window ||
          navigator.maxTouchPoints > 0;
        const scale = isMobile ? 0.5 : 0.85;
        const x = (window.innerWidth - canvasWidth * scale) / 2;
        const y = (window.innerHeight - canvasHeight * scale) / 2;
        transformRef.current = { x, y, scale };
        setDisplayScale(Math.round(scale * 100));
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

  // Toggle a tag filter on/off
  const toggleTagFilter = (tag: ProjectTag) => {
    setActiveTagFilters((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
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

  // Physics-based repulsion layout: items repel each other but stay inside the box
  const calculateCategoryPositions = (
    categoryProjects: EcosystemProject[],
    boxWidth: number,
    boxHeight: number,
    _baseSize: number,
  ): Record<string, { x: number; y: number }> => {
    if (categoryProjects.length === 0) return {};

    const padding = 15;
    const topPadding = 35;
    // Use pretext-measured cell dimensions for accurate spacing
    const { cellWidth, cellHeight } = measureCellDimensions(
      categoryProjects.map((p) => p.name),
    );
    const itemHalfW = cellWidth / 2;
    const itemHalfH = cellHeight / 2;

    const minX = padding + itemHalfW;
    const maxX = boxWidth - padding - itemHalfW;
    const minY = topPadding + itemHalfH;
    const maxY = boxHeight - padding - itemHalfH;

    const count = categoryProjects.length;

    // Single item: just center it
    if (count === 1) {
      return {
        [categoryProjects[0].id]: {
          x: boxWidth / 2,
          y: (topPadding + boxHeight) / 2,
        },
      };
    }

    // Initialize positions deterministically spread across usable area
    const points: { x: number; y: number }[] = categoryProjects.map((p, i) => {
      const seed = hashString(p.id);
      return {
        x: minX + seededRandom(seed) * Math.max(1, maxX - minX),
        y: minY + seededRandom(seed + 1) * Math.max(1, maxY - minY),
      };
    });

    // Desired minimum distance between centers (based on measured cell footprint)
    const restDist = cellWidth;

    // Run simulation
    const iterations = 150;
    let damping = 0.3;

    for (let iter = 0; iter < iterations; iter++) {
      const forces = points.map(() => ({ fx: 0, fy: 0 }));

      // Pairwise repulsion
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          let dx = points[i].x - points[j].x;
          let dy = points[i].y - points[j].y;
          let dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 0.1) {
            // Nudge apart if exactly overlapping
            dx = (seededRandom(i * 100 + j) - 0.5) * 2;
            dy = (seededRandom(j * 100 + i) - 0.5) * 2;
            dist = Math.sqrt(dx * dx + dy * dy);
          }

          if (dist < restDist) {
            const overlap = restDist - dist;
            const force = overlap * 0.5;
            const nx = dx / dist;
            const ny = dy / dist;

            forces[i].fx += nx * force;
            forces[i].fy += ny * force;
            forces[j].fx -= nx * force;
            forces[j].fy -= ny * force;
          }
        }
      }

      // Gentle pull toward center to keep group compact
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      for (let i = 0; i < count; i++) {
        forces[i].fx += (cx - points[i].x) * 0.02;
        forces[i].fy += (cy - points[i].y) * 0.02;
      }

      // Apply forces and clamp to bounds
      for (let i = 0; i < count; i++) {
        points[i].x += forces[i].fx * damping;
        points[i].y += forces[i].fy * damping;
        points[i].x = Math.max(minX, Math.min(maxX, points[i].x));
        points[i].y = Math.max(minY, Math.min(maxY, points[i].y));
      }

      damping *= 0.995;
    }

    const positions: Record<string, { x: number; y: number }> = {};
    categoryProjects.forEach((project, i) => {
      positions[project.id] = { x: points[i].x, y: points[i].y };
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
      const baseSize = Math.min(90, Math.max(65, boxLayout.width / 4));
      allPositions[categoryId] = calculateCategoryPositions(
        categoryProjects,
        boxLayout.width,
        boxLayout.height,
        baseSize,
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

      // Set the selected item to highlight it and grey out others, and update URL hash
      const slug = generateProjectSlug(project.name);
      history.replaceState(null, "", `#${slug}`);
      setSelectedItem(project.id);
      setHoveredItem(project.id);
    },
    [projects, dynamicLayout, categoryPositions, applyTransform],
  );

  // Clear selection when clicking on canvas background
  const clearSelection = useCallback(() => {
    setSelectedItem(null);
    // Clear the URL hash
    history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
  }, []);

  // Select a project and update the URL hash
  const selectProject = useCallback(
    (projectId: string | null) => {
      setSelectedItem(projectId);
      if (projectId) {
        const project = projects.find((p) => p.id === projectId);
        if (project) {
          const slug = generateProjectSlug(project.name);
          history.replaceState(null, "", `#${slug}`);
          onSelectProject?.(project);
        }
      } else {
        history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
        onSelectProject?.(null);
      }
    },
    [projects, onSelectProject],
  );

  // Find project by URL hash slug
  const findProjectBySlug = useCallback(
    (slug: string): EcosystemProject | undefined => {
      return projects.find((p) => generateProjectSlug(p.name) === slug);
    },
    [projects],
  );

  // Handle URL hash on mount and hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove the # prefix
      if (hash) {
        const project = findProjectBySlug(hash);
        if (project) {
          // Find position and pan to project
          const boxLayout = dynamicLayout[project.category];
          const pos = categoryPositions[project.category]?.[project.id];
          if (boxLayout && pos) {
            const projectX = boxLayout.x + pos.x;
            const projectY = boxLayout.y + pos.y;

            const container = containerRef.current;
            if (container) {
              const rect = container.getBoundingClientRect();
              const scale = transformRef.current.scale;

              transformRef.current.x = rect.width / 2 - projectX * scale;
              transformRef.current.y = rect.height / 2 - projectY * scale;
              applyTransform();
            }
          }
          setSelectedItem(project.id);
          setHoveredItem(project.id);
        }
      }
    };

    // Handle initial hash on mount
    handleHashChange();

    // Listen for hash changes (browser back/forward)
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [findProjectBySlug, dynamicLayout, categoryPositions, applyTransform]);

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
    [applyTransform],
  );

  const handleMouseUp = useCallback(() => {
    isPanningRef.current = false;
    if (containerRef.current) {
      containerRef.current.style.cursor = "grab";
    }
  }, []);

  // Touch helper functions for pinch-to-zoom
  const getTouchDistance = (t1: React.Touch, t2: React.Touch) => {
    return Math.sqrt(
      Math.pow(t2.clientX - t1.clientX, 2) +
        Math.pow(t2.clientY - t1.clientY, 2),
    );
  };

  const getTouchCenter = (t1: React.Touch, t2: React.Touch) => {
    return {
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2,
    };
  };

  // Touch handlers for mobile pan/zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - start panning
      const touch = e.touches[0];
      isTouchPanningRef.current = true;
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
      lastPinchDistRef.current = null;
      lastPinchCenterRef.current = null;
    } else if (e.touches.length === 2) {
      // Two fingers - start pinch zoom
      isTouchPanningRef.current = false;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      lastPinchDistRef.current = getTouchDistance(t1, t2);
      lastPinchCenterRef.current = getTouchCenter(t1, t2);
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault(); // Prevent page scroll

      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      if (
        e.touches.length === 1 &&
        isTouchPanningRef.current &&
        lastTouchRef.current
      ) {
        // Single touch pan
        const touch = e.touches[0];
        const deltaX = touch.clientX - lastTouchRef.current.x;
        const deltaY = touch.clientY - lastTouchRef.current.y;

        rafIdRef.current = requestAnimationFrame(() => {
          transformRef.current.x += deltaX;
          transformRef.current.y += deltaY;
          applyTransform();
        });

        lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
      } else if (
        e.touches.length === 2 &&
        lastPinchDistRef.current !== null &&
        lastPinchCenterRef.current !== null
      ) {
        // Two finger pinch zoom
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const newDist = getTouchDistance(t1, t2);
        const newCenter = getTouchCenter(t1, t2);

        const scaleFactor = newDist / lastPinchDistRef.current;
        const newScale = Math.max(
          0.5,
          Math.min(2, transformRef.current.scale * scaleFactor),
        );

        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const centerX = newCenter.x - rect.left;
          const centerY = newCenter.y - rect.top;

          // Calculate pan offset from pinch center movement
          const panDeltaX = newCenter.x - lastPinchCenterRef.current.x;
          const panDeltaY = newCenter.y - lastPinchCenterRef.current.y;

          rafIdRef.current = requestAnimationFrame(() => {
            // Apply zoom around pinch center
            const scaleChange = newScale / transformRef.current.scale;
            transformRef.current.x =
              centerX -
              (centerX - transformRef.current.x) * scaleChange +
              panDeltaX;
            transformRef.current.y =
              centerY -
              (centerY - transformRef.current.y) * scaleChange +
              panDeltaY;
            transformRef.current.scale = newScale;
            applyTransform();
            setDisplayScale(Math.round(newScale * 100));
          });
        }

        lastPinchDistRef.current = newDist;
        lastPinchCenterRef.current = newCenter;
      }
    },
    [applyTransform],
  );

  const handleTouchEnd = useCallback(() => {
    isTouchPanningRef.current = false;
    lastTouchRef.current = null;
    lastPinchDistRef.current = null;
    lastPinchCenterRef.current = null;
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
    // Use 50% zoom on mobile/touch devices
    const isMobile =
      window.innerWidth < 768 ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0;
    const scale = isMobile ? 0.5 : 0.85;
    const x = (window.innerWidth - canvasWidth * scale) / 2;
    const y = (window.innerHeight - canvasHeight * scale) / 2;
    transformRef.current = { x, y, scale };
    applyTransform();
    setDisplayScale(Math.round(scale * 100));
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
          Math.min(2, transformRef.current.scale * delta),
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

  // Sync external selectedProjectId → internal selectedItem and pan to it
  useEffect(() => {
    if (selectedProjectId === undefined) return;
    setSelectedItem(selectedProjectId);
    if (selectedProjectId) {
      const project = projects.find((p) => p.id === selectedProjectId);
      if (project) {
        const boxLayout = dynamicLayout[project.category];
        const pos = categoryPositions[project.category]?.[project.id];
        if (boxLayout && pos) {
          const projectX = boxLayout.x + pos.x;
          const projectY = boxLayout.y + pos.y;
          const container = containerRef.current;
          if (container) {
            const rect = container.getBoundingClientRect();
            const scale = transformRef.current.scale;
            transformRef.current.x = rect.width / 2 - projectX * scale;
            transformRef.current.y = rect.height / 2 - projectY * scale;
            applyTransform();
          }
        }
      }
    }
  }, [selectedProjectId, projects, dynamicLayout, categoryPositions, applyTransform]);

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

      {/* Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab select-none"
        style={{ touchAction: "none" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
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
                  const isGreyedOut =
                    (selectedItem !== null && !isSelected) ||
                    (highlightedIds != null && !highlightedIds.has(project.id));
                  const displaySize = 80; // Fixed size for all cards

                  return (
                    <div
                      key={project.id}
                      className="absolute flex flex-col items-center transition-all duration-150 ease-out select-none cursor-pointer"
                      style={{
                        left: pos.x,
                        top: pos.y,
                        transform: `translate(-50%, -50%) ${
                          isHovered ? "scale(1.12)" : "scale(1)"
                        }`,
                        zIndex: isSelected ? 20 : isHovered ? 10 : 1,
                        opacity: isGreyedOut ? 0.12 : 1,
                        filter: isGreyedOut ? "grayscale(100%)" : "none",
                      }}
                      onMouseEnter={() => setHoveredItem(project.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isSelected) {
                          if (project.url) {
                            window.open(
                              project.url,
                              "_blank",
                              "noopener,noreferrer",
                            );
                          }
                        } else {
                          selectProject(project.id);
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
                          border: project.tags?.includes("nsOfficial")
                            ? `2px solid #000`
                            : `2px solid ${isSelected ? colors.text : colors.border}`,
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
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          project.emoji || getInitials(project.name)
                        )}
                      </div>
                      <div
                        className="mt-1 text-center leading-tight transition-all duration-150 ease-out flex items-center justify-center gap-1"
                        style={{
                          fontSize: Math.max(9, displaySize * 0.18),
                          width: displaySize + 20,
                          color: isSelected
                            ? colors.text
                            : isHovered
                              ? colors.text
                              : "#333",
                          fontWeight: isSelected || isHovered ? 600 : 400,
                        }}
                      >
                        {project.tags?.includes("nsOfficial") && (
                          <svg
                            width="10"
                            height="7"
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
                        <span className="line-clamp-2">{project.name}</span>
                      </div>
                    </div>
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
