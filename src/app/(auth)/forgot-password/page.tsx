'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (!res.ok) {
        throw new Error('Request failed');
      }

      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">DJP</h1>
          <p className="text-sm font-semibold tracking-[0.3em] text-white/80">ATHLETE</p>
        </div>

        {submitted ? (
          /* Success state */
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
              <Mail className="h-6 w-6 text-white/70" />
            </div>
            <h2 className="text-xl font-bold text-white">Check your email</h2>
            <p className="mt-2 text-sm text-white/50">
              If an account with that email exists, we&apos;ve sent a password reset link.
              The link will expire in 1 hour.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </div>
        ) : (
          /* Form state */
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white">Forgot password?</h2>
              <p className="mt-1 text-sm text-white/50">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-500">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/30"
                  placeholder="admin@djpathlete.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
