import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import RadialDataCanvas from "@/components/data-viz/RadialDataCanvas";

export default function Data() {
  const navigate = useNavigate();

  return (
    <div className="relative w-full h-full">
      <RadialDataCanvas />
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
        <div className="text-center px-6 py-10 rounded-2xl bg-zinc-900 border border-white/20 shadow-2xl max-w-sm">
          <h2 className="text-3xl font-bold text-white mb-2">Coming Soon</h2>
          <p className="text-white/70 text-sm">
            Data visualizations are currently under construction. Check back soon.
          </p>
          <Button
            className="mt-6 w-full"
            onClick={() => navigate("/")}
          >
            Back to Atlas
          </Button>
          <a
            href="https://github.com/0xVitae/ns-tools-atlas"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            Want to contribute to NS Tools?
          </a>
        </div>
      </div>
      <div className="fixed top-4 left-4 z-50">
        <div className="bg-white rounded-xl px-5 py-3 shadow-lg border border-foreground/10 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate("/")}
            title="Back to Atlas"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <img
              src="/favicon.png"
              alt="NS Tools Atlas"
              width="24"
              height="24"
              className="rounded"
            />
            <div>
              <h1 className="text-sm font-bold text-foreground leading-tight">
                Engagement Data
              </h1>
              <p className="text-[10px] text-muted-foreground">
                NS Ecosystem Activity
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
