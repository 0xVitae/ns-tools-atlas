import React, { useState, useCallback } from 'react';
import { FullCanvas } from '@/components/ecosystem/FullCanvas';
import { EcosystemProject } from '@/types/ecosystem';
import { INITIAL_PROJECTS } from '@/data/ecosystemData';

const Index = () => {
  const [projects, setProjects] = useState<EcosystemProject[]>(INITIAL_PROJECTS);

  const handleAddProject = useCallback((newProject: Omit<EcosystemProject, 'id'>) => {
    const project: EcosystemProject = {
      ...newProject,
      id: `custom-${Date.now()}`,
    };
    setProjects(prev => [...prev, project]);
  }, []);

  return <FullCanvas projects={projects} onAddProject={handleAddProject} />;
};

export default Index;
