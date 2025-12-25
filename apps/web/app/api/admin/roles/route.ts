import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// ============================================
// ROLES API - 3-TABLE PERMISSION SYSTEM
// ============================================
// File: apps/web/app/api/admin/roles/route.ts

// GET all roles with their permissions
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Transform to frontend-friendly format
    const rolesWithPermissions = roles.map(role => ({
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      isSystem: role.isSystem,
      userCount: role._count.users,
      permissions: role.rolePermissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        resource: rp.permission.resource,
        action: rp.permission.action,
        description: rp.permission.description
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt
    }));

    return NextResponse.json(rolesWithPermissions);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

// POST create new role with permissions
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, slug: providedSlug, description, permissionIds } = await req.json();
    
    if (!name) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      );
    }

    if (!permissionIds || !Array.isArray(permissionIds) || permissionIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one permission is required' },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    const slug = providedSlug || name.toLowerCase().replace(/\s+/g, '-');

    // Check if role exists
    const existing = await prisma.role.findFirst({
      where: {
        OR: [
          { name },
          { slug }
        ]
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A role with this name or slug already exists' },
        { status: 400 }
      );
    }

    // Verify all permission IDs exist
    const permissions = await prisma.permission.findMany({
      where: { id: { in: permissionIds } }
    });

    if (permissions.length !== permissionIds.length) {
      return NextResponse.json(
        { error: 'One or more invalid permission IDs' },
        { status: 400 }
      );
    }

    // Create role with permissions
    const role = await prisma.role.create({
      data: {
        name,
        slug,
        description,
        isSystem: false, // Custom roles are never system roles
        rolePermissions: {
          create: permissionIds.map((permId: string) => ({
            permissionId: permId
          }))
        }
      },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: { users: true }
        }
      }
    });

    return NextResponse.json({
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      isSystem: role.isSystem,
      userCount: role._count.users,
      permissions: role.rolePermissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        resource: rp.permission.resource,
        action: rp.permission.action,
        description: rp.permission.description
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    );
  }
}