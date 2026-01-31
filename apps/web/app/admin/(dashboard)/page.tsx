'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Target,
  BookOpen,
  FileText,
  Trophy,
  Award,
  AlertCircle,
  Zap,
  Flame,
  Clock,
} from 'lucide-react';

// Tier colors for badge display - UPDATED TO USE CSS VARIABLES
const tierColors = {
  bronze: 'bg-[var(--warning-light)]',
  silver: 'bg-[var(--text-muted)]',
  gold: 'bg-[var(--warning)]',
  platinum: 'bg-[var(--highlight)]',
};

const tierEmojis = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
};

const DashboardCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'yellow';
}) => {
  // UPDATED: Use CSS variables for brand compliance
  const colorMap = {
    blue: 'bg-[var(--primary-surface)] text-[var(--primary)]',
    green: 'bg-[var(--success-light)] text-[var(--success-dark)]',
    purple: 'bg-[var(--highlight-light)] text-[var(--highlight-dark)]',
    orange: 'bg-[var(--warning-light)] text-[var(--warning-dark)]',
    yellow: 'bg-[var(--alert-light)] text-[var(--alert-dark)]',
  };

  return (
    <div className="bg-[var(--background)] rounded-lg shadow-sm border border-[var(--border)] p-6 hover:shadow-md transition-shadow duration-[--transition-base] hover:scale-[1.01]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--text-secondary)]">{title}</p>
          <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">{value}</p>
          {subtitle && <p className="text-sm text-[var(--text-muted)] mt-2">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colorMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

interface TopLearner {
  id: string;
  name: string;
  level: number;
  xp: number;
  streak: number;
  totalBadges: number;
  badgesByTier: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
  badgeXp: number;
}

const TopLearnerItem = ({ rank, learner }: { rank: number; learner: TopLearner }) => (
  <div className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0">
    <div className="flex items-center gap-3 flex-1">
      {/* Rank Badge - UPDATED WITH BRAND COLORS */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
        rank === 1 ? 'bg-[var(--warning-light)] text-[var(--warning-dark)]' :
        rank === 2 ? 'bg-[var(--text-muted)] text-[var(--text-primary)]' :
        rank === 3 ? 'bg-[var(--danger-light)] text-[var(--danger-dark)]' :
        'bg-[var(--surface)] text-[var(--text-secondary)]'
      }`}>
        {rank}
      </div>
      
      {/* User Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{learner.name}</p>
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span>Level {learner.level}</span>
          {learner.streak > 0 && (
            <span className="flex items-center gap-0.5 text-[var(--warning-dark)]">
              <Flame className="w-3 h-3" />
              {learner.streak}d
            </span>
          )}
        </div>
      </div>
    </div>
    
    {/* Stats */}
    <div className="flex items-center gap-4">
      {/* Badge Count with Tier Breakdown */}
      <div className="flex items-center gap-1" title={`${learner.badgesByTier.bronze}🥉 ${learner.badgesByTier.silver}🥈 ${learner.badgesByTier.gold}🥇 ${learner.badgesByTier.platinum}💎`}>
        <Award className="w-4 h-4 text-[var(--highlight-dark)]" />
        <span className="text-sm font-medium text-[var(--text-primary)]">{learner.totalBadges}</span>
        {/* Mini tier indicators - UPDATED WITH BRAND COLORS */}
        <div className="flex gap-0.5 ml-1">
          {learner.badgesByTier.platinum > 0 && (
            <div className="w-2 h-2 rounded-full bg-[var(--highlight)]" title={`${learner.badgesByTier.platinum} Platinum`} />
          )}
          {learner.badgesByTier.gold > 0 && (
            <div className="w-2 h-2 rounded-full bg-[var(--warning)]" title={`${learner.badgesByTier.gold} Gold`} />
          )}
          {learner.badgesByTier.silver > 0 && (
            <div className="w-2 h-2 rounded-full bg-[var(--text-muted)]" title={`${learner.badgesByTier.silver} Silver`} />
          )}
          {learner.badgesByTier.bronze > 0 && (
            <div className="w-2 h-2 rounded-full bg-[var(--warning-light)]" title={`${learner.badgesByTier.bronze} Bronze`} />
          )}
        </div>
      </div>
      
      {/* XP */}
      <div className="text-right min-w-[80px]">
        <p className="text-sm font-medium text-[var(--text-primary)]">{learner.xp.toLocaleString()} XP</p>
        {learner.badgeXp > 0 && (
          <p className="text-xs text-[var(--highlight-dark)]">+{learner.badgeXp} from badges</p>
        )}
      </div>
    </div>
  </div>
);

interface RecentBadgeAward {
  id: string;
  awardedAt: string;
  user: { id: string; name: string };
  badge: { name: string; tier: string; icon: string; xpBonus: number };
}

const RecentBadgeItem = ({ award }: { award: RecentBadgeAward }) => {
  const tierColor = tierColors[award.badge.tier as keyof typeof tierColors] || 'bg-[var(--text-muted)]';
  const tierEmoji = tierEmojis[award.badge.tier as keyof typeof tierEmojis] || '🏆';
  
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full ${tierColor} flex items-center justify-center`}>
          <Award className="w-4 h-4 text-[var(--text-inverse)]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">{award.user.name}</p>
          <p className="text-xs text-[var(--text-muted)]">
            {award.badge.name} {tierEmoji}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs font-medium text-[var(--highlight-dark)]">+{award.badge.xpBonus} XP</p>
        <p className="text-xs text-[var(--text-muted)]">
          {new Date(award.awardedAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/admin/dashboard');
      if (!res.ok) throw new Error('Failed to load dashboard data');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 bg-[var(--surface)] min-h-screen">
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-[var(--surface-hover)] rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-[var(--background)] rounded-lg h-32 shadow-sm border border-[var(--border)]"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 bg-[var(--surface)] min-h-screen flex items-center justify-center">
        <div className="bg-[var(--background)] rounded-lg shadow-sm border border-[var(--danger-light)] p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-[var(--danger-dark)] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Failed to load dashboard</h3>
          <button
            onClick={() => refetch()}
            className="mt-4 px-6 py-2 bg-[var(--primary)] text-[var(--text-inverse)] rounded-md hover:bg-[var(--primary-dark)] transition-colors duration-[--transition-base]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { overview, userEngagement, recentActivity } = data;

  return (
    <div className="p-8 bg-[var(--surface)] min-h-screen">
      {/* Header - UPDATED WITH BRAND COLORS */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Dashboard</h1>
        <p className="text-[var(--text-secondary)] mt-1">Welcome back! Here's your platform overview.</p>
      </div>

      {/* Main Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Total Users"
          value={overview.totalUsers.toLocaleString()}
          subtitle={`${overview.activeUsersLast30Days} active (30d)`}
          icon={Users}
          color="blue"
        />
        <DashboardCard
          title="Programs"
          value={overview.totalPrograms}
          subtitle={`${overview.activePrograms} active`}
          icon={Target}
          color="green"
        />
        <DashboardCard
          title="Courses"
          value={overview.totalCourses}
          subtitle={`${overview.totalLessons} lessons`}
          icon={BookOpen}
          color="purple"
        />
        <DashboardCard
          title="Badges Awarded"
          value={overview.totalBadgesAwarded?.toLocaleString() || 0}
          subtitle={`${overview.totalBadges} badges available`}
          icon={Award}
          color="yellow"
        />
      </div>

      {/* Content Stats + Top Learners + Recent Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-start">
        {/* Content Library - UPDATED WITH BRAND COLORS */}
        <div className="bg-[var(--background)] rounded-lg shadow-sm border border-[var(--border)] p-6">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[var(--highlight-dark)]" />
            Content Library
          </h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Programs</span>
              <span className="font-bold text-[var(--text-primary)]">{overview.totalPrograms}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Courses</span>
              <span className="font-bold text-[var(--text-primary)]">{overview.totalCourses}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Lessons</span>
              <span className="font-bold text-[var(--text-primary)]">{overview.totalLessons}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Quizzes</span>
              <span className="font-bold text-[var(--text-primary)]">{overview.totalQuizzes}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-3">
              <span className="text-[var(--text-secondary)]">User Types</span>
              <span className="font-bold text-[var(--text-primary)]">{overview.totalUserTypes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Tags</span>
              <span className="font-bold text-[var(--text-primary)]">{overview.totalTags}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Badges</span>
              <span className="font-bold text-[var(--text-primary)]">{overview.totalBadges}</span>
            </div>
          </div>
        </div>

        {/* Top Learners - Enhanced - UPDATED WITH BRAND COLORS */}
        <div className="bg-[var(--background)] rounded-lg shadow-sm border border-[var(--border)] p-6 lg:col-span-2">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[var(--warning-dark)]" />
            Top Learners
            <span className="text-sm font-normal text-[var(--text-muted)] ml-auto">
              Badges • XP
            </span>
          </h3>
          <div className="space-y-1">
            {userEngagement.topLearners.slice(0, 8).map((learner: TopLearner, idx: number) => (
              <TopLearnerItem
                key={learner.id}
                rank={idx + 1}
                learner={learner}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Recent Badge Awards + Overdue Refreshers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Badge Awards - UPDATED WITH BRAND COLORS */}
        {recentActivity?.recentBadgeAwards?.length > 0 && (
          <div className="bg-[var(--background)] rounded-lg shadow-sm border border-[var(--border)] p-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-[var(--highlight-dark)]" />
              Recent Badge Awards
              <span className="text-xs font-normal text-[var(--text-muted)] ml-auto bg-[var(--highlight-light)] px-2 py-1 rounded-full">
                Last 7 days
              </span>
            </h3>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {recentActivity.recentBadgeAwards.map((award: RecentBadgeAward) => (
                <RecentBadgeItem key={award.id} award={award} />
              ))}
            </div>
          </div>
        )}

        {/* Overdue Refreshers Alert - UPDATED WITH BRAND COLORS */}
        {recentActivity?.overdueRefreshers?.length > 0 && (
          <div className="bg-[var(--background)] rounded-lg shadow-sm border border-[var(--danger-light)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[var(--danger)]" />
                Overdue Refreshers
              </h3>
              <span className="bg-[var(--danger-light)] text-[var(--danger-dark)] text-xs font-bold px-3 py-1 rounded-full">
                {recentActivity.overdueRefreshers.length} overdue
              </span>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentActivity.overdueRefreshers.slice(0, 8).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{item.user.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{item.program.title}</p>
                  </div>
                  <span className="text-sm font-medium text-[var(--danger-dark)]">
                    {item.daysOverdue} {item.daysOverdue === 1 ? 'day' : 'days'} overdue
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}