// apps/web/app/api/admin/roles/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { checkPermission } from '@safetyquest/shared/rbac/api-helpers';
import { authOptions } from '@/auth';

const prisma = new PrismaClient();

// ============================================
// INDIVIDUAL ROLE API - 3-TABLE SYSTEM
// ============================================
// File: apps/web/app/api/admin/roles/[id]/route.ts

// GET role by ID with permissions
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  const authCheck = checkPermission(session, 'settings', 'view');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const role = await prisma.role.findUnique({
      where: { id },
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

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

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
    });
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { error: 'Failed to fetch role' },
      { status: 500 }
    );
  }
}

// PATCH update role
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  const authCheck = checkPermission(session, 'settings', 'edit');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id }
    });

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // System roles cannot be modified
    if (existingRole.isSystem) {
      return NextResponse.json(
        { error: 'System roles cannot be modified. Create a new custom role instead.' },
        { status: 400 }
      );
    }

    const { name, slug, description, permissionIds } = await req.json();

    // Check for duplicate name/slug
    if (name || slug) {
      const duplicate = await prisma.role.findFirst({
        where: { 
          OR: [
            name ? { name, id: { not: id } } : {},
            slug ? { slug, id: { not: id } } : {}
          ]
        }
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'A role with this name or slug already exists' },
          { status: 400 }
        );
      }
    }

    // If updating permissions, verify they exist
    if (permissionIds && Array.isArray(permissionIds)) {
      const permissions = await prisma.permission.findMany({
        where: { id: { in: permissionIds } }
      });

      if (permissions.length !== permissionIds.length) {
        return NextResponse.json(
          { error: 'One or more invalid permission IDs' },
          { status: 400 }
        );
      }

      // Delete existing permissions and create new ones
      await prisma.rolePermission.deleteMany({
        where: { roleId: id }
      });

      await prisma.rolePermission.createMany({
        data: permissionIds.map((permId: string) => ({
          roleId: id,
          permissionId: permId
        }))
      });
    }

    // Update role details
    const updateData: any = {};
    if (name) updateData.name = name;
    if (slug) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;

    const role = await prisma.role.update({
      where: { id },
      data: updateData,
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
    });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  }
}

// DELETE role
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  const authCheck = checkPermission(session, 'settings', 'delete')
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Cannot delete system roles
    if (role.isSystem) {
      return NextResponse.json(
        { error: 'System roles cannot be deleted.' },
        { status: 400 }
      );
    }

    // Cannot delete if users are assigned
    if (role._count.users > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete role. ${role._count.users} user(s) are assigned to this role. Reassign them first.`,
          details: {
            users: role._count.users
          }
        },
        { status: 400 }
      );
    }

    // Cascade delete will remove rolePermissions automatically
    await prisma.role.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    );
  }
}