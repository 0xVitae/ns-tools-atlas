import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EcosystemProject, CategoryType } from '@/types/ecosystem';
import { CATEGORIES } from '@/data/ecosystemData';
import { ZoomIn, ZoomOut, Move, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FreeCanvasProps {
  projects: EcosystemProject[];
}

// Canvas layout - position boxes like the reference image
const CANVAS_LAYOUT: Record<CategoryType, { x: number; y: number; width: number; height: number }> = {
  'networks': { x: 30, y: 60, width: 220, height: 180 },
  'coworking': { x: 30, y: 255, width: 220, height: 160 },
  'media-events': { x: 30, y: 430, width: 220, height: 250 },
  'education': { x: 30, y: 695, width: 220, height: 200 },
  'local-vcs': { x: 270, y: 60, width: 280, height: 420 },
  'corporate': { x: 270, y: 495, width: 280, height: 160 },
  'public-entities': { x: 270, y: 670, width: 280, height: 90 },
  'global-vcs': { x: 570, y: 60, width: 250, height: 320 },
  'accelerators': { x: 570, y: 395, width: 250, height: 365 },
};

export const FreeCanvas: React.FC<FreeCanvasProps> = ({ projects }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Group projects by category
  const projectsByCategory = projects.reduce((acc, project) => {
    if (!acc[project.category]) acc[project.category] = [];
    acc[project.category].push(project);
    return acc;
  }, {} as Record<CategoryType, EcosystemProject[]>);

  const getInitials = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  };

  const getProjectColors = (name: string) => {
    const hue = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
    return {
      bg: `hsl(${hue}, 55%, 88%)`,
      text: `hsl(${hue}, 65%, 35%)`,
      border: `hsl(${hue}, 50%, 75%)`,
    };
  };

  // Scatter items within a box organically
  const getItemPosition = (index: number, total: number, boxWidth: number, boxHeight: number) => {
    const cols = Math.ceil(Math.sqrt(total * (boxWidth / boxHeight)));
    const rows = Math.ceil(total / cols);
    const cellW = (boxWidth - 20) / cols;
    const cellH = (boxHeight - 40) / rows;
    
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    // Add some randomness for organic feel
    const jitterX = (Math.sin(index * 3.7) * 0.15) * cellW;
    const jitterY = (Math.cos(index * 2.3) * 0.15) * cellH;
    
    return {
      x: 10 + col * cellW + cellW / 2 + jitterX,
      y: 35 + row * cellH + cellH / 2 + jitterY,
    };
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      }));
    }
  }, [isPanning, startPan]);

  const handleMouseUp = () => setIsPanning(false);

  // Zoom handlers
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.3, Math.min(2, prev.scale * delta)),
    }));
  }, []);

  const zoomIn = () => setTransform(prev => ({ ...prev, scale: Math.min(2, prev.scale * 1.2) }));
  const zoomOut = () => setTransform(prev => ({ ...prev, scale: Math.max(0.3, prev.scale / 1.2) }));
  const resetView = () => setTransform({ x: 0, y: 0, scale: 1 });

  return (
    <div className="relative w-full h-[800px] rounded-xl border-2 border-dashed border-border bg-background overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-3 left-3 z-20 flex gap-2 bg-card/90 backdrop-blur-sm rounded-lg p-1.5 shadow-sm border border-border">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetView}>
          <RotateCcw className="h-4 w-4" />
        </Button>
        <div className="text-xs text-muted-foreground flex items-center px-2 border-l border-border">
          {Math.round(transform.scale * 100)}%
        </div>
      </div>

      {/* Pan hint */}
      <div className="absolute top-3 right-3 z-20 text-xs text-muted-foreground bg-card/80 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
        <Move className="h-3 w-3" />
        Drag to pan • Scroll to zoom
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="relative origin-top-left transition-transform duration-75"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            width: 860,
            height: 800,
          }}
        >
          {/* Category Boxes */}
          {CATEGORIES.map(category => {
            const layout = CANVAS_LAYOUT[category.id];
            const categoryProjects = projectsByCategory[category.id] || [];

            return (
              <div
                key={category.id}
                className="absolute rounded-lg border border-border/60 bg-card/50 backdrop-blur-[2px] shadow-sm"
                style={{
                  left: layout.x,
                  top: layout.y,
                  width: layout.width,
                  height: layout.height,
                }}
              >
                {/* Category Label */}
                <div
                  className="absolute -top-0 left-0 px-2.5 py-1 text-xs font-semibold rounded-tl-lg rounded-br-lg"
                  style={{ backgroundColor: category.color, color: 'white' }}
                >
                  {category.name}
                </div>

                {/* Scattered Items */}
                {categoryProjects.map((project, index) => {
                  const pos = getItemPosition(index, categoryProjects.length, layout.width, layout.height);
                  const colors = getProjectColors(project.name);
                  const isHovered = hoveredItem === project.id;
                  const itemSize = Math.min(60, Math.max(40, layout.width / 5));

                  return (
                    <div
                      key={project.id}
                      className="absolute flex flex-col items-center transition-all duration-150"
                      style={{
                        left: pos.x,
                        top: pos.y,
                        transform: `translate(-50%, -50%) ${isHovered ? 'scale(1.15)' : 'scale(1)'}`,
                        zIndex: isHovered ? 10 : 1,
                      }}
                      onMouseEnter={() => setHoveredItem(project.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      {/* Logo placeholder */}
                      <div
                        className="rounded-lg flex items-center justify-center font-bold shadow-sm transition-shadow cursor-pointer"
                        style={{
                          width: itemSize,
                          height: itemSize * 0.7,
                          backgroundColor: colors.bg,
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                          fontSize: itemSize * 0.25,
                          boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.15)' : undefined,
                        }}
                      >
                        {getInitials(project.name)}
                      </div>
                      {/* Name label */}
                      <div
                        className="mt-0.5 text-center leading-tight max-w-[70px] truncate"
                        style={{
                          fontSize: Math.max(8, itemSize * 0.16),
                          color: isHovered ? colors.text : '#666',
                          fontWeight: isHovered ? 600 : 400,
                        }}
                      >
                        {project.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Title */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-2xl font-bold text-foreground whitespace-nowrap">
            Mapping of the NS Startup Ecosystem
          </div>

          {/* Footer */}
          <div className="absolute bottom-2 right-4 text-[10px] text-muted-foreground">
            v1.0 • NS Ecosystem Map
          </div>
        </div>
      </div>
    </div>
  );
};
