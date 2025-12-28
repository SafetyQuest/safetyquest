// import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next';
// import { PrismaClient } from '@safetyquest/database';
// import { checkPermission } from '@safetyquest/shared/rbac/api-helpers';
// import { Resend } from 'resend';
// import { authOptions } from '@/auth';
// import { signJWT } from '@safetyquest/shared';

// const prisma = new PrismaClient();
// const resend = new Resend(process.env.RESEND_API_KEY);

// export async function POST(req: NextRequest) {
//   const session = await getServerSession(authOptions);
  
//   const authCheck = checkPermission(session, 'RESOURCE', 'ACTION');
//   if (!authCheck.authorized) {
//     return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
//   }

//   try {
//     const { userIds } = await req.json();

//     if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
//       return NextResponse.json(
//         { error: 'User IDs are required' },
//         { status: 400 }
//       );
//     }

//     // Fetch all users
//     const users = await prisma.user.findMany({
//       where: { id: { in: userIds } },
//       select: { id: true, email: true, name: true }
//     });

//     if (users.length === 0) {
//       return NextResponse.json(
//         { error: 'No users found' },
//         { status: 404 }
//       );
//     }

//     let successful = 0;
//     let failed = 0;
//     const errors: any[] = [];

//     // Send invitations
//     for (const user of users) {
//       try {
//         // Generate invitation token (valid for 7 days)
//         const invitationToken = signJWT(
//           { userId: user.id, email: user.email, type: 'invitation' },
//           '7d'
//         );

//         const setPasswordUrl = `${process.env.NEXTAUTH_URL}/set-password?token=${invitationToken}`;

//         // Send email via Resend
//         const { data, error } = await resend.emails.send({
//           from: process.env.RESEND_FROM_EMAIL || 'SafetyQuest <onboarding@safetyquest.com>',
//           to: user.email,
//           subject: 'Welcome to SafetyQuest - Set Your Password',
//           html: `
//             <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//               <h1 style="color: #2563eb;">Welcome to SafetyQuest!</h1>
//               <p>Hello ${user.name},</p>
//               <p>Your safety training account has been created. Click the button below to set your password and get started:</p>
//               <a href="${setPasswordUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Set Your Password</a>
//               <p style="color: #666; font-size: 14px;">This link will expire in 7 days.</p>
//               <p style="color: #666; font-size: 14px;">If you didn't expect this email, please ignore it.</p>
//             </div>
//           `
//         });

//         if (error) {
//           throw new Error(error.message);
//         }

//         // Log successful email
//         await prisma.emailLog.create({
//           data: {
//             to: user.email,
//             subject: 'Welcome to SafetyQuest',
//             template: 'invitation',
//             status: 'sent',
//             metadata: JSON.stringify({ resendId: data?.id })
//           }
//         });

//         successful++;
//       } catch (error: any) {
//         console.error(`Failed to send invitation to ${user.email}:`, error);
        
//         // Log failed email
//         await prisma.emailLog.create({
//           data: {
//             to: user.email,
//             subject: 'Welcome to SafetyQuest',
//             template: 'invitation',
//             status: 'failed',
//             metadata: JSON.stringify({ error: error.message })
//           }
//         });

//         failed++;
//         errors.push({
//           email: user.email,
//           error: error.message
//         });
//       }
//     }

//     return NextResponse.json({
//       success: true,
//       successful,
//       failed,
//       errors: failed > 0 ? errors : undefined,
//       message: `Successfully sent ${successful} invitation(s)${failed > 0 ? `, ${failed} failed` : ''}`
//     });
//   } catch (error: any) {
//     console.error('Bulk invite error:', error);
//     return NextResponse.json(
//       { error: error.message || 'Failed to send bulk invitations' },
//       { status: 500 }
//     );
//   }
// }
