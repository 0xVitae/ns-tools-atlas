import React, { useState, useRef, useCallback } from 'react';
import { EcosystemProject, CategoryType } from '@/types/ecosystem';
import { CATEGORIES } from '@/data/ecosystemData';
import { ZoomIn, ZoomOut, RotateCcw, Plus, Upload, ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { CATEGORY_COLORS } from '@/data/ecosystemData';

interface FullCanvasProps {
  projects: EcosystemProject[];
  onAddProject: (project: Omit<EcosystemProject, 'id'>) => void;
}

// Canvas layout - position boxes like the reference image
const CANVAS_LAYOUT: Record<CategoryType, { x: number; y: number; width: number; height: number }> = {
  'networks': { x: 40, y: 100, width: 240, height: 200 },
  'coworking': { x: 40, y: 320, width: 240, height: 180 },
  'media-events': { x: 40, y: 520, width: 240, height: 280 },
  'education': { x: 40, y: 820, width: 240, height: 220 },
  'local-vcs': { x: 310, y: 100, width: 300, height: 460 },
  'corporate': { x: 310, y: 580, width: 300, height: 180 },
  'public-entities': { x: 310, y: 780, width: 300, height: 110 },
  'global-vcs': { x: 640, y: 100, width: 280, height: 360 },
  'accelerators': { x: 640, y: 480, width: 280, height: 410 },
};

const CATEGORY_OPTIONS: { value: CategoryType; label: string }[] = [
  { value: 'networks', label: 'Networks' },
  { value: 'coworking', label: 'Coworking' },
  { value: 'media-events', label: 'Media & Events' },
  { value: 'education', label: 'Education' },
  { value: 'local-vcs', label: 'Local VCs' },
  { value: 'global-vcs', label: 'Global VCs' },
  { value: 'accelerators', label: 'Accelerators' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'public-entities', label: 'Public Entities' },
];

export const FullCanvas: React.FC<FullCanvasProps> = ({ projects, onAddProject }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 50, y: 20, scale: 0.85 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<CategoryType | ''>('');
  const [formDescription, setFormDescription] = useState('');
  const [formImage, setFormImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      border: `hsl(${hue}, 50%, 78%)`,
    };
  };

  // Scatter items within a box organically
  const getItemPosition = (index: number, total: number, boxWidth: number, boxHeight: number) => {
    const cols = Math.ceil(Math.sqrt(total * (boxWidth / boxHeight)));
    const rows = Math.ceil(total / cols);
    const cellW = (boxWidth - 24) / cols;
    const cellH = (boxHeight - 50) / rows;
    
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    const jitterX = (Math.sin(index * 3.7) * 0.12) * cellW;
    const jitterY = (Math.cos(index * 2.3) * 0.12) * cellH;
    
    return {
      x: 12 + col * cellW + cellW / 2 + jitterX,
      y: 38 + row * cellH + cellH / 2 + jitterY,
    };
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !isFormOpen) {
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
    if (isFormOpen) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.92 : 1.08;
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.25, Math.min(2.5, prev.scale * delta)),
    }));
  }, [isFormOpen]);

  const zoomIn = () => setTransform(prev => ({ ...prev, scale: Math.min(2.5, prev.scale * 1.2) }));
  const zoomOut = () => setTransform(prev => ({ ...prev, scale: Math.max(0.25, prev.scale / 1.2) }));
  const resetView = () => setTransform({ x: 50, y: 20, scale: 0.85 });

  // Form handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setFormImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!formName.trim()) {
      toast.error('Please enter a project name');
      return;
    }
    if (!formCategory) {
      toast.error('Please select a category');
      return;
    }

    onAddProject({
      name: formName.trim(),
      category: formCategory,
      description: formDescription.trim() || undefined,
      imageUrl: formImage || undefined,
    });

    // Reset form
    setFormName('');
    setFormCategory('');
    setFormDescription('');
    setFormImage(null);
    setIsFormOpen(false);
    toast.success('Added to ecosystem!');
  };

  return (
    <div 
      className="fixed inset-0 bg-[#fafafa] overflow-hidden"
      style={{ 
        backgroundImage: 'radial-gradient(circle, #e5e5e5 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Top Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-card/95 backdrop-blur-sm rounded-xl px-6 py-3 shadow-lg border border-border flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">NS</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground leading-tight">NS Ecosystem</h1>
              <p className="text-[10px] text-muted-foreground">{projects.length} organizations</p>
            </div>
          </div>
          
          <div className="h-6 w-px bg-border" />
          
          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomOut}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs text-muted-foreground w-10 text-center">
              {Math.round(transform.scale * 100)}%
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomIn}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetView}>
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Add Project Button */}
      <div className="absolute bottom-6 right-6 z-30">
        <Popover open={isFormOpen} onOpenChange={setIsFormOpen}>
          <PopoverTrigger asChild>
            <Button 
              size="lg" 
              className="rounded-full shadow-lg h-14 px-6 gap-2 text-base"
            >
              <Plus className="h-5 w-5" />
              Add Project
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            side="top" 
            align="end" 
            className="w-80 p-4"
            sideOffset={12}
          >
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground">Submit a Project</h3>
                <p className="text-xs text-muted-foreground">Add an organization to the ecosystem</p>
              </div>

              {/* Image Upload */}
              <div>
                <Label className="text-xs">Logo (optional)</Label>
                <div 
                  className="mt-1 border border-dashed border-border rounded-lg p-3 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {formImage ? (
                    <div className="relative inline-block">
                      <img src={formImage} alt="Preview" className="w-12 h-12 object-cover rounded" />
                      <button
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center"
                        onClick={(e) => { e.stopPropagation(); setFormImage(null); }}
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Click to upload</span>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>

              {/* Name */}
              <div>
                <Label htmlFor="name" className="text-xs">Name *</Label>
                <Input
                  id="name"
                  placeholder="Organization name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="mt-1 h-9"
                />
              </div>

              {/* Category */}
              <div>
                <Label className="text-xs">Category *</Label>
                <Select value={formCategory} onValueChange={(val) => setFormCategory(val as CategoryType)}>
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[opt.value] }} />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="desc" className="text-xs">Description</Label>
                <Textarea
                  id="desc"
                  placeholder="Brief description..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="mt-1 h-16 resize-none"
                  maxLength={150}
                />
              </div>

              <Button onClick={handleSubmit} className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                Add to Map
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Canvas hint */}
      <div className="absolute bottom-6 left-6 z-20 text-xs text-muted-foreground bg-card/80 backdrop-blur-sm rounded-lg px-3 py-2">
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
            width: 960,
            height: 920,
          }}
        >
          {/* Title on canvas */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <h2 className="text-3xl font-bold text-foreground/80">
              Mapping of the NS Startup Ecosystem
            </h2>
          </div>

          {/* Category Boxes */}
          {CATEGORIES.map(category => {
            const layout = CANVAS_LAYOUT[category.id];
            const categoryProjects = projectsByCategory[category.id] || [];

            return (
              <div
                key={category.id}
                className="absolute rounded-xl bg-card/60 backdrop-blur-[1px] border border-border/50 shadow-sm"
                style={{
                  left: layout.x,
                  top: layout.y,
                  width: layout.width,
                  height: layout.height,
                }}
              >
                {/* Category Label */}
                <div
                  className="absolute top-0 left-0 px-3 py-1.5 text-xs font-semibold rounded-tl-xl rounded-br-xl shadow-sm"
                  style={{ backgroundColor: category.color, color: 'white' }}
                >
                  {category.name}
                </div>

                {/* Scattered Items */}
                {categoryProjects.map((project, index) => {
                  const pos = getItemPosition(index, categoryProjects.length, layout.width, layout.height);
                  const colors = getProjectColors(project.name);
                  const isHovered = hoveredItem === project.id;
                  const baseSize = Math.min(55, Math.max(38, layout.width / 5.5));

                  return (
                    <div
                      key={project.id}
                      className="absolute flex flex-col items-center transition-all duration-150 select-none"
                      style={{
                        left: pos.x,
                        top: pos.y,
                        transform: `translate(-50%, -50%) ${isHovered ? 'scale(1.12)' : 'scale(1)'}`,
                        zIndex: isHovered ? 10 : 1,
                      }}
                      onMouseEnter={() => setHoveredItem(project.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      {/* Logo box */}
                      <div
                        className="rounded-lg flex items-center justify-center font-bold cursor-pointer transition-shadow"
                        style={{
                          width: baseSize,
                          height: baseSize * 0.72,
                          backgroundColor: colors.bg,
                          color: colors.text,
                          border: `1.5px solid ${colors.border}`,
                          fontSize: baseSize * 0.28,
                          boxShadow: isHovered ? '0 6px 16px rgba(0,0,0,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
                        }}
                      >
                        {getInitials(project.name)}
                      </div>
                      {/* Name */}
                      <div
                        className="mt-1 text-center leading-tight truncate"
                        style={{
                          fontSize: Math.max(9, baseSize * 0.18),
                          maxWidth: baseSize + 20,
                          color: isHovered ? colors.text : '#555',
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

          {/* Footer */}
          <div className="absolute bottom-3 right-6 text-[11px] text-muted-foreground/60">
            v1.0 • NS Ecosystem Map
          </div>
        </div>
      </div>
    </div>
  );
};
