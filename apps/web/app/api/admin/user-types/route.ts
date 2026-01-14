// apps/web/app/api/admin/user-types/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { checkPermission } from '@safetyquest/shared/rbac/api-helpers';
import { authOptions } from '@/auth';

const prisma = new PrismaClient();

// GET all user types
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  const authCheck = checkPermission(session, 'settings', 'view');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  try {
    const userTypes = await prisma.userType.findMany({
      include: {
        _count: {
          select: {
            users: true,
            programs: true,
            courses: true
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
  
  const authCheck = checkPermission(session, 'settings', 'create');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
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