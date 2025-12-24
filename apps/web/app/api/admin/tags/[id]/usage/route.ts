import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { authOptions } from '../../../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET tag usage - courses and lessons using this tag
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
        courses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                description: true,
                slug: true
              }
            }
          }
        },
        lessons: {
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                description: true,
                slug: true
              }
            }
          }
        }
      }
    });

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    return NextResponse.json({
      courses: tag.courses.map(ct => ct.course),
      lessons: tag.lessons.map(lt => lt.lesson)
    });
  } catch (error) {
    console.error('Error fetching tag usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tag usage' },
      { status: 500 }
    );
  }
}