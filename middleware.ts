import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    '/((?!api/auth|login|forgot-password|reset-password|p/|_next/static|_next/image|favicon.ico|logo.png).*)',
  ],
};
