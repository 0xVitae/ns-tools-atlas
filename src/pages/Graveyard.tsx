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
            <h1 className="text-lg font-bold text-gray-900">tool Graveyard</h1>
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
            Network School tools that have shut down. We remember them here.
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
                            <svg
                              width="12"
                              height="8"
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
