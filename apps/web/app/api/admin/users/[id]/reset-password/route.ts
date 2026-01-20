import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { checkPermission } from '@safetyquest/shared/rbac/api-helpers';
import { PrismaClient } from '@safetyquest/database';
import { hashPassword } from '@safetyquest/shared/auth';
import { sendWelcomeEmail } from '@/lib/email/azure-email-service';

const prisma = new PrismaClient();

type Params = Promise<{ id: string }>;

function generateRandomPassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*.';
  const allChars = lowercase + uppercase + numbers + symbols;

  let password = '';
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export async function POST(
  req: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions);
    const authCheck = checkPermission(session, 'users', 'edit');

    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.reason || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get user details for email
    const user = await prisma.user.findUnique({
      where: { id },
      select: { email: true, name: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate new random password
    const newPassword = generateRandomPassword(12);
    const hashedPassword = await hashPassword(newPassword);

    // Update user password and set mustChangePassword flag
    await prisma.user.update({
      where: { id },
      data: { 
        passwordHash: hashedPassword,
        mustChangePassword: true,        // 🆕 Force password change
        lastPasswordChange: null          // 🆕 Reset last change date
      }
    });

    console.log(`✅ Reset password for user ${id}`);  // ✅ Fixed: Added parentheses

    // 🆕 SEND PASSWORD RESET EMAIL
    const emailResult = await sendWelcomeEmail(
      user.email,
      user.name,
      newPassword
    );

    // Log email attempt
    await prisma.emailLog.create({
      data: {
        to: user.email,
        subject: 'Password Reset - Tetra Pak Safety Training',
        template: 'password_reset',
        status: emailResult.success ? 'sent' : 'failed',
        metadata: JSON.stringify({
          messageId: emailResult.messageId,
          error: emailResult.error,
          userId: id,
          resetByAdmin: session.user.id
        })
      }
    });

    console.log(`📧 Password reset email ${emailResult.success ? 'sent' : 'failed'} to ${user.email}`);  // ✅ Fixed: Added parentheses

    // Return new password (show once) and email status
    return NextResponse.json({ 
      success: true,
      temporaryPassword: newPassword,
      emailSent: emailResult.success,
      emailError: emailResult.error
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}