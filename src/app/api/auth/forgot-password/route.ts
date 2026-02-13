import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/airtable';
import { generateResetToken } from '@/lib/resetToken';
import { sendPasswordResetEmail } from '@/lib/email';

// Simple in-memory rate limiter: IP → last request timestamp
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 60_000; // 1 request per minute per IP

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  // Rate limiting
  const lastRequest = rateLimitMap.get(ip);
  if (lastRequest && Date.now() - lastRequest < RATE_LIMIT_MS) {
    return NextResponse.json(
      { message: 'If an account with that email exists, we have sent a password reset link.' },
      { status: 200 }
    );
  }
  rateLimitMap.set(ip, Date.now());

  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await getUserByEmail(email.toLowerCase().trim());

    if (user) {
      const token = generateResetToken(user.email, user.passwordHash);
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;
      await sendPasswordResetEmail(user.email, resetUrl);
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message: 'If an account with that email exists, we have sent a password reset link.',
    });
  } catch {
    return NextResponse.json({
      message: 'If an account with that email exists, we have sent a password reset link.',
    });
  }
}
