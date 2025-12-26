import { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, TrendingUp, Users, Layers, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import RadialEngagementChart from "./RadialEngagementChart";
import { generateEngagementData, getTopApps, MOCK_ENGAGEMENT_DATA } from "@/data/engagementData";
import { AppEngagement, CategoryEngagement } from "@/types/engagement";
import { useProjects } from "@/hooks/useProjects";
import { buildCategoriesFromProjects } from "@/data/ecosystemData";

export default function RadialDataCanvas() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredApp, setHoveredApp] = useState<{
    app: AppEngagement;
    category: CategoryEngagement;
  } | null>(null);

  // Fetch real projects from Google Sheets
  const { data: projects, isLoading, error } = useProjects();

  // Generate engagement data from real projects
  const engagementData = useMemo(() => {
    if (!projects || projects.length === 0) {
      return MOCK_ENGAGEMENT_DATA; // Fallback to mock data
    }
    const categories = buildCategoriesFromProjects(projects);
    return generateEngagementData(projects, categories);
  }, [projects]);

  const topApps = getTopApps(engagementData, 5);

  const handleAppHover = (app: AppEngagement | null, category: CategoryEngagement | null) => {
    if (app && category) {
      setHoveredApp({ app, category });
    } else {
      setHoveredApp(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading ecosystem data...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="fixed inset-0 bg-gradient-to-br from-slate-50 to-white overflow-hidden">
      {/* Top Bar */}
      <div className="absolute top-4 left-4 z-30">
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

      {/* Stats Cards - Top Right */}
      <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl px-4 py-3 shadow-lg border border-foreground/10"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Tasks</p>
              <p className="text-lg font-bold">
                {engagementData.totalMetrics.totalTasks.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl px-4 py-3 shadow-lg border border-foreground/10"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Users</p>
              <p className="text-lg font-bold">
                {engagementData.totalMetrics.totalUsers.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl px-4 py-3 shadow-lg border border-foreground/10"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Layers className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Apps</p>
              <p className="text-lg font-bold">
                {engagementData.totalMetrics.totalApps}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top Apps Leaderboard - Bottom Right */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-4 right-4 z-30 bg-white rounded-xl px-4 py-3 shadow-lg border border-foreground/10 w-64"
      >
        <h3 className="text-xs font-semibold text-muted-foreground mb-2">Top Performing Apps</h3>
        <div className="space-y-2">
          {topApps.map((item, index) => (
            <div key={item.app} className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground w-4">{index + 1}</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{item.app}</p>
                <p className="text-[10px] text-muted-foreground">{item.category}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">{item.score}</p>
                <p className="text-[10px] text-muted-foreground">score</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Legend - Bottom Left */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="absolute bottom-4 left-4 z-30 bg-white rounded-xl px-4 py-3 shadow-lg border border-foreground/10"
      >
        <h3 className="text-xs font-semibold text-muted-foreground mb-2">Categories</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {engagementData.categories.map((category) => (
            <div key={category.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-xs">{category.name}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Hovered App Details */}
      {hoveredApp && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-1/2 left-4 z-40 -translate-y-1/2 bg-white rounded-xl px-5 py-4 shadow-xl border border-foreground/10 w-72"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{hoveredApp.app.icon}</span>
            <div>
              <h3 className="font-bold text-foreground">{hoveredApp.app.name}</h3>
              <p className="text-xs text-muted-foreground">{hoveredApp.category.name}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Tasks Created</p>
              <p className="text-lg font-bold">
                {hoveredApp.app.metrics.tasksCreated?.toLocaleString() || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Users</p>
              <p className="text-lg font-bold">
                {hoveredApp.app.metrics.activeUsers?.toLocaleString() || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Monthly Growth</p>
              <p className="text-lg font-bold text-green-600">
                +{hoveredApp.app.metrics.monthlyGrowth || 0}%
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Engagement Score</span>
              <span className="text-sm font-bold">{hoveredApp.app.engagementScore}/100</span>
            </div>
            <div className="mt-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: hoveredApp.app.color }}
                initial={{ width: 0 }}
                animate={{ width: `${hoveredApp.app.engagementScore}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Page Title - Top Center */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-30"
      >
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Infographic: the NS Tool Ecosystem
        </h1>
      </motion.div>

      {/* Main Chart Area */}
      <div className="absolute inset-0 flex items-center justify-center">
        <RadialEngagementChart
          data={engagementData}
          width={800}
          height={800}
          onAppHover={handleAppHover}
        />
      </div>

      {/* Last Updated */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
        <p className="text-[10px] text-muted-foreground">
          Last updated: {engagementData.lastUpdated}
        </p>
      </div>
    </div>
  );
}
