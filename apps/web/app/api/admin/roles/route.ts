import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// Define available roles and their permissions
const DEFAULT_ROLES = [
  {
    id: 'admin',
    name: 'ADMIN',
    slug: 'admin',
    description: 'Full system access with all permissions',
    isSystem: true,
    permissions: {
      users: { view: true, create: true, edit: true, delete: true, bulkActions: true },
      programs: { view: true, create: true, edit: true, delete: true },
      courses: { view: true, create: true, edit: true, delete: true },
      lessons: { view: true, create: true, edit: true, delete: true },
      quizzes: { view: true, create: true, edit: true, delete: true },
      media: { view: true, upload: true, delete: true },
      badges: { view: true, create: true, edit: true, delete: true },
      settings: {
        userTypes: { view: true, create: true, edit: true, delete: true },
        roles: { view: true, create: true, edit: true, delete: true },
        tags: { view: true, create: true, edit: true, delete: true }
      },
      reports: { view: true, export: true }
    }
  },
  {
    id: 'instructor',
    name: 'INSTRUCTOR',
    slug: 'instructor',
    description: 'Can create and manage content but not users or settings',
    isSystem: true,
    permissions: {
      users: { view: true, create: false, edit: false, delete: false, bulkActions: false },
      programs: { view: true, create: true, edit: true, delete: false },
      courses: { view: true, create: true, edit: true, delete: false },
      lessons: { view: true, create: true, edit: true, delete: false },
      quizzes: { view: true, create: true, edit: true, delete: false },
      media: { view: true, upload: true, delete: false },
      badges: { view: true, create: true, edit: true, delete: false },
      settings: {
        userTypes: { view: false, create: false, edit: false, delete: false },
        roles: { view: false, create: false, edit: false, delete: false },
        tags: { view: true, create: true, edit: true, delete: false }
      },
      reports: { view: true, export: false }
    }
  },
  {
    id: 'learner',
    name: 'LEARNER',
    slug: 'learner',
    description: 'Can only access assigned learning content',
    isSystem: true,
    permissions: {
      users: { view: false, create: false, edit: false, delete: false, bulkActions: false },
      programs: { view: true, create: false, edit: false, delete: false },
      courses: { view: true, create: false, edit: false, delete: false },
      lessons: { view: true, create: false, edit: false, delete: false },
      quizzes: { view: true, create: false, edit: false, delete: false },
      media: { view: false, upload: false, delete: false },
      badges: { view: true, create: false, edit: false, delete: false },
      settings: {
        userTypes: { view: false, create: false, edit: false, delete: false },
        roles: { view: false, create: false, edit: false, delete: false },
        tags: { view: false, create: false, edit: false, delete: false }
      },
      reports: { view: false, export: false }
    }
  }
];

// GET all roles
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // For now, return default roles with user counts
    const rolesWithCounts = await Promise.all(
      DEFAULT_ROLES.map(async (role) => {
        const userCount = await prisma.user.count({
          where: { role: role.name }
        });

        return {
          ...role,
          userCount
        };
      })
    );

    return NextResponse.json(rolesWithCounts);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

// POST new role
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, slug, description, permissions } = await req.json();

    return NextResponse.json(
      { 
        error: 'Custom roles require database migration. Please use User Types for now or contact system administrator.',
        migration_required: true
      },
      { status: 501 } // Not Implemented
    );

    // TODO: After migration, implement:
    // const role = await prisma.role.create({
    //   data: { name, slug, description, permissions: JSON.stringify(permissions) }
    // });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    );
  }
}