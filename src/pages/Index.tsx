import React, { useState, useCallback } from 'react';
import { SubmissionForm } from '@/components/ecosystem/SubmissionForm';
import { EcosystemProject, CategoryType } from '@/types/ecosystem';
import { INITIAL_PROJECTS, CATEGORIES, CATEGORY_COLORS } from '@/data/ecosystemData';
import { MapPin, Grid3X3, Layers } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const Index = () => {
  const [projects, setProjects] = useState<EcosystemProject[]>(INITIAL_PROJECTS);
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  const handleAddProject = useCallback((newProject: Omit<EcosystemProject, 'id'>) => {
    const project: EcosystemProject = {
      ...newProject,
      id: `custom-${Date.now()}`,
    };
    setProjects(prev => [...prev, project]);
  }, []);

  // Group projects by category
  const projectsByCategory = projects.reduce((acc, project) => {
    if (!acc[project.category]) {
      acc[project.category] = [];
    }
    acc[project.category].push(project);
    return acc;
  }, {} as Record<CategoryType, EcosystemProject[]>);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const getProjectColors = (name: string) => {
    const hue = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
    return {
      bgColor: `hsl(${hue}, 60%, 92%)`,
      textColor: `hsl(${hue}, 70%, 35%)`,
    };
  };

  // Determine grid layout based on category importance
  const getCategoryGridClass = (categoryId: CategoryType) => {
    switch (categoryId) {
      case 'local-vcs':
      case 'global-vcs':
        return 'md:col-span-1 md:row-span-2';
      case 'accelerators':
        return 'md:col-span-1 md:row-span-2';
      default:
        return '';
    }
  };

  const getCategoryHeight = (categoryId: CategoryType) => {
    switch (categoryId) {
      case 'local-vcs':
      case 'global-vcs':
      case 'accelerators':
        return 'min-h-[280px]';
      default:
        return 'min-h-[160px]';
    }
  };

  const getMaxItems = (categoryId: CategoryType) => {
    switch (categoryId) {
      case 'local-vcs':
      case 'global-vcs':
      case 'accelerators':
        return 7;
      default:
        return 4;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                NS Ecosystem
              </h1>
              <p className="text-sm text-muted-foreground">
                Mapping the Nova Scotia Startup Ecosystem
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* Bento Grid Section */}
          <section className="order-2 lg:order-1">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Ecosystem Map</h2>
                <p className="text-sm text-muted-foreground">
                  {projects.length} organizations across 9 categories
                </p>
              </div>
            </div>

            {/* Bento Box Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {CATEGORIES.map(category => {
                const categoryProjects = projectsByCategory[category.id] || [];
                const maxItems = getMaxItems(category.id);
                
                return (
                  <div 
                    key={category.id}
                    className={`bg-card rounded-lg border border-border shadow-sm overflow-hidden transition-shadow hover:shadow-md ${getCategoryGridClass(category.id)} ${getCategoryHeight(category.id)}`}
                  >
                    {/* Category Header */}
                    <div 
                      className="px-3 py-2 text-sm font-semibold text-primary-foreground flex items-center justify-between"
                      style={{ backgroundColor: category.color }}
                    >
                      <span>{category.name}</span>
                      <span className="text-xs opacity-80 font-normal">
                        {categoryProjects.length}
                      </span>
                    </div>
                    
                    {/* Projects List */}
                    <div className="p-2 space-y-1">
                      {categoryProjects.slice(0, maxItems).map(project => {
                        const { bgColor, textColor } = getProjectColors(project.name);
                        const initials = getInitials(project.name);
                        const isHovered = hoveredProject === project.id;
                        
                        return (
                          <Tooltip key={project.id}>
                            <TooltipTrigger asChild>
                              <div 
                                className={`flex items-center gap-2 p-1.5 rounded transition-all cursor-pointer ${
                                  isHovered 
                                    ? 'bg-primary/10 ring-1 ring-primary/30' 
                                    : 'bg-muted/50 hover:bg-muted'
                                }`}
                                onMouseEnter={() => setHoveredProject(project.id)}
                                onMouseLeave={() => setHoveredProject(null)}
                              >
                                {/* Initials Avatar */}
                                <div 
                                  className="w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold shrink-0 transition-transform hover:scale-105"
                                  style={{ backgroundColor: bgColor, color: textColor }}
                                >
                                  {initials}
                                </div>
                                {/* Name */}
                                <span className={`text-xs truncate transition-colors ${
                                  isHovered ? 'text-primary font-medium' : 'text-foreground'
                                }`}>
                                  {project.name}
                                </span>
                              </div>
                            </TooltipTrigger>
                            {project.description && (
                              <TooltipContent side="top" className="max-w-[200px]">
                                <p className="text-xs">{project.description}</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        );
                      })}
                      {categoryProjects.length > maxItems && (
                        <div className="text-[10px] text-muted-foreground px-1.5 py-1">
                          +{categoryProjects.length - maxItems} more
                        </div>
                      )}
                      {categoryProjects.length === 0 && (
                        <div className="text-[10px] text-muted-foreground px-1.5 py-4 text-center italic">
                          No projects yet
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Footer Credit */}
            <div className="mt-6 text-center text-xs text-muted-foreground">
              Interactive ecosystem visualization • Click on any project for details
            </div>
          </section>

          {/* Sidebar Form */}
          <aside className="order-1 lg:order-2">
            <div className="sticky top-24">
              <SubmissionForm onSubmit={handleAddProject} />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Index;
