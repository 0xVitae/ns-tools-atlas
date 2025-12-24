import React, { useState, useCallback } from 'react';
import { FreeCanvas } from '@/components/ecosystem/FreeCanvas';
import { SubmissionForm } from '@/components/ecosystem/SubmissionForm';
import { EcosystemProject } from '@/types/ecosystem';
import { INITIAL_PROJECTS } from '@/data/ecosystemData';
import { MapPin } from 'lucide-react';

const Index = () => {
  const [projects, setProjects] = useState<EcosystemProject[]>(INITIAL_PROJECTS);

  const handleAddProject = useCallback((newProject: Omit<EcosystemProject, 'id'>) => {
    const project: EcosystemProject = {
      ...newProject,
      id: `custom-${Date.now()}`,
    };
    setProjects(prev => [...prev, project]);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <MapPin className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                NS Ecosystem
              </h1>
              <p className="text-xs text-muted-foreground">
                Interactive startup ecosystem map
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
          {/* Canvas Section */}
          <section className="order-2 xl:order-1">
            <FreeCanvas projects={projects} />
          </section>

          {/* Sidebar Form */}
          <aside className="order-1 xl:order-2">
            <div className="xl:sticky xl:top-20">
              <SubmissionForm onSubmit={handleAddProject} />
              
              {/* Stats */}
              <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
                <div className="text-sm font-medium text-foreground mb-2">Ecosystem Stats</div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{projects.length}</div>
                    <div className="text-[10px] text-muted-foreground">Organizations</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">9</div>
                    <div className="text-[10px] text-muted-foreground">Categories</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-accent">NS</div>
                    <div className="text-[10px] text-muted-foreground">Region</div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Index;
