import React from "react";
import { useGraveyardProjects } from "@/hooks/useProjects";
import { getCategoryName, getCategoryColor } from "@/data/ecosystemData";
import { Skull, ExternalLink, BookOpen } from "lucide-react";
import { Footer } from "@/components/Footer";

const Graveyard: React.FC = () => {
  const { data: projects = [], isLoading } = useGraveyardProjects();

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
                <Skull className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-mono tracking-wider uppercase">
                  GRAVEYARD
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-foreground/10 bg-background/50">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Archived
              </span>
              <span className="text-xs font-semibold text-foreground font-mono">
                {projects.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <p className="text-xs text-muted-foreground mb-6 font-mono tracking-wide uppercase">
            Tools that have shut down. We remember them here.
          </p>

          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-3" />
              <p className="text-xs text-muted-foreground font-mono tracking-wide">
                LOADING...
              </p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16">
              <Skull className="w-8 h-8 text-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No projects in the graveyard yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => {
                const catColor = getCategoryColor(project.category);
                const hex = catColor.replace("#", "");
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);

                return (
                  <div
                    key={project.id}
                    className="border-2 border-foreground/10 rounded-lg bg-background overflow-hidden"
                  >
                    {/* Card header */}
                    <div className="px-4 py-3 flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center font-bold shrink-0 overflow-hidden opacity-60"
                        style={{
                          color: catColor,
                          fontSize: project.emoji ? 22 : 12,
                        }}
                      >
                        {project.imageUrl ? (
                          <img
                            src={project.imageUrl}
                            alt={project.name}
                            className="w-full h-full object-contain grayscale opacity-70"
                          />
                        ) : (
                          project.emoji ||
                          project.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-foreground/70 line-through decoration-foreground/20">
                            {project.name}
                          </h3>
                          {project.tags?.includes("nsOfficial") && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-foreground/10 text-foreground/50 text-[9px] font-medium">
                              <svg
                                width="10"
                                height="7"
                                viewBox="0 0 30 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M9.04883 0C14.4015 1.58136e-05 18.0466 0.857342 21.4111 0.857422C24.5739 0.857419 26.8592 0.730968 29.0273 0.478516C29.2469 0.453142 29.4413 0.621298 29.4414 0.838867V19.2832C29.4411 19.4516 29.323 19.5976 29.1543 19.626C27.6623 19.8749 24.1475 20 21.4111 20C18.4798 19.9999 14.1466 19.1426 9.55859 19.1426C5.14747 19.1426 2.72034 19.3956 0.432617 19.7822C0.207077 19.8203 0.000341557 19.6499 0 19.4248V1.0332C3.69636e-05 0.851129 0.136849 0.697243 0.320312 0.673828C2.56107 0.389876 5.35291 0 9.04883 0ZM13.4951 8.76074C11.9493 8.65328 10.6111 8.66895 9.43164 8.66895V11.1475C10.2548 11.1475 11.7426 11.1495 13.4922 11.2998C13.4903 13.3072 13.492 15.0743 13.5088 15.4326C14.1458 15.5754 14.5286 15.5754 15.791 15.8018V11.5508C17.549 11.7554 18.8433 11.8613 20.1377 11.8613V9.29004C18.7357 9.29004 17.6985 9.187 15.791 8.98242V4.79199C15.7758 4.78999 14.1434 4.57627 13.5088 4.57617C13.5086 4.61678 13.5007 6.53989 13.4951 8.76074Z"
                                  fill="currentColor"
                                />
                              </svg>
                              Official
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                            style={{
                              backgroundColor: `rgba(${r}, ${g}, ${b}, 0.08)`,
                              color: `rgba(${r}, ${g}, ${b}, 0.5)`,
                            }}
                          >
                            {getCategoryName(project.category)}
                          </span>
                          {project.tags?.includes("free") && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600/50 font-medium">
                              Free
                            </span>
                          )}
                          {project.tags?.includes("paid") && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600/50 font-medium">
                              Paid
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Description + post mortem */}
                    {(project.description || project.postMortem) && (
                      <div className="px-4 pb-3 space-y-2">
                        {project.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {project.description}
                          </p>
                        )}
                        {project.postMortem && (
                          <div className="border-l-2 border-foreground/10 pl-3 py-1">
                            <p className="text-[11px] text-muted-foreground/70 italic">
                              {project.postMortem}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Links + profiles */}
                    {(project.url ||
                      project.guideUrl ||
                      (project.nsProfileUrls &&
                        project.nsProfileUrls.length > 0)) && (
                      <div className="px-4 pb-3 flex flex-wrap items-center gap-2">
                        {project.url && (
                          <a
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] text-primary/60 hover:text-primary transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Website
                          </a>
                        )}
                        {project.guideUrl && (
                          <a
                            href={project.guideUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] text-primary/60 hover:text-primary transition-colors"
                          >
                            <BookOpen className="w-3 h-3" />
                            Guide
                          </a>
                        )}
                        {project.nsProfileUrls?.map((profileUrl, idx) => {
                          const username =
                            profileUrl.split("/").pop() || profileUrl;
                          return (
                            <a
                              key={idx}
                              href={profileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-primary/50 hover:text-primary transition-colors"
                            >
                              @{username}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer activePage="graveyard" />
    </div>
  );
};

export default Graveyard;
