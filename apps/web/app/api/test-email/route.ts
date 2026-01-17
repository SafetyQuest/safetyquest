import { NextRequest, NextResponse } from 'next/server';
import { sendTestEmail } from '@/lib/email/azure-email-service';

export async function GET(req: NextRequest) {
  try {
    const result = await sendTestEmail('ahmad.bilal.chohan@gmail.com');
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Then test by visiting: http://localhost:3000/api/test-email
