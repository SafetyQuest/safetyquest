import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { authOptions } from '../../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET tag by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            courses: true,
            lessons: true
          }
        }
      }
    });

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    return NextResponse.json(tag);
  } catch (error) {
    console.error('Error fetching tag:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tag' },
      { status: 500 }
    );
  }
}

// PATCH update tag
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { name, slug } = await req.json();

    // Check if name/slug exists and is different from current
    if (name || slug) {
      const existing = await prisma.tag.findFirst({
        where: { 
          OR: [
            name ? { name, id: { not: id } } : {},
            slug ? { slug, id: { not: id } } : {}
          ]
        }
      });

      if (existing) {
        return NextResponse.json(
          { error: 'A tag with this name or slug already exists' },
          { status: 400 }
        );
      }
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: {
        name,
        slug
      }
    });

    return NextResponse.json(tag);
  } catch (error) {
    console.error('Error updating tag:', error);
    return NextResponse.json(
      { error: 'Failed to update tag' },
      { status: 500 }
    );
  }
}

// DELETE tag
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Check if tag is in use
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            courses: true,
            lessons: true
          }
        }
      }
    });

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    const totalUsage = tag._count.courses + tag._count.lessons;

    if (totalUsage > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete tag. It is used in ${tag._count.courses} course(s) and ${tag._count.lessons} lesson(s).`,
          details: {
            courses: tag._count.courses,
            lessons: tag._count.lessons
          }
        },
        { status: 400 }
      );
    }

    await prisma.tag.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json(
      { error: 'Failed to delete tag' },
      { status: 500 }
    );
  }
}