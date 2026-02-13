export interface AchievementBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedDate: string | null;
  progress: number;
  target: number;
  earned: boolean;
}
