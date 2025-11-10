import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { hashPassword } from '@safetyquest/shared';
import { authOptions } from '@/auth';

const prisma = new PrismaClient();

// Preview CSV import
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const isPreview = formData.get('preview') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV must have headers and at least one data row' },
        { status: 400 }
      );
    }

    // Parse CSV (simple approach - assumes comma-separated)
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || null;
      });
      return row;
    });

    // Validate required fields
    const requiredFields = ['email', 'name'];
    const missingFields = requiredFields.filter(field => !headers.includes(field));
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        error: `Missing required columns: ${missingFields.join(', ')}`
      }, { status: 400 });
    }

    // Validate each row
    const preview = await Promise.all(
      rows.map(async (row, index) => {
        const errors: string[] = [];
        
        // Check email
        if (!row.email || !row.email.includes('@')) {
          errors.push('Invalid email');
        } else {
          // Check if email already exists
          const existing = await prisma.user.findUnique({
            where: { email: row.email }
          });
          if (existing) {
            errors.push('Email already exists');
          }
        }

        // Check name
        if (!row.name) {
          errors.push('Name is required');
        }

        // Check userType if provided
        if (row.usertype) {
          const userType = await prisma.userType.findUnique({
            where: { slug: row.usertype }
          });
          if (!userType) {
            errors.push(`UserType '${row.usertype}' not found`);
          }
        }

        return {
          rowNumber: index + 2, // +2 because index starts at 0 and row 1 is headers
          data: row,
          status: errors.length === 0 ? 'valid' : 'invalid',
          errors
        };
      })
    );

    // If preview, return validation results
    if (isPreview) {
      const validCount = preview.filter(p => p.status === 'valid').length;
      const invalidCount = preview.filter(p => p.status === 'invalid').length;

      return NextResponse.json({
        preview,
        summary: {
          total: preview.length,
          valid: validCount,
          invalid: invalidCount
        }
      });
    }

    // Otherwise, process the import
    const results = {
      created: 0,
      failed: 0,
      errors: [] as any[]
    };

    for (const item of preview) {
      if (item.status !== 'valid') {
        results.failed++;
        results.errors.push({
          row: item.rowNumber,
          email: item.data.email,
          errors: item.errors
        });
        continue;
      }

      try {
        // Find userType
        let userTypeId = null;
        if (item.data.usertype) {
          const userType = await prisma.userType.findUnique({
            where: { slug: item.data.usertype }
          });
          userTypeId = userType?.id;
        }

        // Create user
        const user = await prisma.user.create({
          data: {
            email: item.data.email,
            name: item.data.name,
            passwordHash: await hashPassword(Math.random().toString(36).slice(-12)), // Random temp password
            role: item.data.role || 'LEARNER',
            userTypeId,
            section: item.data.section,
            department: item.data.department,
            supervisor: item.data.supervisor,
            manager: item.data.manager,
            designation: item.data.designation
          }
        });

        // Create inherited program assignments
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

        // TODO: Send invitation email

        results.created++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          row: item.rowNumber,
          email: item.data.email,
          errors: [error.message]
        });
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: error.message || 'Import failed' },
      { status: 500 }
    );
  }
}