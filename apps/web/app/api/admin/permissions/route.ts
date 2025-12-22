import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// ============================================
// PERMISSIONS API
// ============================================
// File: apps/web/app/api/admin/permissions/route.ts
// This endpoint returns all available permissions
// Used when creating/editing roles to show permission checkboxes

// GET all permissions (grouped by resource)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' }
      ]
    });

    // Group permissions by resource for easier display
    const grouped = permissions.reduce((acc: any, perm) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = [];
      }
      acc[perm.resource].push({
        id: perm.id,
        name: perm.name,
        action: perm.action,
        description: perm.description
      });
      return acc;
    }, {});

    return NextResponse.json({
      all: permissions,
      grouped: grouped
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}