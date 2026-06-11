'use client';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { userAPI } from '../../../lib/api';
import Navbar from '../../../components/shared/Navbar';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import { Users, Copy, CheckCircle, XCircle, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

const levelRewards = { 1: 20, 2: 10, 3: 5, 4: 5, 5: 5, 6: 1, 7: 1, 8: 1, 9: 1, 10: 1, 11: 1, 12: 1, 13: 1, 14: 1, 15: 1 };

export default function ReferralsPage() {
  const router = useRouter();
  const { isAuthenticated, user, sessionChecked } = useSelector((s) => s.user);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionChecked) return;
    if (!isAuthenticated) { router.push('/'); return; }
    userAPI.getReferrals()
      .then((r) => setData(r.data.data))
      .catch(() => toast.error('Failed to load referrals'))
      .finally(() => setLoading(false));
  }, [sessionChecked, isAuthenticated, router]);

  const copyLink = () => {
    const link = `${process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/auth/register?ref=${user?.referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied!');
  };

  const shareWhatsApp = () => {
    const link = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/register?ref=${user?.referralCode}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(`🔥 Free 100 NFTs on signup!\nJoin FutureMint → Earn daily → Withdraw USDT\n\n👉 ${link}`)}`, '_blank');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="xl" /></div>;
  }

  const totalNetwork = data?.levelWise?.reduce((s, l) => s + l.count, 0) || 0;

  return (
    <div className="min-h-screen pb-16">
      <Navbar />
      <main className="max-w-3xl mx-auto px-3 sm:px-6 pt-20 sm:pt-24">
        <h1 className="page-title">Referral Center</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card text-center">
            <div className="text-2xl sm:text-3xl font-bold text-white">{data?.totalReferrals || 0}</div>
            <div className="text-xs text-slate-400 mt-1">Direct</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400">{data?.activeMembers || 0}</div>
            <div className="text-xs text-slate-400 mt-1">Active</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl sm:text-3xl font-bold text-primary-400">{totalNetwork}</div>
            <div className="text-xs text-slate-400 mt-1">Total Team</div>
          </div>
        </div>

        {/* Share Section */}
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Share2 className="w-5 h-5 text-primary-400" />
            <h2 className="font-semibold text-white">Invite & Earn</h2>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Your code: <span className="text-primary-400 font-mono font-bold">{user?.referralCode}</span>
          </p>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={copyLink}
              className="flex flex-col items-center gap-2 p-3 bg-dark-700 hover:bg-dark-600 rounded-xl border border-dark-600 hover:border-primary-500/50 transition-all">
              <Copy className="w-5 h-5 text-primary-400" />
              <span className="text-xs text-slate-300">Copy</span>
            </button>
            <button onClick={shareWhatsApp}
              className="flex flex-col items-center gap-2 p-3 bg-dark-700 hover:bg-dark-600 rounded-xl border border-dark-600 hover:border-emerald-500/50 transition-all">
              <span className="text-xl">💬</span>
              <span className="text-xs text-slate-300">WhatsApp</span>
            </button>
            <a href={`https://t.me/share/url?url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/auth/register?ref=${user?.referralCode}`)}&text=${encodeURIComponent('🔥 Free 100 NFTs! Join FutureMint → Earn daily → Withdraw USDT')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-3 bg-dark-700 hover:bg-dark-600 rounded-xl border border-dark-600 hover:border-blue-500/50 transition-all">
              <span className="text-xl">✈️</span>
              <span className="text-xs text-slate-300">Telegram</span>
            </a>
          </div>
        </div>

        {/* Level-wise Breakdown */}
        <div className="card mb-6">
          <h2 className="font-semibold text-white mb-2">15-Level Earning Structure</h2>
          <p className="text-xs text-slate-500 mb-4">You earn NFTs from every verified member across all 15 levels</p>
          <div className="space-y-2">
            {Array.from({ length: 15 }, (_, i) => {
              const level = i + 1;
              const row = data?.levelWise?.find((r) => r.level === level);
              const count = row?.count || 0;
              const reward = levelRewards[level] || 1;
              const hasMembers = count > 0;
              return (
                <div key={level} className={`flex items-center justify-between p-3 rounded-lg ${hasMembers ? 'bg-primary-900/20 border border-primary-700/30' : 'bg-dark-700'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasMembers ? 'bg-primary-600/30' : 'bg-dark-600'}`}>
                      <span className={`text-xs font-bold ${hasMembers ? 'text-primary-400' : 'text-slate-500'}`}>{level}</span>
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${hasMembers ? 'text-white' : 'text-slate-500'}`}>
                        {count} {count === 1 ? 'member' : 'members'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${hasMembers ? 'text-emerald-400' : 'text-slate-600'}`}>+{reward} NFT</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Direct Referrals */}
        <div className="card">
          <h2 className="font-semibold text-white mb-4">Direct Referrals</h2>
          {data?.directReferrals?.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No referrals yet. Share your link to start earning!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.directReferrals?.map((ref, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-dark-700 rounded-xl">
                  {/* Avatar */}
                  <div className="w-9 h-9 bg-primary-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary-400">
                      {ref.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{ref.name}</p>
                    <p className="text-xs text-slate-500 truncate">{ref.email}</p>
                  </div>
                  {/* Status + Date */}
                  <div className="text-right flex-shrink-0">
                    {ref.isVerified
                      ? <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium"><CheckCircle className="w-3 h-3" /> Active</span>
                      : <span className="inline-flex items-center gap-1 text-xs text-yellow-400 font-medium"><XCircle className="w-3 h-3" /> Pending</span>
                    }
                    <p className="text-xs text-slate-600 mt-0.5">{new Date(ref.joinedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
