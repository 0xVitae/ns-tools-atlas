import React from "react";
import { useNavigate } from "react-router-dom";
import { useGraveyardProjects } from "@/hooks/useProjects";
import { getCategoryName, getCategoryColor } from "@/data/ecosystemData";
import { ArrowLeft, Skull, ExternalLink, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import BuiltByFooter from "@/components/BuiltByFooter";

const Graveyard: React.FC = () => {
  const navigate = useNavigate();
  const { data: projects = [], isLoading } = useGraveyardProjects();

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
            <Skull className="h-4 w-4 text-gray-400" />
            <h1 className="text-lg font-bold text-gray-900">
              Startup Graveyard
            </h1>
          </div>
          <Badge variant="outline" className="ml-auto">
            {projects.length} projects
          </Badge>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
          <p className="text-sm text-muted-foreground mb-4">
            Network School startups that have shut down. We remember them here.
          </p>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No projects in the graveyard yet.</p>
            </div>
          ) : (
            projects.map((project) => {
              const catColor = getCategoryColor(project.category);
              return (
                <div
                  key={project.id}
                  className="p-4 rounded-xl bg-white border border-gray-100 space-y-3"
                  style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                >
                  {/* Header: image + name + tags */}
                  <div className="flex items-center gap-3">
                    <div
                      className="rounded-lg flex items-center justify-center font-bold shrink-0 overflow-hidden"
                      style={{
                        width: 48,
                        height: 42,
                        backgroundColor: `${catColor}18`,
                        color: catColor,
                        border: `2px solid ${catColor}30`,
                        fontSize: project.emoji ? 24 : 14,
                      }}
                    >
                      {project.imageUrl ? (
                        <img
                          src={project.imageUrl}
                          alt={project.name}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        project.emoji || project.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 gap-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[15px] text-gray-900">
                          {project.name}
                        </h3>
                        {project.tags?.includes("nsOfficial") && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-foreground text-background text-[10px] font-medium">
                            Official
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          variant="outline"
                          className="text-[10px] text-gray-400 border-gray-200"
                        >
                          {getCategoryName(project.category)}
                        </Badge>
                        {project.tags?.includes("free") && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">
                            Free
                          </span>
                        )}
                        {project.tags?.includes("paid") && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                            Paid
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {project.description && (
                    <p className="text-[13px] text-gray-500 leading-relaxed">
                      {project.description}
                    </p>
                  )}

                  {/* Post mortem */}
                  {project.postMortem && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-[12px] text-gray-600 italic">
                        {project.postMortem}
                      </p>
                    </div>
                  )}

                  {/* Links */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {project.url && (
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[13px] text-blue-500 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Website
                      </a>
                    )}
                    {project.guideUrl && (
                      <a
                        href={project.guideUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[13px] text-blue-500 hover:underline"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Guide
                      </a>
                    )}
                  </div>

                  {/* NS Profile Links */}
                  {project.nsProfileUrls &&
                    project.nsProfileUrls.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {project.nsProfileUrls.map((profileUrl, idx) => {
                          const username =
                            profileUrl.split("/").pop() || profileUrl;
                          return (
                            <a
                              key={idx}
                              href={profileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-50 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                            >
                              <span className="text-blue-500">@{username}</span>
                            </a>
                          );
                        })}
                      </div>
                    )}

                  {/* Product Images */}
                  {project.productImages &&
                    project.productImages.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto">
                        {project.productImages.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`${project.name} screenshot ${idx + 1}`}
                            className="rounded-lg border border-gray-100 object-cover h-32"
                          />
                        ))}
                      </div>
                    )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
      <BuiltByFooter />
    </div>
  );
};

export default Graveyard;
