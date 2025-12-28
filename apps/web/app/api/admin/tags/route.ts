// apps/web/app/api/admin/tags/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { checkPermission } from '@safetyquest/shared/rbac/api-helpers';
import { authOptions } from '@/auth';

const prisma = new PrismaClient();

// GET all tags with usage counts
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  const authCheck = checkPermission(session, 'settings', 'view');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            courses: true,
            lessons: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

// POST new tag
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  const authCheck = checkPermission(session, 'settings', 'create');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, slug: providedSlug } = await req.json();
    
    if (!name) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    const slug = providedSlug || name.toLowerCase().replace(/\s+/g, '-');

    // Check if tag exists
    const existing = await prisma.tag.findFirst({
      where: {
        OR: [
          { name },
          { slug }
        ]
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A tag with this name or slug already exists' },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        slug
      },
      include: {
        _count: {
          select: {
            courses: true,
            lessons: true
          }
        }
      }
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    );
  }
}