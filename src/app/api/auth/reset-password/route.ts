import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByEmail, updateUserPassword } from '@/lib/airtable';
import { verifyResetToken } from '@/lib/resetToken';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Verify the JWT
    let payload;
    try {
      payload = verifyResetToken(token);
    } catch {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });
    }

    // Look up user and validate hash prefix (ensures single-use)
    const user = await getUserByEmail(payload.email);
    if (!user || user.passwordHash.slice(0, 10) !== payload.hashPrefix) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });
    }

    // Hash new password and update
    const newHash = await bcrypt.hash(password, 12);
    await updateUserPassword(user.id, newHash);

    return NextResponse.json({ message: 'Password has been reset successfully' });
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
