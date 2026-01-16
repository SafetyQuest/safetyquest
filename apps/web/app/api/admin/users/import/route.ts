// apps/web/app/api/admin/users/import/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { checkPermission } from '@safetyquest/shared/rbac/api-helpers';
import { hashPassword } from '@safetyquest/shared';
import { authOptions } from '@/auth';
import { sendBulkWelcomeEmails } from '@/lib/email/azure-email-service';

const prisma = new PrismaClient();

// CSV Import API - Preview and Import Users
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check for bulk user creation permission
  const authCheck = checkPermission(session, 'users', 'bulk');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
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

    // Parse CSV - handle quoted values with commas inside
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/['"]/g, ''));
    const rows = lines.slice(1).map(line => {
      const values = parseCSVLine(line).map(v => v.replace(/^["']|["']$/g, '')); // Remove quotes
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

    // Fetch all user types and roles for validation (more efficient than per-row queries)
    const userTypes = await prisma.userType.findMany();
    const userTypeMap = new Map(userTypes.map(ut => [ut.slug.toLowerCase(), ut]));
    
    const roles = await prisma.role.findMany();
    const roleMap = new Map(roles.map(r => [r.slug.toLowerCase(), r]));

    // Get all existing emails for duplicate check
    const existingEmails = new Set(
      (await prisma.user.findMany({
        where: { email: { in: rows.map(r => r.email).filter(Boolean) } },
        select: { email: true }
      })).map(u => u.email.toLowerCase())
    );

    // Validate each row
    const preview = rows.map((row, index) => {
      const errors: string[] = [];
      
      // Check email
      if (!row.email || !row.email.includes('@')) {
        errors.push('Invalid email format');
      } else if (existingEmails.has(row.email.toLowerCase())) {
        errors.push('Email already exists');
      }

      // Check name
      if (!row.name || row.name.trim() === '') {
        errors.push('Name is required');
      }

      // Check userType if provided
      if (row.usertype) {
        const userTypeSlug = row.usertype.toLowerCase().trim();
        if (!userTypeMap.has(userTypeSlug)) {
          errors.push(`User Type '${row.usertype}' not found`);
        }
      }

      // Check role if provided
      if (row.role) {
        const roleSlug = row.role.toLowerCase().trim();
        if (!roleMap.has(roleSlug)) {
          errors.push(`Role '${row.role}' not found`);
        }
      }

      return {
        rowNumber: index + 2, // +2 because index starts at 0 and row 1 is headers
        data: row,
        status: errors.length === 0 ? 'valid' : 'invalid',
        errors
      };
    });

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
      errors: [] as any[],
      users: [] as any[] // Track created users with passwords
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
        let userTypeId: string | null = null;
        if (item.data.usertype) {
          const userTypeSlug = item.data.usertype.toLowerCase().trim();
          userTypeId = userTypeMap.get(userTypeSlug)?.id || null;
        }

        // Find role
        let roleId: string | null = null;
        let roleName = 'LEARNER'; // Default role
        if (item.data.role) {
          const roleSlug = item.data.role.toLowerCase().trim();
          const role = roleMap.get(roleSlug);
          if (role) {
            roleId = role.id;
            roleName = role.name;
          }
        } else {
          // Find LEARNER role by default
          const learnerRole = roles.find(r => r.slug === 'learner');
          if (learnerRole) {
            roleId = learnerRole.id;
            roleName = learnerRole.name;
          }
        }

        // Generate temporary password
        const temporaryPassword = Math.random().toString(36).slice(-12);

        // Create user
        const user = await prisma.user.create({
          data: {
            email: item.data.email.toLowerCase().trim(),
            name: item.data.name.trim(),
            passwordHash: await hashPassword(temporaryPassword),
            role: roleName,
            roleId,
            userTypeId,
            section: item.data.section?.trim() || null,
            department: item.data.department?.trim() || null,
            supervisor: item.data.supervisor?.trim() || null,
            manager: item.data.manager?.trim() || null,
            designation: item.data.designation?.trim() || null
          }
        });

        // Create inherited program assignments from user type
        if (userTypeId) {
          const userTypePrograms = await prisma.userTypeProgramAssignment.findMany({
            where: { userTypeId }
          });

          if (userTypePrograms.length > 0) {
            await prisma.programAssignment.createMany({
              data: userTypePrograms.map(utp => ({
                userId: user.id,
                programId: utp.programId,
                source: 'usertype',
                assignedBy: session.user.id
              }))
            });
          }
        }

        // Track created user with temporary password
        results.users.push({
          email: user.email,
          name: user.name,
          temporaryPassword
        });

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

    // 🆕 SEND BULK WELCOME EMAILS
    let emailResults = { successful: 0, failed: 0, results: [] as any[] };
    if (results.users.length > 0) {
      console.log(`📧 Sending welcome emails to ${results.users.length} users...`);
      
      emailResults = await sendBulkWelcomeEmails(results.users);
      
      // Log all email attempts
      for (const emailResult of emailResults.results) {
        await prisma.emailLog.create({
          data: {
            to: emailResult.email,
            subject: 'Welcome to Tetra Pak Safety Training',
            template: 'welcome',
            status: emailResult.success ? 'sent' : 'failed',
            metadata: JSON.stringify({
              error: emailResult.error,
              bulkImport: true
            })
          }
        });
      }
      
      console.log(`✅ Emails sent: ${emailResults.successful}, failed: ${emailResults.failed}`);
    }

    // Return results
    return NextResponse.json({
      created: results.created,
      failed: results.failed,
      errors: results.errors,
      users: results.users.map(u => ({
        email: u.email,
        name: u.name,
        temporaryPassword: u.temporaryPassword
      })),
      emailResults: {
        sent: emailResults.successful,
        failed: emailResults.failed
      }
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: error.message || 'Import failed' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}