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
} from 'lucide-react';

const DashboardCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-2">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colorMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

const TopLearnerItem = ({ rank, name, level, xp, streak }: { rank: number; name: string; level: number; xp: number; streak?: number }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
    <div className="flex items-center gap-3 flex-1">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
        rank === 1 ? 'bg-yellow-100 text-yellow-700' :
        rank === 2 ? 'bg-gray-100 text-gray-700' :
        rank === 3 ? 'bg-orange-100 text-orange-700' :
        'bg-gray-50 text-gray-600'
      }`}>
        {rank}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">{name}</p>
        <p className="text-xs text-gray-500">Level {level}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-sm font-medium text-gray-900">{xp.toLocaleString()} XP</p>
      {streak > 0 && (
        <p className="text-xs text-orange-600">Streak: {streak} days</p>
      )}
    </div>
  </div>
);

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
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg h-32 shadow-sm"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load dashboard</h3>
          <button
            onClick={() => refetch()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { overview, userEngagement, recentActivity } = data;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your platform overview.</p>
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
          title="Quizzes"
          value={overview.totalQuizzes}
          subtitle="Ready for learners"
          icon={FileText}
          color="orange"
        />
      </div>

      {/* Content Stats + Top Learners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-start">
        {/* Content Library */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            Content Library
          </h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">User Types</span>
              <span className="font-bold text-gray-900">{overview.totalUserTypes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tags</span>
              <span className="font-bold text-gray-900">{overview.totalTags}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Badges</span>
              <span className="font-bold text-gray-900">{overview.totalBadges}</span>
            </div>
          </div>
        </div>

        {/* Top Learners */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            Top Learners
          </h3>
          <div className="space-y-1">
            {userEngagement.topLearners.slice(0, 6).map((learner: any, idx: number) => (
              <TopLearnerItem
                key={learner.id}
                rank={idx + 1}
                name={learner.name}
                level={learner.level}
                xp={learner.xp}
                streak={learner.streak}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Overdue Refreshers Alert */}
      {recentActivity?.overdueRefreshers?.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Overdue Refreshers
            </h3>
            <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">
              {recentActivity.overdueRefreshers.length} overdue
            </span>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentActivity.overdueRefreshers.slice(0, 8).map((item: any) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.user.name}</p>
                  <p className="text-xs text-gray-500">{item.program.title}</p>
                </div>
                <span className="text-sm font-medium text-red-600">
                  {item.daysOverdue} {item.daysOverdue === 1 ? 'day' : 'days'} overdue
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}