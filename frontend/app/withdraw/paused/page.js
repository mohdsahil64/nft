'use client';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/shared/Navbar';
import { Shield, Handshake, Rocket } from 'lucide-react';

export default function WithdrawPausedPage() {
  const router = useRouter();
  const { isAuthenticated, sessionChecked } = useSelector((s) => s.user);

  useEffect(() => {
    if (sessionChecked && !isAuthenticated) {
      router.push('/');
    }
  }, [sessionChecked, isAuthenticated, router]);

  return (
    <div className="min-h-screen pb-16">
      <Navbar />
      <main className="max-w-lg mx-auto px-3 sm:px-6 pt-20 sm:pt-24">
        <div className="card text-center py-8 sm:py-12">
          {/* Icon */}
          <div className="w-16 h-16 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-5 border border-primary-500/30">
            <Handshake className="w-8 h-8 text-primary-400" />
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
            Withdrawal Update
          </h2>

          {/* Message */}
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-6 max-w-sm mx-auto">
            Dear Users, due to ongoing strategic partnership processes with two major companies and essential platform upgrades, withdrawals have been temporarily paused until <span className="text-primary-400 font-semibold">25 July 2026</span>.
          </p>

          {/* Partnership info */}
          <div className="bg-dark-700/80 rounded-xl border border-dark-600 p-4 mb-5 max-w-sm mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <Rocket className="w-5 h-5 text-primary-400" />
              <span className="text-sm text-white font-medium">2 New Partnerships</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              We are integrating with two major companies to bring bigger opportunities, stronger community, and more value to you.
            </p>
          </div>

          {/* Safety card */}
          <div className="bg-dark-700/80 rounded-xl border border-emerald-700/30 p-4 mb-6 max-w-sm mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-white font-medium">Your funds are safe</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              All NFT balances and earnings are secure. Withdrawals will resume after the partnership integration is complete.
            </p>
          </div>

          {/* Coming Soon badge */}
          <div className="inline-flex items-center gap-2 bg-primary-900/30 border border-primary-700/30 rounded-full px-4 py-2 mb-4">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs sm:text-sm text-primary-300 font-medium">Coming Soon</span>
          </div>

          <p className="text-xs text-slate-600 mt-4">
            Thank you for your patience and continued support.<br />— FutureMint Team
          </p>
        </div>
      </main>
    </div>
  );
}
