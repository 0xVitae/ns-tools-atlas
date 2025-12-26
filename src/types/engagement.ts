export interface AppMetrics {
  tasksCreated?: number;
  activeUsers?: number;
  totalSessions?: number;
  weeklyGrowth?: number; // percentage
}

export interface AppEngagement {
  id: string;
  name: string;
  category: string;
  icon?: string; // emoji or image URL
  color: string;
  metrics: AppMetrics;
  engagementScore: number; // 0-100, determines arc length
}

export interface CategoryEngagement {
  id: string;
  name: string;
  color: string;
  apps: AppEngagement[];
  totalEngagement: number;
}

export interface EngagementData {
  categories: CategoryEngagement[];
  totalMetrics: {
    totalTasks: number;
    totalUsers: number;
    totalApps: number;
  };
  lastUpdated: string;
}
