import { EngagementData } from "@/types/engagement";

export const MOCK_ENGAGEMENT_DATA: EngagementData = {
  categories: [
    {
      id: "productivity",
      name: "Productivity",
      color: "#3B82F6",
      totalEngagement: 87,
      apps: [
        {
          id: "ns-boost",
          name: "NS Boost",
          category: "productivity",
          icon: "🚀",
          color: "#3B82F6",
          metrics: {
            tasksCreated: 12450,
            activeUsers: 234,
            totalSessions: 5670,
            weeklyGrowth: 15.2,
          },
          engagementScore: 92,
        },
        {
          id: "ns-tasks",
          name: "NS Tasks",
          category: "productivity",
          icon: "✅",
          color: "#60A5FA",
          metrics: {
            tasksCreated: 8320,
            activeUsers: 189,
            totalSessions: 3420,
            weeklyGrowth: 8.5,
          },
          engagementScore: 78,
        },
        {
          id: "ns-notes",
          name: "NS Notes",
          category: "productivity",
          icon: "📝",
          color: "#93C5FD",
          metrics: {
            tasksCreated: 4150,
            activeUsers: 98,
            totalSessions: 2100,
            weeklyGrowth: 12.3,
          },
          engagementScore: 65,
        },
      ],
    },
    {
      id: "networks",
      name: "Networks",
      color: "#A855F7",
      totalEngagement: 72,
      apps: [
        {
          id: "ns-connect",
          name: "NS Connect",
          category: "networks",
          icon: "🤝",
          color: "#A855F7",
          metrics: {
            tasksCreated: 3200,
            activeUsers: 156,
            totalSessions: 4200,
            weeklyGrowth: 22.1,
          },
          engagementScore: 85,
        },
        {
          id: "ns-hub",
          name: "NS Hub",
          category: "networks",
          icon: "🌐",
          color: "#C084FC",
          metrics: {
            tasksCreated: 1850,
            activeUsers: 87,
            totalSessions: 1900,
            weeklyGrowth: 5.8,
          },
          engagementScore: 58,
        },
      ],
    },
    {
      id: "education",
      name: "Education",
      color: "#10B981",
      totalEngagement: 68,
      apps: [
        {
          id: "ns-learn",
          name: "NS Learn",
          category: "education",
          icon: "📚",
          color: "#10B981",
          metrics: {
            tasksCreated: 5600,
            activeUsers: 312,
            totalSessions: 8900,
            weeklyGrowth: 18.4,
          },
          engagementScore: 88,
        },
        {
          id: "ns-courses",
          name: "NS Courses",
          category: "education",
          icon: "🎓",
          color: "#34D399",
          metrics: {
            tasksCreated: 2100,
            activeUsers: 145,
            totalSessions: 3200,
            weeklyGrowth: 9.2,
          },
          engagementScore: 62,
        },
        {
          id: "ns-mentor",
          name: "NS Mentor",
          category: "education",
          icon: "👨‍🏫",
          color: "#6EE7B7",
          metrics: {
            tasksCreated: 890,
            activeUsers: 56,
            totalSessions: 1200,
            weeklyGrowth: 31.5,
          },
          engagementScore: 54,
        },
      ],
    },
    {
      id: "media-events",
      name: "Media & Events",
      color: "#EC4899",
      totalEngagement: 61,
      apps: [
        {
          id: "ns-events",
          name: "NS Events",
          category: "media-events",
          icon: "🎉",
          color: "#EC4899",
          metrics: {
            tasksCreated: 1200,
            activeUsers: 423,
            totalSessions: 6700,
            weeklyGrowth: 45.2,
          },
          engagementScore: 76,
        },
        {
          id: "ns-media",
          name: "NS Media",
          category: "media-events",
          icon: "📺",
          color: "#F472B6",
          metrics: {
            tasksCreated: 780,
            activeUsers: 234,
            totalSessions: 4500,
            weeklyGrowth: 12.8,
          },
          engagementScore: 52,
        },
      ],
    },
    {
      id: "funding",
      name: "Funding",
      color: "#F59E0B",
      totalEngagement: 79,
      apps: [
        {
          id: "ns-invest",
          name: "NS Invest",
          category: "funding",
          icon: "💰",
          color: "#F59E0B",
          metrics: {
            tasksCreated: 450,
            activeUsers: 67,
            totalSessions: 890,
            weeklyGrowth: 28.3,
          },
          engagementScore: 82,
        },
        {
          id: "ns-grants",
          name: "NS Grants",
          category: "funding",
          icon: "🏆",
          color: "#FBBF24",
          metrics: {
            tasksCreated: 320,
            activeUsers: 89,
            totalSessions: 560,
            weeklyGrowth: 15.6,
          },
          engagementScore: 71,
        },
      ],
    },
    {
      id: "accelerators",
      name: "Accelerators",
      color: "#0EA5E9",
      totalEngagement: 74,
      apps: [
        {
          id: "ns-accelerate",
          name: "NS Accelerate",
          category: "accelerators",
          icon: "⚡",
          color: "#0EA5E9",
          metrics: {
            tasksCreated: 980,
            activeUsers: 45,
            totalSessions: 1200,
            weeklyGrowth: 34.2,
          },
          engagementScore: 79,
        },
        {
          id: "ns-launch",
          name: "NS Launch",
          category: "accelerators",
          icon: "🛫",
          color: "#38BDF8",
          metrics: {
            tasksCreated: 560,
            activeUsers: 32,
            totalSessions: 780,
            weeklyGrowth: 19.8,
          },
          engagementScore: 68,
        },
      ],
    },
  ],
  totalMetrics: {
    totalTasks: 42850,
    totalUsers: 2167,
    totalApps: 15,
  },
  lastUpdated: "2025-12-24",
};

// Helper to calculate total engagement across all apps
export const calculateTotalEngagement = (data: EngagementData): number => {
  const allScores = data.categories.flatMap((cat) =>
    cat.apps.map((app) => app.engagementScore)
  );
  return Math.round(
    allScores.reduce((sum, score) => sum + score, 0) / allScores.length
  );
};

// Helper to get top performing apps
export const getTopApps = (
  data: EngagementData,
  limit: number = 5
): { app: string; score: number; category: string }[] => {
  return data.categories
    .flatMap((cat) =>
      cat.apps.map((app) => ({
        app: app.name,
        score: app.engagementScore,
        category: cat.name,
      }))
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};
