// apps/web/app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@safetyquest/database';
import { hashPassword } from '@safetyquest/shared';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  // Set default headers to ensure JSON response
  const jsonResponse = (data: any, status = 200) =>
    NextResponse.json(data, {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return jsonResponse({ error: 'Invalid JSON payload' }, 400);
    }

    const { newPassword } = body;

    if (!newPassword) {
      return jsonResponse({ error: 'New password is required' }, 400);
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return jsonResponse({ error: 'Password does not meet requirements' }, 400);
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        passwordHash: hashedPassword,
        mustChangePassword: false,
        lastPasswordChange: new Date(),
      },
    });

    console.log(`✅ Password changed for user: ${session.user.email}`);

    return jsonResponse({
      success: true,
      message: 'Password changed successfully',
    });

  } catch (error: any) {
    console.error('Error changing password:', error);

    // Always return JSON, even on unknown errors
    return jsonResponse(
      { error: error.message || 'Failed to change password' },
      500
    );
  } finally {
    await prisma.$disconnect();
  }
}