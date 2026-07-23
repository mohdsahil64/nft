'use client';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { userAPI } from '../../../lib/api';
import Navbar from '../../../components/shared/Navbar';
import { QRCodeSVG } from 'qrcode.react';
import { RiFileCopyLine } from 'react-icons/ri';
import { RiUserFollowLine, RiTeamFill, RiFlashlightFill, RiUserUnfollowLine, RiWhatsappFill, RiTelegramFill, RiTwitterXFill, RiFacebookCircleFill } from 'react-icons/ri';
import toast from 'react-hot-toast';

export default function TeamPage() {
  const router = useRouter();
  const { isAuthenticated, user, sessionChecked } = useSelector((s) => s.user);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionChecked) return;
    if (!isAuthenticated) { router.push('/'); return; }
    userAPI.getReferrals()
      .then((r) => setData(r.data.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [sessionChecked, isAuthenticated, router]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const referralLink = `${appUrl}/auth/register?ref=${user?.referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied!');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(user?.referralCode || '');
    toast.success('Referral code copied!');
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`🔥 Join FutureMint NFT — Watch ads, earn NFTs + FM Tokens daily!\n\n👉 ${referralLink}`)}`, '_blank');
  };
  const shareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('🔥 Join FutureMint — Earn NFTs + FM Tokens daily!')}`, '_blank');
  };
  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`🔥 Join FutureMint NFT — Earn daily!\n👉 ${referralLink}`)}`, '_blank');
  };
  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070714]">
        <div className="relative"><div className="absolute inset-0 bg-purple-500/20 rounded-2xl blur-xl animate-pulse" /><img src="/assets/favicon/favicon-96x96.png" alt="" className="w-12 h-12 rounded-2xl relative animate-pulse" style={{animationDuration:"1.5s"}} /></div>
      </div>
    );
  }

  const totalTeam = data?.levelWise?.reduce((s, l) => s + l.count, 0) || 0;
  const directMembers = data?.totalReferrals || 0;
  const activeMembers = data?.activeMembers || 0;
  const inactive = directMembers - activeMembers;

  // Mock weekly growth data (from direct referrals joined dates)
  const getWeeklyGrowth = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = data?.directReferrals?.filter((r) => {
        const joinDate = new Date(r.joinedAt).toISOString().split('T')[0];
        return joinDate === dateStr;
      }).length || 0;
      days.push({ day: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()], count });
    }
    return days;
  };
  const weeklyGrowth = getWeeklyGrowth();
  const maxGrowth = Math.max(...weeklyGrowth.map(d => d.count), 1);

  // SVG graph points
  const graphWidth = 280;
  const graphHeight = 100;
  const padding = 10;
  const points = weeklyGrowth.map((d, i) => {
    const x = padding + (i / 6) * (graphWidth - padding * 2);
    const y = graphHeight - padding - (d.count / maxGrowth) * (graphHeight - padding * 2);
    return { x, y, count: d.count };
  });
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[6].x} ${graphHeight - padding} L ${points[0].x} ${graphHeight - padding} Z`;

  return (
    <div className="min-h-screen bg-[#070714] pb-24">
      <Navbar />

      <main className="max-w-lg mx-auto px-4 pt-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <img src="/assets/favicon/favicon-96x96.png" alt="FM" className="w-8 h-8 rounded-lg" />
          <h1 className="text-base font-bold text-white">Team Overview</h1>
        </div>

        {/* ─── 4 Stat Cards ─── */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-xl bg-dark-800/60 border border-dark-600/60 p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <RiUserFollowLine className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500">Direct Members</p>
              <p className="text-xl font-bold text-white">{directMembers}</p>
            </div>
          </div>
          <div className="rounded-xl bg-dark-800/60 border border-dark-600/60 p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <RiTeamFill className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500">Total Team</p>
              <p className="text-xl font-bold text-white">{totalTeam}</p>
            </div>
          </div>
          <div className="rounded-xl bg-dark-800/60 border border-dark-600/60 p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-yellow-500/15 flex items-center justify-center">
              <RiFlashlightFill className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500">Active Today</p>
              <p className="text-xl font-bold text-white">{activeMembers}</p>
            </div>
          </div>
          <div className="rounded-xl bg-dark-800/60 border border-dark-600/60 p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-500/15 flex items-center justify-center">
              <RiUserUnfollowLine className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500">Inactive</p>
              <p className="text-xl font-bold text-white">{inactive < 0 ? 0 : inactive}</p>
            </div>
          </div>
        </div>

        {/* ─── Team Growth Graph ─── */}
        <div className="rounded-2xl border border-dark-600/60 bg-dark-800/50 p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-white">Team Growth</p>
            <span className="text-[10px] text-slate-400">This Week</span>
          </div>

          <svg viewBox={`0 0 ${graphWidth} ${graphHeight + 20}`} className="w-full h-auto">
            {/* Grid lines */}
            {[0, 1, 2, 3].map((i) => (
              <line key={i} x1={padding} y1={padding + i * ((graphHeight - padding * 2) / 3)}
                x2={graphWidth - padding} y2={padding + i * ((graphHeight - padding * 2) / 3)}
                stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
            ))}

            {/* Area fill */}
            <path d={areaPath} fill="url(#graphGradient)" opacity="0.3" />

            {/* Line */}
            <path d={linePath} fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

            {/* Dots */}
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="4" fill="#a855f7" stroke="#070714" strokeWidth="2" />
                {p.count > 0 && (
                  <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#a855f7" fontSize="8" fontWeight="bold">{p.count}</text>
                )}
              </g>
            ))}

            {/* Day labels */}
            {weeklyGrowth.map((d, i) => (
              <text key={i} x={padding + (i / 6) * (graphWidth - padding * 2)} y={graphHeight + 14}
                textAnchor="middle" fill="#64748b" fontSize="8">{d.day}</text>
            ))}

            {/* Gradient definition */}
            <defs>
              <linearGradient id="graphGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* ─── Referral Code + QR ─── */}
        <div className="rounded-2xl border border-dark-600/60 bg-dark-800/50 p-4 mb-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] text-slate-500 mb-1">Referral Code</p>
              <p className="text-2xl font-bold text-white font-mono tracking-wider">{user?.referralCode}</p>
            </div>
            {/* QR Code */}
            <div className="bg-white p-1.5 rounded-lg">
              <QRCodeSVG value={referralLink} size={70} level="M" />
            </div>
          </div>

          {/* Attractive info text */}
          <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
            Share your code with friends & family. When they join and watch daily ads, you earn <span className="text-purple-400 font-medium">20% commission</span> on their earnings automatically.
          </p>

          {/* Copy Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={copyLink}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-xs font-medium hover:bg-cyan-500/20 transition-all">
              <RiFileCopyLine className="w-3.5 h-3.5" /> Copy Link
            </button>
            <button onClick={copyCode}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-400 text-xs font-medium hover:bg-purple-500/20 transition-all">
              <RiFileCopyLine className="w-3.5 h-3.5" /> Copy Code
            </button>
          </div>
        </div>

        {/* ─── Share Your Link ─── */}
        <div className="rounded-2xl border border-dark-600/60 bg-dark-800/50 p-4 mb-5">
          <p className="text-sm font-semibold text-white mb-4">Share Your Link</p>
          <div className="flex items-center justify-around">
            <button onClick={shareWhatsApp} className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center shadow-[0_0_12px_rgba(37,211,102,0.3)]">
                <RiWhatsappFill className="w-6 h-6 text-white" />
              </div>
              <span className="text-[9px] text-slate-400">WhatsApp</span>
            </button>
            <button onClick={shareTelegram} className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-full bg-[#0088cc] flex items-center justify-center shadow-[0_0_12px_rgba(0,136,204,0.3)]">
                <RiTelegramFill className="w-6 h-6 text-white" />
              </div>
              <span className="text-[9px] text-slate-400">Telegram</span>
            </button>
            <button onClick={shareTwitter} className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-full bg-[#1DA1F2] flex items-center justify-center shadow-[0_0_12px_rgba(29,161,242,0.3)]">
                <RiTwitterXFill className="w-6 h-6 text-white" />
              </div>
              <span className="text-[9px] text-slate-400">Twitter</span>
            </button>
            <button onClick={shareFacebook} className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center shadow-[0_0_12px_rgba(24,119,242,0.3)]">
                <RiFacebookCircleFill className="w-6 h-6 text-white" />
              </div>
              <span className="text-[9px] text-slate-400">Facebook</span>
            </button>
          </div>
        </div>

        {/* ─── Commission Info ─── */}
        <div className="rounded-2xl border border-dark-600/60 bg-dark-800/50 p-4">
          <p className="text-sm font-semibold text-white mb-3">Commission Structure</p>
          <p className="text-[10px] text-slate-400 mb-3">Earn % when your team watches daily ads:</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-dark-700/50 rounded-lg py-2 border border-purple-500/10">
              <p className="text-xs font-bold text-purple-400">20%</p>
              <p className="text-[8px] text-slate-500">L1</p>
            </div>
            <div className="bg-dark-700/50 rounded-lg py-2 border border-blue-500/10">
              <p className="text-xs font-bold text-blue-400">10%</p>
              <p className="text-[8px] text-slate-500">L2</p>
            </div>
            <div className="bg-dark-700/50 rounded-lg py-2 border border-cyan-500/10">
              <p className="text-xs font-bold text-cyan-400">5%</p>
              <p className="text-[8px] text-slate-500">L3-5</p>
            </div>
            <div className="bg-dark-700/50 rounded-lg py-2 border border-slate-500/10">
              <p className="text-xs font-bold text-slate-300">1%</p>
              <p className="text-[8px] text-slate-500">L6-15</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
