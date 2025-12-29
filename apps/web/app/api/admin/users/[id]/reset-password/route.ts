import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { checkPermission } from '@safetyquest/shared/rbac/api-helpers';
import { PrismaClient } from '@safetyquest/database';
import { hashPassword } from '@safetyquest/shared/auth';

const prisma = new PrismaClient();

type Params = Promise<{ id: string }>;

function generateRandomPassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
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
    
    // Generate new random password
    const newPassword = generateRandomPassword(12);
    const hashedPassword = await hashPassword(newPassword);
    
    // Update user password
    await prisma.user.update({
      where: { id },
      data: { passwordHash: hashedPassword }
    });
    
    console.log(`✅ Reset password for user ${id}`);
    
    // ✅ Return new password (show once)
    return NextResponse.json({ 
      success: true,
      temporaryPassword: newPassword
    });
    
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}