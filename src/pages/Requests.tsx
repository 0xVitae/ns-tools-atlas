import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getCategoryName } from "@/data/ecosystemData";
import { useProjectRequests, useSubmitRequest, useUpvoteRequest } from "@/hooks/useProjects";
import { ArrowLeft, ChevronUp, Lightbulb, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const UPVOTE_STORAGE_KEY = "ns-atlas-upvoted-requests";
const VOTER_ID_KEY = "ns-atlas-voter-id";

function getVoterId(): string {
  let id = localStorage.getItem(VOTER_ID_KEY);
  if (!id) {
    id = `v-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(VOTER_ID_KEY, id);
  }
  return id;
}

function getUpvotedIds(): string[] {
  try {
    const stored = localStorage.getItem(UPVOTE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setUpvotedIds(ids: string[]) {
  localStorage.setItem(UPVOTE_STORAGE_KEY, JSON.stringify(ids));
}

const Requests: React.FC = () => {
  const navigate = useNavigate();
  const { data: baseRequests = [], isLoading } = useProjectRequests();
  const submitMutation = useSubmitRequest();
  const upvoteMutation = useUpvoteRequest();
  const [upvotedIds, setUpvotedIdsState] = useState<string[]>(getUpvotedIds);
  const [localUpvoteDeltas, setLocalUpvoteDeltas] = useState<Record<string, number>>({});
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSubmittedBy, setFormSubmittedBy] = useState("");

  const toggleUpvote = (requestId: string) => {
    const alreadyUpvoted = upvotedIds.includes(requestId);
    const newUpvotedIds = alreadyUpvoted
      ? upvotedIds.filter((id) => id !== requestId)
      : [...upvotedIds, requestId];

    setUpvotedIdsState(newUpvotedIds);
    setUpvotedIds(newUpvotedIds);

    setLocalUpvoteDeltas((prev) => ({
      ...prev,
      [requestId]: (prev[requestId] || 0) + (alreadyUpvoted ? -1 : 1),
    }));

    upvoteMutation.mutate({ id: requestId, voterId: getVoterId() });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDescription.trim()) return;

    const result = await submitMutation.mutateAsync({
      name: formName.trim(),
      description: formDescription.trim(),
      submittedBy: formSubmittedBy.trim() || undefined,
    });

    if (result.success) {
      setShowForm(false);
      setFormName("");
      setFormDescription("");
      setFormSubmittedBy("");
      toast.success("Request submitted!");
    } else {
      toast.error(result.error || "Failed to submit");
    }
  };

  const sortedRequests = useMemo(() => {
    const withDeltas = baseRequests.map((r) => ({
      ...r,
      upvotes: r.upvotes + (localUpvoteDeltas[r.id] || 0),
    }));
    return withDeltas.sort((a, b) => b.upvotes - a.upvotes);
  }, [baseRequests, localUpvoteDeltas]);

  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-100 shrink-0">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full shrink-0"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <h1 className="text-lg font-bold text-gray-900">Project Requests</h1>
            </div>
          </div>
          <Button
            size="sm"
            className="h-9 px-3 rounded-full gap-1.5"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-4 w-4" />
            Submit Idea
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
          <p className="text-sm text-muted-foreground mb-4">
            Community ideas for projects or resources that should exist in Nova Scotia. Upvote the ones you want to see built!
          </p>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : sortedRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No project requests yet.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 gap-1.5"
                onClick={() => setShowForm(true)}
              >
                <Plus className="h-4 w-4" />
                Be the first to submit one
              </Button>
            </div>
          ) : (
            sortedRequests.map((request) => {
              const isUpvoted = upvotedIds.includes(request.id);
              return (
                <div
                  key={request.id}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white border border-gray-100"
                  style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                >
                  <button
                    onClick={() => toggleUpvote(request.id)}
                    className={`shrink-0 flex flex-col items-center justify-center w-12 h-14 rounded-lg border transition-colors ${
                      isUpvoted
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600"
                    }`}
                  >
                    <ChevronUp className={`w-4 h-4 ${isUpvoted ? "text-primary" : ""}`} />
                    <span className={`text-sm font-semibold ${isUpvoted ? "text-primary" : "text-gray-600"}`}>
                      {request.upvotes}
                    </span>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {request.emoji && <span className="text-base">{request.emoji}</span>}
                      <h3 className="font-semibold text-[15px] text-gray-900">{request.name}</h3>
                    </div>
                    <p className="text-[13px] text-gray-500 leading-relaxed">{request.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] text-gray-400">Submitted by {request.submittedBy}</span>
                      {request.category && (
                        <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-200">
                          {getCategoryName(request.category)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Submit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit a Project Idea</DialogTitle>
            <DialogDescription>
              What project or resource should exist in Nova Scotia?
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Project Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. NS Founder Matching"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Describe the project idea and why it's needed..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Your Discord
              </label>
              <Input
                placeholder="Anonymous if left blank"
                value={formSubmittedBy}
                onChange={(e) => setFormSubmittedBy(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitMutation.isPending || !formName.trim() || !formDescription.trim()}
              >
                {submitMutation.isPending ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Requests;
