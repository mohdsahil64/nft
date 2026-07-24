'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const backendBase = API_URL.startsWith('http') ? API_URL : `https://${API_URL}`;

export default function MaintenanceGate({ children }) {
  const pathname = usePathname();
  const [maintenance, setMaintenance] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Don't block admin pages
    if (pathname?.startsWith('/admin')) {
      setChecked(true);
      return;
    }

    const checkMaintenance = async () => {
      try {
        const res = await fetch(`${backendBase}/api/maintenance/status`, {
          cache: 'no-store',
          next: { revalidate: 0 },
        });
        const data = await res.json();
        setMaintenance(data?.data?.maintenance === true);
      } catch (_) {
        // If can't reach server, don't block users
        setMaintenance(false);
      } finally {
        setChecked(true);
      }
    };

    checkMaintenance();
    // Re-check every 30 seconds
    const interval = setInterval(checkMaintenance, 30000);
    return () => clearInterval(interval);
  }, [pathname]);

  // Admin pages always pass through
  if (pathname?.startsWith('/admin')) return children;

  // Still checking - show nothing briefly
  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070714]">
        <div className="relative">
          <div className="absolute inset-0 bg-purple-500/20 rounded-2xl blur-xl animate-pulse" />
          <img src="/assets/favicon/favicon-96x96.png" alt="" className="w-12 h-12 rounded-2xl relative animate-pulse" style={{ animationDuration: '1.5s' }} />
        </div>
      </div>
    );
  }

  // Maintenance mode ON - show maintenance page
  if (maintenance) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070714] px-4">
        <div className="max-w-sm w-full text-center">
          {/* Glow effect */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-3xl" />
            <div className="relative w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/10 border border-purple-500/30 flex items-center justify-center">
              <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.42 15.17l-5.58-3.22a1 1 0 01-.5-.87V7.72a1 1 0 01.5-.87l5.58-3.22a1 1 0 011 0l5.58 3.22a1 1 0 01.5.87v3.36a1 1 0 01-.5.87l-5.58 3.22a1 1 0 01-1 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.5 9.5l5.5 3.18 5.5-3.18" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12.68V19" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">Under Maintenance</h1>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            We are currently upgrading the platform to serve you better. Please check back shortly.
          </p>

          {/* Status indicator */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-xs text-yellow-300 font-medium">Maintenance in progress</span>
          </div>

          <p className="text-[11px] text-slate-600 mt-8">FutureMint NFT &bull; www.futuremint.app</p>
        </div>
      </div>
    );
  }

  // All good - render app normally
  return children;
}
