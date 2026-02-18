import 'next-auth';
import 'next-auth/jwt';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    role: 'admin' | 'coach' | 'athlete';
  }

  interface Session extends DefaultSession {
    user: {
      id: string;
      role: 'admin' | 'coach' | 'athlete';
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'admin' | 'coach' | 'athlete';
  }
}

export type UserRole = 'admin' | 'coach' | 'athlete';
