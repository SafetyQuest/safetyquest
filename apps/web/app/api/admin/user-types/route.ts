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
      include: {
        _count: {
          select: {
            users: true,
            programs: true
          }
        }
      },
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

// POST new user type
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, slug: providedSlug, description } = await req.json();
    
    if (!name) {
      return NextResponse.json(
        { error: 'User type name is required' },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    const slug = providedSlug || name.toLowerCase().replace(/\s+/g, '-');

    // Check if user type exists
    const existing = await prisma.userType.findFirst({
      where: {
        OR: [
          { name },
          { slug }
        ]
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A user type with this name or slug already exists' },
        { status: 400 }
      );
    }

    const userType = await prisma.userType.create({
      data: {
        name,
        slug,
        description
      }
    });

    return NextResponse.json(userType, { status: 201 });
  } catch (error) {
    console.error('Error creating user type:', error);
    return NextResponse.json(
      { error: 'Failed to create user type' },
      { status: 500 }
    );
  }
}