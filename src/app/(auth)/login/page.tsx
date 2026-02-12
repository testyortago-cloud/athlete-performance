'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Activity, Shield, BarChart3, Zap } from 'lucide-react';

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-xs text-white/50">{description}</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        // Hard redirect to avoid the black login bg persisting during client-side navigation
        window.location.href = '/dashboard';
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-black">
      {/* Left panel — branding + hero */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col justify-between p-12 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }} />
        </div>

        {/* Gradient accent */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-white/[0.02] to-transparent" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">DJP</span>
            <span className="text-[10px] font-semibold tracking-[0.2em] text-white/80 self-end mb-0.5">
              ATHLETE
            </span>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold leading-tight text-white">
            Monitor. Analyze.
            <br />
            <span className="text-white/60">Protect.</span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/50">
            Track athlete performance, manage training loads, and prevent injuries
            with data-driven insights — all in one platform.
          </p>

          <div className="mt-10 space-y-5">
            <FeatureItem
              icon={<Activity className="h-4 w-4 text-white/70" />}
              title="Load Monitoring"
              description="Track daily training loads and ACWR in real-time"
            />
            <FeatureItem
              icon={<Shield className="h-4 w-4 text-white/70" />}
              title="Injury Prevention"
              description="Identify at-risk athletes before injuries happen"
            />
            <FeatureItem
              icon={<BarChart3 className="h-4 w-4 text-white/70" />}
              title="Performance Analytics"
              description="Compare metrics across athletes and sessions"
            />
            <FeatureItem
              icon={<Zap className="h-4 w-4 text-white/70" />}
              title="Testing Sessions"
              description="Record trials, track personal bests, spot trends"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-xs text-white/30">
            DJP Athlete Performance Platform
          </p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 lg:px-12 lg:border-l lg:border-white/5">
        {/* Mobile logo (shown only on small screens) */}
        <div className="mb-10 text-center lg:hidden">
          <h1 className="text-3xl font-bold tracking-tight text-white">DJP</h1>
          <p className="text-sm font-semibold tracking-[0.3em] text-white/80">ATHLETE</p>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="mt-1 text-sm text-white/50">Sign in to your account to continue</p>
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

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-500">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 pr-10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/30"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/40 hover:text-white/70 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 text-white focus:ring-white/30"
                />
                <span className="text-xs text-gray-500">Remember me</span>
              </label>
              <button
                type="button"
                className="text-xs text-gray-500 hover:text-white/80 transition-colors"
                onClick={() => {/* Placeholder for forgot password flow */}}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
