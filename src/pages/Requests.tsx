import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getCategoryName } from "@/data/ecosystemData";
import {
  useProjectRequests,
  useSubmitRequest,
  useUpvoteRequest,
} from "@/hooks/useProjects";
import { ChevronUp, Lightbulb, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { data: baseRequests = [], isLoading } = useProjectRequests();
  const submitMutation = useSubmitRequest();
  const upvoteMutation = useUpvoteRequest();
  const [upvotedIds, setUpvotedIdsState] = useState<string[]>(getUpvotedIds);
  const [localUpvoteDeltas, setLocalUpvoteDeltas] = useState<
    Record<string, number>
  >({});
  const [showForm, setShowForm] = useState(false);

  // Open form if navigated with ?new query param
  useEffect(() => {
    if (searchParams.has("new")) {
      setShowForm(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");

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
      submittedBy: user?.nsUsername || undefined,
    });

    if (result.success) {
      setShowForm(false);
      setFormName("");
      setFormDescription("");
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
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Header — matching Index top bar */}
      <div className="border-b-2 border-foreground/20 shrink-0">
        <div className="bg-background/90 border-b border-foreground/10 px-4 py-1.5">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <div className="flex items-center gap-3">
              <img
                src="/favicon.png"
                alt="NS Tools Atlas"
                width="20"
                height="20"
                className="rounded"
              />
              <span className="text-sm font-bold tracking-wide text-foreground">
                NS TOOLS
              </span>
              <div className="h-4 w-px bg-foreground/20" />
              <div className="flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10px] text-muted-foreground font-mono tracking-wider uppercase">
                  REQUESTS
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-foreground/10 bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Submit Idea
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <p className="text-xs text-muted-foreground mb-6 font-mono tracking-wide uppercase">
            Community ideas for tools that should exist. Upvote what you want
            built.
          </p>

          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-3" />
              <p className="text-xs text-muted-foreground font-mono tracking-wide">
                LOADING...
              </p>
            </div>
          ) : sortedRequests.length === 0 ? (
            <div className="text-center py-16">
              <Lightbulb className="w-8 h-8 text-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">
                No project requests yet.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="text-xs text-primary hover:underline"
              >
                Be the first to submit one
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedRequests.map((request) => {
                const isUpvoted = upvotedIds.includes(request.id);
                return (
                  <div
                    key={request.id}
                    className="flex items-start gap-3 border-2 border-foreground/10 rounded-lg bg-background px-4 py-3"
                  >
                    {/* Upvote button */}
                    <button
                      onClick={() => toggleUpvote(request.id)}
                      className={`shrink-0 flex flex-col items-center justify-center w-10 h-12 rounded border-2 transition-colors ${
                        isUpvoted
                          ? "border-foreground/30 bg-foreground/5 text-foreground"
                          : "border-foreground/10 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                      }`}
                    >
                      <ChevronUp
                        className={`w-4 h-4 ${isUpvoted ? "text-foreground" : ""}`}
                      />
                      <span
                        className={`text-xs font-bold font-mono ${isUpvoted ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {request.upvotes}
                      </span>
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {request.emoji && (
                          <span className="text-base">{request.emoji}</span>
                        )}
                        <h3 className="font-semibold text-sm text-foreground">
                          {request.name}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                        {request.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-muted-foreground/60 font-mono">
                          {request.submittedBy}
                        </span>
                        {request.category && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded border border-foreground/10 text-muted-foreground">
                            {getCategoryName(request.category)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Submit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold tracking-wide">
              SUBMIT A PROJECT IDEA
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              What tool or resource should exist in Network School?
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold tracking-[0.15em] text-muted-foreground uppercase">
                PROJECT NAME
              </label>
              <Input
                placeholder="e.g. NS Founder Matching"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold tracking-[0.15em] text-muted-foreground uppercase">
                DESCRIPTION
              </label>
              <Textarea
                placeholder="Describe the project idea and why it's needed..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
                className="text-sm resize-none"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={
                  submitMutation.isPending ||
                  !formName.trim() ||
                  !formDescription.trim()
                }
              >
                {submitMutation.isPending ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Footer activePage="requests" />
    </div>
  );
};

export default Requests;
