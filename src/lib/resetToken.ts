import jwt from 'jsonwebtoken';

const SECRET = process.env.PASSWORD_RESET_SECRET || 'fallback-dev-secret';

interface ResetTokenPayload {
  email: string;
  hashPrefix: string;
}

export function generateResetToken(email: string, passwordHash: string): string {
  return jwt.sign(
    { email, hashPrefix: passwordHash.slice(0, 10) } satisfies ResetTokenPayload,
    SECRET,
    { expiresIn: '1h' }
  );
}

export function verifyResetToken(token: string): ResetTokenPayload {
  const payload = jwt.verify(token, SECRET) as ResetTokenPayload;
  if (!payload.email || !payload.hashPrefix) {
    throw new Error('Invalid token payload');
  }
  return payload;
}
