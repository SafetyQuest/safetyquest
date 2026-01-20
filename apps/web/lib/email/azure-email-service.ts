// lib/email/azure-email-service.ts
import { EmailClient } from "@azure/communication-email";

const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING!;
const senderAddress = process.env.AZURE_SENDER_EMAIL!;

const emailClient = new EmailClient(connectionString);

// Tetra Pak Color Palette
const COLORS = {
  primary: '#0052A5',
  secondary: '#00A3E0',
  accent: '#F37021',
  text: '#333333',
  textLight: '#666666',
  background: '#F5F5F5',
  white: '#FFFFFF'
};

const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const ENV = process.env.NODE_ENV || 'development';
const IS_DEV = ENV === 'development';

/**
 * Base email HTML template with Tetra Pak branding
 */
function getEmailTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tetra Pak Safety Training</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: ${COLORS.background};
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: ${COLORS.white};
        }
        .header {
          background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%);
          padding: 30px 20px;
          text-align: center;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: ${COLORS.white};
          letter-spacing: 1px;
        }
        .logo-subtitle {
          color: ${COLORS.white};
          font-size: 14px;
          margin-top: 5px;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
          color: ${COLORS.text};
          line-height: 1.6;
        }
        .button {
          display: inline-block;
          padding: 14px 32px;
          background-color: ${COLORS.accent};
          color: ${COLORS.white} !important;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
        }
        .credentials-box {
          background-color: #F8F9FA;
          border-left: 4px solid ${COLORS.primary};
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .credentials-box h3 {
          margin-top: 0;
          color: ${COLORS.primary};
          font-size: 16px;
        }
        .password-display {
          font-size: 18px;
          font-weight: bold;
          color: ${COLORS.primary};
          letter-spacing: 1px;
          font-family: 'Courier New', monospace;
          background-color: ${COLORS.white};
          padding: 12px;
          border-radius: 4px;
          border: 1px solid #E0E0E0;
          margin-top: 8px;
        }
        .warning {
          background-color: #FFF3CD;
          border-left: 4px solid #FFC107;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          background-color: ${COLORS.background};
          padding: 30px;
          text-align: center;
          color: ${COLORS.textLight};
          font-size: 13px;
          border-top: 1px solid #E0E0E0;
        }
        .divider {
          height: 1px;
          background-color: #E0E0E0;
          margin: 30px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">TETRA PAK</div>
          <div class="logo-subtitle">Safety Training Platform</div>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p><strong>Tetra Pak Safety Training</strong></p>
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} Tetra Pak. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send welcome email with temporary password
 */
export async function sendWelcomeEmail(
  to: string,
  name: string,
  temporaryPassword: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const subjectPrefix = IS_DEV ? '[DEV] ' : '';
    
    const content = `
      <h2 style="color: ${COLORS.primary}; margin-top: 0;">Welcome to Tetra Pak Safety Training! 👋</h2>
      
      <p>Hello <strong>${name}</strong>,</p>
      
      <p>Your safety training account has been created successfully. We're excited to have you join our commitment to workplace safety excellence.</p>
      
      <div class="credentials-box">
        <h3>🔐 Your Login Credentials</h3>
        <p><strong>Email:</strong> ${to}</p>
        <p><strong>Temporary Password:</strong></p>
        <div class="password-display">${temporaryPassword}</div>
      </div>
      
      <div class="warning">
        <strong>⚠️ Important Security Notice:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>This is a <strong>temporary password</strong> - you'll be required to create a new one on first login</li>
          <li>Keep this password secure and do not share it with anyone</li>
          <li>You will be prompted to change it immediately after logging in</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_URL}/login" class="button">Login to Your Account</a>
      </div>
      
      <div class="divider"></div>
      
      <h3 style="color: ${COLORS.primary};">Getting Started</h3>
      <ol style="line-height: 1.8;">
        <li>Click the button above or visit: <a href="${APP_URL}">${APP_URL}</a></li>
        <li>Enter your email and temporary password</li>
        <li>Create your new secure password</li>
        <li>Complete your assigned safety training courses</li>
      </ol>
      
      <p style="margin-top: 30px; color: ${COLORS.textLight};">
        <strong>Need Help?</strong><br/>
        If you have any questions or encounter any issues, please contact your training administrator.
      </p>
    `;

    const emailMessage = {
      senderAddress,
      content: {
        subject: `${subjectPrefix}🎓 Welcome to Tetra Pak Safety Training - Your Account is Ready!`,
        html: getEmailTemplate(content),
      },
      recipients: {
        to: [{ address: to }],
      },
    };

    const poller = await emailClient.beginSend(emailMessage);
    const result = await poller.pollUntilDone();

    console.log(`✅ Welcome email sent to ${to}`);
    
    return {
      success: true,
      messageId: result.id
    };
  } catch (error: any) {
    console.error('❌ Failed to send welcome email:', error);
    
    return {
      success: false,
      error: error.message || 'Failed to send email'
    };
  }
}

/**
 * Send bulk welcome emails for CSV imports
 */
export async function sendBulkWelcomeEmails(
  users: Array<{ email: string; name: string; temporaryPassword: string }>
): Promise<{
  successful: number;
  failed: number;
  results: Array<{ email: string; success: boolean; error?: string }>;
}> {
  const results: Array<{ email: string; success: boolean; error?: string }> = [];
  let successful = 0;
  let failed = 0;

  for (const user of users) {
    const result = await sendWelcomeEmail(
      user.email,
      user.name,
      user.temporaryPassword
    );
    
    if (result.success) {
      successful++;
    } else {
      failed++;
    }
    
    results.push({
      email: user.email,
      success: result.success,
      error: result.error
    });
    
    // Small delay between emails to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`📧 Bulk email send complete: ${successful} sent, ${failed} failed`);
  
  return { successful, failed, results };
}

/**
 * Send password reset email (when admin resets an existing user's password)
 */
export async function sendPasswordResetEmail(
  to: string,
  name: string,
  temporaryPassword: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const subjectPrefix = IS_DEV ? '[DEV] ' : '';
    
    const content = `
      <h2 style="color: ${COLORS.accent}; margin-top: 0;">🔄 Your Password Has Been Reset</h2>
      
      <p>Hello <strong>${name}</strong>,</p>
      
      <p>Your password has been reset by an administrator. You can now log in using the temporary password below.</p>
      
      <div class="credentials-box">
        <h3>🔐 Your New Login Credentials</h3>
        <p><strong>Email:</strong> ${to}</p>
        <p><strong>Temporary Password:</strong></p>
        <div class="password-display">${temporaryPassword}</div>
      </div>
      
      <div class="warning">
        <strong>⚠️ Important Security Notice:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>This is a <strong>temporary password</strong> - you'll be required to create a new one on login</li>
          <li>Keep this password secure and do not share it with anyone</li>
          <li>You will be prompted to change it immediately after logging in</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_URL}/login" class="button">Login to Your Account</a>
      </div>
      
      <div class="divider"></div>
      
      <p style="margin-top: 30px; color: ${COLORS.textLight};">
        <strong>Didn't request this reset?</strong><br/>
        If you did not request a password reset, please contact your training administrator immediately.
      </p>
    `;

    const emailMessage = {
      senderAddress,
      content: {
        subject: `${subjectPrefix}🔐 Password Reset - Tetra Pak Safety Training`,
        html: getEmailTemplate(content),
      },
      recipients: {
        to: [{ address: to }],
      },
    };

    const poller = await emailClient.beginSend(emailMessage);
    const result = await poller.pollUntilDone();

    console.log(`✅ Password reset email sent to ${to}`);
    
    return {
      success: true,
      messageId: result.id
    };
  } catch (error: any) {
    console.error('❌ Failed to send password reset email:', error);
    
    return {
      success: false,
      error: error.message || 'Failed to send email'
    };
  }
}

/**
 * Test email function
 */
export async function sendTestEmail(to: string): Promise<{ success: boolean; error?: string }> {
  try {
    const content = `
      <h2 style="color: ${COLORS.primary};">🧪 Azure Communication Services Test</h2>
      <p>This is a test email to verify your Azure Communication Services configuration.</p>
      <p>If you're receiving this, your email service is working correctly! ✅</p>
      <p><strong>Configuration:</strong></p>
      <ul>
        <li>From: ${senderAddress}</li>
        <li>App URL: ${APP_URL}</li>
        <li>Environment: ${ENV}</li>
        <li>Timestamp: ${new Date().toISOString()}</li>
      </ul>
    `;

    const emailMessage = {
      senderAddress,
      content: {
        subject: 'Azure Communication Services Test Email',
        html: getEmailTemplate(content),
      },
      recipients: {
        to: [{ address: to }],
      },
    };

    const poller = await emailClient.beginSend(emailMessage);
    await poller.pollUntilDone();
    
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to send test email'
    };
  }
}
