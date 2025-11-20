import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  
  // Filters
  const search = searchParams.get('search') || '';
  const section = searchParams.get('section') || '';
  const department = searchParams.get('department') || '';
  const designation = searchParams.get('designation') || '';
  const supervisor = searchParams.get('supervisor') || '';
  const manager = searchParams.get('manager') || '';
  const userTypeId = searchParams.get('userTypeId') || '';
  const role = searchParams.get('role') || '';
  const programId = searchParams.get('programId') || '';
  
  // Pagination
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');
  const skip = (page - 1) * pageSize;

  try {
    // Build the where clause - remove empty objects
    const conditions: any[] = [];
    
    // Search by email or name
    if (search) {
      conditions.push({
        OR: [
          { email: { contains: search } },
          { name: { contains: search } }
        ]
      });
    }
    
    // Section filter
    if (section) {
      conditions.push({ section: { contains: section } });
    }
    
    // Department filter
    if (department) {
      conditions.push({ department: { contains: department } });
    }
    
    // Designation filter
    if (designation) {
      conditions.push({ designation: { contains: designation } });
    }
    
    // Supervisor filter
    if (supervisor) {
      conditions.push({ supervisor: { contains: supervisor } });
    }
    
    // Manager filter
    if (manager) {
      conditions.push({ manager: { contains: manager } });
    }
    
    // User Type filter
    if (userTypeId) {
      conditions.push({ userTypeId });
    }
    
    // Role filter
    if (role) {
      conditions.push({ role });
    }
    
    // Program filter
    if (programId) {
      conditions.push({
        programAssignments: {
          some: {
            programId,
            isActive: true
          }
        }
      });
    }

    // Construct final where clause
    const where = conditions.length > 0 ? { AND: conditions } : {};

    console.log('=== PRISMA WHERE CLAUSE ===');
    console.log(JSON.stringify(where, null, 2));

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          userType: {
            select: { id: true, name: true, slug: true }
          },
          programAssignments: {
            where: { isActive: true },
            include: {
              program: {
                select: { id: true, title: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    console.log('=== QUERY RESULTS ===');
    console.log('Total found:', total);
    console.log('Users returned:', users.length);

    return NextResponse.json({
      users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { email, name, role, userTypeId, section, department, supervisor, manager, designation } = body;

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create user without password (will be set via invitation link)
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: role || 'LEARNER',
        userTypeId,
        section,
        department,
        supervisor,
        manager,
        designation
      },
      include: {
        userType: true
      }
    });

    // If user has a UserType, create inherited program assignments
    if (userTypeId) {
      const userTypePrograms = await prisma.userTypeProgramAssignment.findMany({
        where: { userTypeId }
      });

      await prisma.programAssignment.createMany({
        data: userTypePrograms.map(utp => ({
          userId: user.id,
          programId: utp.programId,
          source: 'usertype',
          assignedBy: session.user.id
        }))
      });
    }

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}