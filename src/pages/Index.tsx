import React from 'react';
import { FullCanvas } from '@/components/ecosystem/FullCanvas';
import { EcosystemProject } from '@/types/ecosystem';
import { useProjects, useSubmitProject } from '@/hooks/useProjects';
import { toast } from 'sonner';

const Index = () => {
  const { data: projects = [], isLoading, error } = useProjects();
  const submitMutation = useSubmitProject();

  const handleAddProject = async (newProject: Omit<EcosystemProject, 'id'>) => {
    const result = await submitMutation.mutateAsync(newProject);
    if (result.success) {
      toast.success('Project submitted for review!');
    } else {
      toast.error(result.error || 'Submission failed');
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading ecosystem...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
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

  return (
    <FullCanvas
      projects={projects}
      onAddProject={handleAddProject}
      isSubmitting={submitMutation.isPending}
    />
  );
};

export default Index;
