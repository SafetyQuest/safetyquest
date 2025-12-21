import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { authOptions } from '../../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET user type by ID
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
    const userType = await prisma.userType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            programs: true
          }
        }
      }
    });

    if (!userType) {
      return NextResponse.json({ error: 'User type not found' }, { status: 404 });
    }

    return NextResponse.json(userType);
  } catch (error) {
    console.error('Error fetching user type:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user type' },
      { status: 500 }
    );
  }
}

// PATCH update user type
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
    const { name, slug, description } = await req.json();

    // Check if slug exists and is different from current
    if (slug) {
      const existing = await prisma.userType.findFirst({
        where: { 
          slug,
          id: { not: id }
        }
      });

      if (existing) {
        return NextResponse.json(
          { error: 'A user type with this slug already exists' },
          { status: 400 }
        );
      }
    }

    const userType = await prisma.userType.update({
      where: { id },
      data: {
        name,
        slug,
        description
      }
    });

    return NextResponse.json(userType);
  } catch (error) {
    console.error('Error updating user type:', error);
    return NextResponse.json(
      { error: 'Failed to update user type' },
      { status: 500 }
    );
  }
}

// DELETE user type
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
    // Check if user type is in use
    const userType = await prisma.userType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            programs: true
          }
        }
      }
    });

    if (!userType) {
      return NextResponse.json({ error: 'User type not found' }, { status: 404 });
    }

    if (userType._count.users > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete user type. ${userType._count.users} user(s) are assigned to this type.`,
          details: {
            users: userType._count.users
          }
        },
        { status: 400 }
      );
    }

    if (userType._count.programs > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete user type. ${userType._count.programs} program(s) are assigned to this type.`,
          details: {
            programs: userType._count.programs
          }
        },
        { status: 400 }
      );
    }

    await prisma.userType.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user type:', error);
    return NextResponse.json(
      { error: 'Failed to delete user type' },
      { status: 500 }
    );
  }
}