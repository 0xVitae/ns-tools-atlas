import { EngagementData, AppEngagement, CategoryEngagement } from "@/types/engagement";
import { EcosystemProject, Category } from "@/types/ecosystem";
import { getCategoryColor, getCategoryName } from "./ecosystemData";

/**
 * Simple seeded random number generator for consistent mock data
 */
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  return () => {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return hash / 0x7fffffff;
  };
}

/**
 * Generate a lighter shade of a color for app variants
 */
function lightenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Generate mock engagement data from real projects
 * Uses seeded random for consistent results between renders
 */
export function generateEngagementData(
  projects: EcosystemProject[],
  categories: Category[]
): EngagementData {
  // Group projects by category
  const projectsByCategory = new Map<string, EcosystemProject[]>();
  projects.forEach(project => {
    const existing = projectsByCategory.get(project.category) || [];
    existing.push(project);
    projectsByCategory.set(project.category, existing);
  });

  // Build category engagement data
  const categoryEngagements: CategoryEngagement[] = [];
  let totalTasks = 0;
  let totalUsers = 0;

  categories.forEach((category, catIndex) => {
    const categoryProjects = projectsByCategory.get(category.id) || [];
    if (categoryProjects.length === 0) return; // Skip empty categories

    const apps: AppEngagement[] = categoryProjects.map((project, projIndex) => {
      const random = seededRandom(project.id);

      const tasksCreated = Math.floor(random() * 7450 + 50);
      const activeUsers = Math.floor(random() * 240 + 10);
      const monthlyGrowth = Math.round((random() * 21.5 + 1) * 10) / 10;
      const engagementScore = Math.floor(random() * 50 + 45);

      totalTasks += tasksCreated;
      totalUsers += activeUsers;

      return {
        id: project.id,
        name: project.name,
        category: category.id,
        icon: project.emoji || project.name.charAt(0).toUpperCase(),
        color: lightenColor(category.color, projIndex * 30),
        metrics: {
          tasksCreated,
          activeUsers,
          monthlyGrowth,
        },
        engagementScore,
      };
    });

    // Calculate average engagement for the category
    const avgEngagement = Math.round(
      apps.reduce((sum, app) => sum + app.engagementScore, 0) / apps.length
    );

    categoryEngagements.push({
      id: category.id,
      name: category.name,
      color: category.color,
      apps,
      totalEngagement: avgEngagement,
    });
  });

  return {
    categories: categoryEngagements,
    totalMetrics: {
      totalTasks,
      totalUsers,
      totalApps: projects.length,
    },
    lastUpdated: new Date().toISOString().split('T')[0],
  };
}

// Keep legacy mock data for fallback/testing
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
            tasksCreated: 6225,
            activeUsers: 117,
            monthlyGrowth: 7.6,
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
            tasksCreated: 4160,
            activeUsers: 95,
            monthlyGrowth: 4.3,
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
            tasksCreated: 2075,
            activeUsers: 49,
            monthlyGrowth: 6.2,
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
            tasksCreated: 1600,
            activeUsers: 78,
            monthlyGrowth: 11.1,
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
            tasksCreated: 925,
            activeUsers: 44,
            monthlyGrowth: 2.9,
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
            tasksCreated: 2800,
            activeUsers: 156,
            monthlyGrowth: 9.2,
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
            tasksCreated: 1050,
            activeUsers: 73,
            monthlyGrowth: 4.6,
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
            tasksCreated: 445,
            activeUsers: 28,
            monthlyGrowth: 15.8,
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
            tasksCreated: 600,
            activeUsers: 212,
            monthlyGrowth: 22.6,
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
            tasksCreated: 390,
            activeUsers: 117,
            monthlyGrowth: 6.4,
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
            tasksCreated: 225,
            activeUsers: 34,
            monthlyGrowth: 14.2,
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
            tasksCreated: 160,
            activeUsers: 45,
            monthlyGrowth: 7.8,
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
            tasksCreated: 490,
            activeUsers: 23,
            monthlyGrowth: 17.1,
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
            tasksCreated: 280,
            activeUsers: 16,
            monthlyGrowth: 9.9,
          },
          engagementScore: 68,
        },
      ],
    },
  ],
  totalMetrics: {
    totalTasks: 21425,
    totalUsers: 1084,
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
