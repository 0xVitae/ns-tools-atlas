import React, { useState } from "react";
import { FullCanvas } from "@/components/ecosystem/FullCanvas";
import { MobileProjectList } from "@/components/ecosystem/MobileProjectList";
import { EcosystemProject } from "@/types/ecosystem";
import { useProjects, useSubmitProject } from "@/hooks/useProjects";
import { useIsMobile } from "@/hooks/useIsMobile";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, LayoutGrid, List } from "lucide-react";

const Index = () => {
  const { data: projects = [], isLoading, error } = useProjects();
  const submitMutation = useSubmitProject();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const isMobile = useIsMobile();
  // Default to list view on mobile, canvas on desktop
  const [viewMode, setViewMode] = useState<"canvas" | "list">(() =>
    typeof window !== "undefined" && window.innerWidth < 768 ? "list" : "canvas"
  );

  const handleAddProject = async (newProject: Omit<EcosystemProject, "id">) => {
    const result = await submitMutation.mutateAsync(newProject);
    if (result.success) {
      setShowSuccessDialog(true);
    } else {
      toast.error(result.error || "Submission failed");
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

  // Determine which view to show - simply respect viewMode
  const showListView = viewMode === "list";

  return (
    <>
      {showListView ? (
        <MobileProjectList
          projects={projects}
          onAddProject={handleAddProject}
          isSubmitting={submitMutation.isPending}
          showViewToggle={!isMobile}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      ) : (
        <FullCanvas
          projects={projects}
          onAddProject={handleAddProject}
          isSubmitting={submitMutation.isPending}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      )}

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center sm:text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-xl">Project Submitted!</DialogTitle>
            <DialogDescription className="text-center pt-2">
              <p>
                Your project is pending verification.{" "}
                <a
                  href="https://discord.com/users/410668042981343232"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:underline font-semibold"
                >
                  Click here
                </a>{" "}
                to ping{" "}
                <span className="text-foreground font-semibold">@byornoste</span> on
                Discord.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button onClick={() => setShowSuccessDialog(false)}>Got it!</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Index;
