'use client';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/shared/Navbar';
import { RiArrowLeftSLine, RiTeamLine, RiUserLine, RiGiftLine, RiTimeLine } from 'react-icons/ri';
import { Trophy, Star, Zap } from 'lucide-react';

export default function OfferPage() {
  const router = useRouter();
  const { isAuthenticated, sessionChecked } = useSelector((s) => s.user);

  useEffect(() => {
    if (sessionChecked && !isAuthenticated) router.push('/');
  }, [sessionChecked, isAuthenticated, router]);

  const rewards = [
    {
      tier: 'Reward 1',
      icon: Star,
      color: 'cyan',
      borderColor: 'border-cyan-500/25',
      bgColor: 'from-[#030f1a] to-[#0a0a20]',
      glowColor: 'bg-cyan-500/8',
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10',
      targets: [
        { label: 'Direct Members', value: '50', icon: RiUserLine },
        { label: 'Total Team', value: '500', icon: RiTeamLine },
      ],
      nft: '5,000 NFT',
      fm: '5,000 FM',
      nftColor: 'text-cyan-400',
      fmColor: 'text-yellow-400',
    },
    {
      tier: 'Reward 2',
      icon: Trophy,
      color: 'purple',
      borderColor: 'border-purple-500/25',
      bgColor: 'from-[#0d0320] to-[#0a0a20]',
      glowColor: 'bg-purple-500/8',
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10',
      targets: [
        { label: 'Direct Members', value: '100', icon: RiUserLine },
        { label: 'Total Team', value: '1,000', icon: RiTeamLine },
      ],
      nft: '10,000 NFT',
      fm: '10,000 FM',
      nftColor: 'text-purple-400',
      fmColor: 'text-yellow-400',
    },
  ];

  return (
    <div className="min-h-screen bg-[#070714] pb-24">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 pt-4">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()}
            className="w-8 h-8 rounded-lg bg-dark-800 border border-dark-600 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <RiArrowLeftSLine className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-white">September Offer</h1>
            <p className="text-[10px] text-slate-500">Limited time — ends September 30</p>
          </div>
        </div>

        {/* ─── Hero Banner ─── */}
        <div className="relative rounded-2xl overflow-hidden mb-5 border border-dark-600/50">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0c0420] via-[#070714] to-[#040f1a]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
          <div className="absolute top-[-60px] left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-purple-600/10 rounded-full blur-[80px]" />

          <div className="relative z-10 px-6 py-7 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
              <RiTimeLine className="w-3 h-3 text-purple-400" />
              <span className="text-[10px] text-purple-300 font-medium uppercase tracking-wider">September Only</span>
            </div>
            <h2 className="text-2xl font-black text-white mb-2 leading-tight">
              Build Your Team.<br />
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Unlock Big Rewards.
              </span>
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed max-w-xs mx-auto">
              Grow your direct and team network this September and earn bonus NFT + FM tokens on top of your regular commissions.
            </p>
          </div>
        </div>

        {/* ─── Reward Cards ─── */}
        <div className="space-y-4 mb-5">
          {rewards.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.tier} className={`relative rounded-2xl border ${r.borderColor} overflow-hidden`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${r.bgColor}`} />
                <div className={`absolute top-0 right-0 w-[120px] h-[120px] ${r.glowColor} rounded-full blur-[40px]`} />

                <div className="relative z-10 p-5">
                  {/* Tier header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl ${r.iconBg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${r.iconColor}`} />
                      </div>
                      <span className={`text-sm font-bold ${r.iconColor}`}>{r.tier}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider border border-dark-600 px-2 py-0.5 rounded-full">Target</span>
                  </div>

                  {/* Targets */}
                  <div className="grid grid-cols-2 gap-2.5 mb-4">
                    {r.targets.map((t) => {
                      const TIcon = t.icon;
                      return (
                        <div key={t.label} className="bg-dark-800/60 border border-dark-600/40 rounded-xl p-3">
                          <TIcon className="w-3.5 h-3.5 text-slate-500 mb-1.5" />
                          <p className="text-lg font-black text-white leading-none">{t.value}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">{t.label}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-dark-600/50 mb-4" />

                  {/* Reward */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <RiGiftLine className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] text-slate-400">You receive</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`text-sm font-black ${r.nftColor}`}>{r.nft}</p>
                      </div>
                      <div className="w-px h-5 bg-dark-600" />
                      <div className="text-right">
                        <p className={`text-sm font-black ${r.fmColor}`}>{r.fm}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Bottom Note ─── */}
        <div className="rounded-2xl border border-dark-600/40 bg-dark-800/30 p-4">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white mb-1">How it works</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Reach the target by September 30. Direct members are people you personally refer. Team members include your entire downline network across all levels. Rewards are credited manually — contact support after hitting your target.
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
