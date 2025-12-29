// import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next';
// import { PrismaClient } from '@safetyquest/database';
// import { checkPermission } from '@safetyquest/shared/rbac/api-helpers';
// import { Resend } from 'resend';
// import { authOptions } from '@/auth';
// import { signJWT } from '@safetyquest/shared';

// const prisma = new PrismaClient();
// const resend = new Resend(process.env.RESEND_API_KEY);

// export async function POST(
//   req: NextRequest,
//   { params }: { params: Promise<{ id: string }> } // Changed to Promise
// ) {
//   const session = await getServerSession(authOptions);
  
//   const authCheck = checkPermission(session, 'RESOURCE', 'ACTION');
//   if (!authCheck.authorized) {
//     return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
//   }

//   const { id } = await params; // Await params first

//   try {
//     const user = await prisma.user.findUnique({
//       where: { id } // Use awaited id
//     });

//     if (!user) {
//       return NextResponse.json({ error: 'User not found' }, { status: 404 });
//     }

//     // Generate invitation token (valid for 7 days)
//     const invitationToken = signJWT(
//       { userId: user.id, email: user.email, type: 'invitation' },
//       '7d'
//     );

//     const setPasswordUrl = `${process.env.NEXTAUTH_URL}/set-password?token=${invitationToken}`;

//     // Send email via Resend
//     const { data, error } = await resend.emails.send({
//       from: process.env.RESEND_FROM_EMAIL || 'SafetyQuest <onboarding@safetyquest.com>',
//       to: user.email,
//       subject: 'Welcome to SafetyQuest - Set Your Password',
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h1 style="color: #2563eb;">Welcome to SafetyQuest!</h1>
//           <p>Hello ${user.name},</p>
//           <p>Your safety training account has been created. Click the button below to set your password and get started:</p>
//           <a href="${setPasswordUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Set Your Password</a>
//           <p style="color: #666; font-size: 14px;">This link will expire in 7 days.</p>
//           <p style="color: #666; font-size: 14px;">If you didn't expect this email, please ignore it.</p>
//         </div>
//       `
//     });

//     if (error) {
//       throw new Error(error.message);
//     }

//     // Log email
//     await prisma.emailLog.create({
//       data: {
//         to: user.email,
//         subject: 'Welcome to SafetyQuest',
//         template: 'invitation',
//         status: 'sent',
//         metadata: JSON.stringify({ resendId: data?.id })
//       }
//     });

//     return NextResponse.json({ success: true });
//   } catch (error: any) {
//     console.error('Email send error:', error);
    
//     // Log failed email
//     await prisma.emailLog.create({
//       data: {
//         to: id, // Use awaited id
//         subject: 'Welcome to SafetyQuest',
//         template: 'invitation',
//         status: 'failed',
//         metadata: JSON.stringify({ error: error.message })
//       }
//     });

//     return NextResponse.json(
//       { error: error.message || 'Failed to send invitation' },
//       { status: 500 }
//     );
//   }
// }
