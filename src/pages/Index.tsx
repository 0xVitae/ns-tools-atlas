import React, { useState } from "react";
import { FullCanvas } from "@/components/ecosystem/FullCanvas";
import { MobileProjectList } from "@/components/ecosystem/MobileProjectList";
import { useProjects } from "@/hooks/useProjects";
import { useIsMobile } from "@/hooks/useIsMobile";

const Index = () => {
  const { data: projects = [], isLoading, error } = useProjects();
  const isMobile = useIsMobile();
  // Default to list view on mobile, canvas on desktop
  const [viewMode, setViewMode] = useState<"canvas" | "list">(() =>
    typeof window !== "undefined" && window.innerWidth < 768 ? "list" : "canvas"
  );

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

  // Determine which view to show - simply respect viewMode
  const showListView = viewMode === "list";

  return (
    <>
      {showListView ? (
        <MobileProjectList
          projects={projects}
          showViewToggle={!isMobile}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      ) : (
        <FullCanvas
          projects={projects}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      )}
    </>
  );
};

export default Index;
