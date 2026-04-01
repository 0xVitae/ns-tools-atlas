import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { submitProject } from "@/lib/api";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "ns_atlas_pending_project";
// Reject stored data older than 1 hour
const MAX_AGE_MS = 60 * 60 * 1000;

type CallbackStatus = "submitting" | "success" | "error";

export default function Callback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<CallbackStatus>("submitting");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const nsStatus = searchParams.get("status");
    const state = searchParams.get("state");

    // NS platform indicated failure
    if (nsStatus && nsStatus !== "success") {
      setStatus("error");
      setErrorMessage(
        searchParams.get("error") || "Registration was not completed on NS platform."
      );
      return;
    }

    // Pull stored form data
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setStatus("error");
      setErrorMessage("No pending project data found. Please try submitting again.");
      return;
    }

    let stored: { state: string; project: any; timestamp: number };
    try {
      stored = JSON.parse(raw);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setStatus("error");
      setErrorMessage("Stored project data is corrupted. Please try again.");
      return;
    }

    // Validate state matches (prevents replays / stale data)
    if (state && stored.state !== state) {
      setStatus("error");
      setErrorMessage("Session mismatch. Please submit your project again.");
      return;
    }

    // Reject stale data
    if (Date.now() - stored.timestamp > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      setStatus("error");
      setErrorMessage("Your session expired. Please submit your project again.");
      return;
    }

    // Submit the project
    (async () => {
      try {
        const result = await submitProject(stored.project);
        localStorage.removeItem(STORAGE_KEY);
        if (result.success) {
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMessage(result.error || "Submission failed. Please try again.");
        }
      } catch {
        setStatus("error");
        setErrorMessage("Network error. Please check your connection and try again.");
      }
    })();
  }, [searchParams]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="text-center max-w-md px-6">
        {status === "submitting" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Finalizing your submission...</h1>
            <p className="text-muted-foreground text-sm">
              Adding your project to the Atlas.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <h1 className="text-xl font-semibold mb-2">Project Submitted!</h1>
            <p className="text-muted-foreground text-sm mb-2">
              Your project is pending verification.
            </p>
            <p className="text-muted-foreground text-sm mb-6">
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
            <Button onClick={() => navigate("/")}>Back to Atlas</Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
            <p className="text-muted-foreground text-sm mb-6">{errorMessage}</p>
            <Button onClick={() => navigate("/")}>Back to Atlas</Button>
          </>
        )}
      </div>
    </div>
  );
}
