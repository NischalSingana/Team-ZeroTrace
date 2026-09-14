'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/auth-store';
import { motion } from 'framer-motion';
import { ThreeBackground } from './ThreeBackground';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const res = await fetch(`${apiUrl}/api/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      if (!res.ok) throw new Error('Invalid credentials. Please try again.');

      const data = await res.json();
      setToken(data.access_token);
      setUser({ username });
      // Set cookie for route protection in proxy.ts
      document.cookie = `ulpf-auth-token=${data.access_token}; path=/; max-age=604800; samesite=strict`;
      router.push('/overview');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[#050709]">
      <ThreeBackground />

      {/* Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm mx-4"
      >
        {/* Glassmorphism card */}
        <div
          className="rounded-2xl border border-[#1e2d3d] bg-[#0d1117]/80 p-8 shadow-2xl"
          style={{ backdropFilter: 'blur(20px)' }}
        >
          {/* Logo & Brand */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-[#1e3a5f] bg-gradient-to-br from-[#1e3a8a] to-[#1e2d3d] shadow-lg">
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-[#60a5fa]" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#e2e8f0]">ZeroTrace</h1>
            <p className="mt-1 text-xs font-mono text-[#64748b] tracking-widest uppercase">Log Intelligence Platform</p>
          </div>

          {/* Divider */}
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#1e2d3d]" />
            <span className="text-[10px] font-mono text-[#475569] uppercase tracking-widest">Authenticate</span>
            <div className="h-px flex-1 bg-[#1e2d3d]" />
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="block text-[11px] font-mono font-medium uppercase tracking-widest text-[#64748b]">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full rounded-lg border border-[#1e2d3d] bg-[#050709] px-3.5 py-2.5 text-sm text-[#e2e8f0] placeholder-[#334155] outline-none transition-all duration-200 focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/40 font-mono"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-[11px] font-mono font-medium uppercase tracking-widest text-[#64748b]">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-[#1e2d3d] bg-[#050709] px-3.5 py-2.5 text-sm text-[#e2e8f0] placeholder-[#334155] outline-none transition-all duration-200 focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/40 font-mono"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/5 px-3 py-2.5">
                <svg className="h-3.5 w-3.5 flex-shrink-0 text-[#ef4444]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-xs font-mono text-[#f87171]">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="relative mt-2 w-full overflow-hidden rounded-lg bg-gradient-to-r from-[#1d4ed8] to-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:from-[#1e40af] hover:to-[#1d4ed8] hover:shadow-[#3b82f6]/25 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50 focus:ring-offset-2 focus:ring-offset-[#0d1117]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              )}
            </button>
          </form>

          {/* Footer hint */}
          <div className="mt-6 rounded-lg border border-[#1e2d3d] bg-[#050709]/60 px-3 py-2.5">
            <p className="text-center text-[10px] font-mono text-[#475569]">
              Demo credentials:{' '}
              <span className="text-[#60a5fa]">admin</span>
              {' / '}
              <span className="text-[#60a5fa]">admin</span>
            </p>
          </div>
        </div>

        {/* Bottom tag */}
        <p className="mt-4 text-center text-[10px] font-mono text-[#334155]">
          ZeroTrace ULPF · SIH26156 · Team ZeroTrace
        </p>
      </motion.div>
    </div>
  );
}
