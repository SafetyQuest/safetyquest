import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../app/api/auth/[...nextauth]/route';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <p className="mt-4">Welcome, {session?.user?.name}!</p>
      <p className="text-gray-600">Role: {session?.user?.role}</p>
    </div>
  );
}