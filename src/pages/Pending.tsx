import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePendingProjects, useUpdatePendingProject } from "@/hooks/useProjects";
import { BASE_CATEGORIES } from "@/data/ecosystemData";
import { EcosystemProject } from "@/types/ecosystem";
import { ArrowLeft, Check, X, Pencil, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const ADMIN_PW_KEY = "ns-atlas-admin-pw";

const Pending: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState(() => sessionStorage.getItem(ADMIN_PW_KEY) || "");
  const [token, setToken] = useState<string>("");
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");

  // Auto-login via URL token
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      setToken(urlToken);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const { data: pendingProjects = [], isLoading, error } = usePendingProjects({ password, token });
  const updateMutation = useUpdatePendingProject();

  // Edit dialog state
  const [editingProject, setEditingProject] = useState<EcosystemProject | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    description: "",
    url: "",
    guideUrl: "",
    emoji: "",
    imageUrl: "",
    tags: "",
    nsProfileUrls: "",
    productImages: "",
  });

  // Reject confirm dialog
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setPassword(passwordInput);
  };

  // Handle auth error from query
  React.useEffect(() => {
    if (error?.message === "Invalid password") {
      setAuthError("Invalid password");
      setPassword("");
      setToken("");
      sessionStorage.removeItem(ADMIN_PW_KEY);
      setAuthenticated(false);
    } else if ((password || token) && !error && !isLoading) {
      if (password) sessionStorage.setItem(ADMIN_PW_KEY, password);
      setAuthenticated(true);
    }
  }, [error, password, token, isLoading]);

  const openEditDialog = (project: EcosystemProject) => {
    setEditingProject(project);
    setEditForm({
      name: project.name,
      category: project.category,
      description: project.description || "",
      url: project.url || "",
      guideUrl: project.guideUrl || "",
      emoji: project.emoji || "",
      imageUrl: project.imageUrl || "",
      tags: project.tags?.join(", ") || "",
      nsProfileUrls: project.nsProfileUrls?.join("\n") || "",
      productImages: project.productImages?.join("\n") || "",
    });
  };

  const handleApprove = async () => {
    if (!editingProject) return;

    const updates: Record<string, unknown> = {
      name: editForm.name,
      category: editForm.category,
      description: editForm.description || undefined,
      url: editForm.url || undefined,
      guideUrl: editForm.guideUrl || undefined,
      emoji: editForm.emoji || undefined,
      imageUrl: editForm.imageUrl || undefined,
      tags: editForm.tags ? editForm.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
      nsProfileUrls: editForm.nsProfileUrls ? editForm.nsProfileUrls.split("\n").map((u) => u.trim()).filter(Boolean) : undefined,
      productImages: editForm.productImages ? editForm.productImages.split("\n").map((u) => u.trim()).filter(Boolean) : undefined,
    };

    const result = await updateMutation.mutateAsync({
      password: password || undefined,
      token: token || undefined,
      id: editingProject.id,
      action: "approve",
      updates: updates as Partial<EcosystemProject>,
    });

    if (result.success) {
      toast.success(`"${editForm.name}" approved!`);
      setEditingProject(null);
    } else {
      toast.error(result.error || "Failed to approve");
    }
  };

  const handleReject = async () => {
    if (!rejectingId) return;

    const project = pendingProjects.find((p) => p.id === rejectingId);
    const result = await updateMutation.mutateAsync({
      password: password || undefined,
      token: token || undefined,
      id: rejectingId,
      action: "reject",
    });

    if (result.success) {
      toast.success(`"${project?.name}" rejected`);
    } else {
      toast.error(result.error || "Failed to reject");
    }
    setRejectingId(null);
  };

  // Password gate
  if (!authenticated) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm mx-auto px-6 space-y-4"
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <Shield className="h-6 w-6 text-gray-400" />
            <h1 className="text-xl font-bold text-gray-900">Admin Access</h1>
          </div>
          <Input
            type="password"
            placeholder="Enter admin password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            autoFocus
          />
          {authError && (
            <p className="text-sm text-red-500 text-center">{authError}</p>
          )}
          <Button type="submit" className="w-full" disabled={!passwordInput}>
            {isLoading ? "Checking..." : "Enter"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-gray-400"
            onClick={() => navigate("/")}
          >
            Back to Map
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-100 shrink-0">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full shrink-0"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-500" />
            <h1 className="text-lg font-bold text-gray-900">Pending Review</h1>
          </div>
          <Badge variant="outline" className="ml-auto">
            {pendingProjects.length} pending
          </Badge>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : pendingProjects.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No pending projects to review.</p>
            </div>
          ) : (
            pendingProjects.map((project) => (
              <div
                key={project.id}
                className="p-4 rounded-xl bg-white border border-gray-100"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {project.emoji && (
                        <span className="text-base">{project.emoji}</span>
                      )}
                      <h3 className="font-semibold text-[15px] text-gray-900">
                        {project.name}
                      </h3>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] text-gray-400 border-gray-200 mb-2"
                    >
                      {project.category}
                    </Badge>
                    {project.description && (
                      <p className="text-[13px] text-gray-500 leading-relaxed mb-2">
                        {project.description}
                      </p>
                    )}
                    {project.url && (
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] text-blue-500 hover:underline break-all"
                      >
                        {project.url}
                      </a>
                    )}
                    {project.addedAt && (
                      <p className="text-[11px] text-gray-300 mt-2">
                        Submitted {new Date(project.addedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1 text-green-600 border-green-200 hover:bg-green-50"
                      onClick={() => openEditDialog(project)}
                    >
                      <Pencil className="h-3 w-3" />
                      Edit & Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1 text-red-500 border-red-200 hover:bg-red-50"
                      onClick={() => setRejectingId(project.id)}
                    >
                      <X className="h-3 w-3" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Edit & Approve Dialog */}
      <Dialog
        open={!!editingProject}
        onOpenChange={(open) => !open && setEditingProject(null)}
      >
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit & Approve</DialogTitle>
            <DialogDescription>
              Review and edit fields before approving this project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Name</label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Category
              </label>
              <Select
                value={editForm.category}
                onValueChange={(val) =>
                  setEditForm((f) => ({ ...f, category: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BASE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                  {/* Show current value if it's a custom category */}
                  {!BASE_CATEGORIES.find((c) => c.id === editForm.category) &&
                    editForm.category && (
                      <SelectItem value={editForm.category}>
                        {editForm.category} (custom)
                      </SelectItem>
                    )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Description
              </label>
              <Textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">URL</label>
                <Input
                  value={editForm.url}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, url: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Guide URL
                </label>
                <Input
                  value={editForm.guideUrl}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, guideUrl: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Emoji
                </label>
                <Input
                  value={editForm.emoji}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, emoji: e.target.value }))
                  }
                  placeholder="e.g. 🚀"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Image URL
                </label>
                <Input
                  value={editForm.imageUrl}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, imageUrl: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Tags (comma-separated)
              </label>
              <Input
                value={editForm.tags}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, tags: e.target.value }))
                }
                placeholder="e.g. nsOfficial, free"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                NS Profile URLs (one per line)
              </label>
              <Textarea
                value={editForm.nsProfileUrls}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, nsProfileUrls: e.target.value }))
                }
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Product Images (one URL per line)
              </label>
              <Textarea
                value={editForm.productImages}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, productImages: e.target.value }))
                }
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setEditingProject(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApprove}
                disabled={updateMutation.isPending || !editForm.name.trim()}
                className="gap-1"
              >
                <Check className="h-4 w-4" />
                {updateMutation.isPending ? "Approving..." : "Approve"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation */}
      <AlertDialog
        open={!!rejectingId}
        onOpenChange={(open) => !open && setRejectingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the project as rejected. It won't appear on the map
              or in the pending queue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-red-500 hover:bg-red-600"
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Pending;
