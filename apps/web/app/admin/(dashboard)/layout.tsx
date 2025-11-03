import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '../../../app/api/auth/[...nextauth]/route';
import Link from 'next/link';
import { SignOutButton } from '@/components/admin/SignOutButton';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (session?.user.role !== 'ADMIN') {
    redirect('/learn');
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-blue-600">SafetyQuest</h2>
          <p className="text-sm text-gray-600">Admin Portal</p>
        </div>

        <nav className="mt-6">
          <Link
            href="/admin"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
          >
            <span className="text-xl mr-3">📊</span>
            Dashboard
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
          >
            <span className="text-xl mr-3">👥</span>
            Users
          </Link>
          <Link
            href="/admin/programs"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
          >
            <span className="text-xl mr-3">📚</span>
            Programs
          </Link>
          <Link
            href="/admin/courses"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
          >
            <span className="text-xl mr-3">📖</span>
            Courses
          </Link>
          <Link
            href="/admin/lessons"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
          >
            <span className="text-xl mr-3">📝</span>
            Lessons
          </Link>
          <Link
            href="/admin/quizzes"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
          >
            <span className="text-xl mr-3">❓</span>
            Quizzes
          </Link>
          <Link
            href="/admin/badges"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
          >
            <span className="text-xl mr-3">🏆</span>
            Badges
          </Link>
        </nav>

        <div className="absolute bottom-0 w-64 p-6 border-t">
          <div className="text-sm text-gray-600">
            <p className="font-medium">{session.user.name}</p>
            <p className="text-xs">{session.user.email}</p>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}