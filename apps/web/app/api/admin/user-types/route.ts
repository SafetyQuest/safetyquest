import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET all user types
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userTypes = await prisma.userType.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(userTypes);
  } catch (error) {
    console.error('Error fetching user types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user types' },
      { status: 500 }
    );
  }
}