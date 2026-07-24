'use client';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { userAPI } from '../../lib/api';
import Navbar from '../../components/shared/Navbar';
import AdOverlay from '../../components/shared/AdOverlay';
import { RiPlayCircleFill, RiTimerFlashLine, RiFireFill, RiGift2Fill, RiCheckboxCircleFill, RiLock2Fill, RiInformationLine, RiTeamFill } from 'react-icons/ri';
import toast from 'react-hot-toast';
import FMCoinLogo, { FMIconSimple } from '../../components/FMCoinLogo';

export default function WatchEarnPage() {
  const router = useRouter();
  const { isAuthenticated, sessionChecked } = useSelector((s) => s.user);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAd, setShowAd] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (sessionChecked && !isAuthenticated) router.push('/');
  }, [sessionChecked, isAuthenticated, router]);

  const fetchStatus = async () => {
    try {
      const res = await userAPI.getWatchStatus();
      setStatus(res.data.data);
    } catch (err) {
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionChecked && isAuthenticated) fetchStatus();
  }, [sessionChecked, isAuthenticated]);

  const handleWatchClick = () => {
    if (status?.watchedToday) {
      toast.error('Already watched today! Come back tomorrow.');
      return;
    }
    setShowAd(true);
  };

  const handleAdComplete = async () => {
    setShowAd(false);
    setClaiming(true);
    try {
      const res = await userAPI.completeWatch();
      toast.success(res.data.message);
      fetchStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to claim reward');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070714]">
        <div className="relative"><div className="absolute inset-0 bg-purple-500/20 rounded-2xl blur-xl animate-pulse" /><img src="/assets/favicon/favicon-96x96.png" alt="" className="w-12 h-12 rounded-2xl relative animate-pulse" style={{animationDuration:"1.5s"}} /></div>
      </div>
    );
  }

  const streakDays = status?.streakDays || 0;
  const watchedToday = status?.watchedToday || false;
  const last7 = status?.last7Days || [];

  const streakMilestones = [
    { days: 7, nft: 10, fm: 5 },
    { days: 30, nft: 50, fm: 25 },
    { days: 90, nft: 150, fm: 100 },
  ];

  // Next reward calculation
  const getNextReward = () => {
    if (streakDays < 7) return { days: 7, nft: 10, fm: 5, remaining: 7 - streakDays };
    if (streakDays < 30) return { days: 30, nft: 50, fm: 25, remaining: 30 - streakDays };
    if (streakDays < 90) return { days: 90, nft: 150, fm: 100, remaining: 90 - streakDays };
    return null; // All achieved
  };
  const nextReward = getNextReward();

  return (
    <div className="min-h-screen bg-[#070714] pb-24">
      <Navbar />

      {showAd && (
        <AdOverlay
          onComplete={handleAdComplete}
          loading={claiming}
          buttonText="Claim Reward"
          loadingText="Claiming..."
        />
      )}

      <main className="max-w-lg mx-auto px-4 pt-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <img src="/assets/favicon/favicon-96x96.png" alt="FM" className="w-8 h-8 rounded-lg" />
          <div>
            <span className="font-bold text-white text-base">Watch & Earn</span>
            <p className="text-[10px] text-slate-500">Watch daily, earn rewards</p>
          </div>
        </div>

        {/* ─── Main Watch Card ─── */}
        <div className="rounded-2xl border border-purple-500/25 bg-gradient-to-br from-[#14082a] to-[#0c0c24] p-5 mb-4 relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-600/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-600/5 rounded-full blur-3xl" />

          <div className="relative">
            {/* Title */}
            <div className="flex items-center gap-2 mb-1">
              <RiPlayCircleFill className="w-5 h-5 text-purple-400" />
              <p className="text-sm font-bold text-white">Daily Watch Reward</p>
            </div>
            <p className="text-[11px] text-slate-400 mb-5 ml-7">Watch 1 video per day (15-20 seconds)</p>

            {/* Play button */}
            <div className="flex justify-center mb-5">
              <div className="relative">
                <div className="w-[85px] h-[85px] rounded-full bg-gradient-to-br from-purple-600/30 to-purple-800/20 border-2 border-purple-400/50 flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.2)]">
                  <RiPlayCircleFill className="w-10 h-10 text-purple-300" />
                </div>
                {!watchedToday && (
                  <div className="absolute inset-0 rounded-full border-2 border-purple-400/30 animate-ping" style={{ animationDuration: '2s' }} />
                )}
              </div>
            </div>

            {/* Reward display */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center gap-2.5 bg-dark-700/70 rounded-xl px-4 py-3 flex-1 border border-cyan-500/15">
                <img src="/assets/nftimg.avif" alt="NFT" className="w-8 h-8 rounded-lg" />
                <div>
                  <p className="text-base font-bold text-cyan-400">5 NFT</p>
                  <p className="text-[9px] text-slate-500">Per Day</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-dark-700/70 rounded-xl px-4 py-3 flex-1 border border-emerald-500/15">
                <FMCoinLogo size={32} />
                <div>
                  <p className="text-base font-bold text-emerald-400">1 FM</p>
                  <p className="text-[9px] text-slate-500">Per Day (Locked 180d)</p>
                </div>
              </div>
            </div>

            {/* Watch Button */}
            <button
              onClick={handleWatchClick}
              disabled={watchedToday || claiming}
              className={`w-full py-4 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 ${
                watchedToday
                  ? 'bg-dark-700/80 border border-emerald-500/30 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_25px_rgba(139,92,246,0.3)]'
              }`}
            >
              {claiming ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Claiming...</>
              ) : watchedToday ? (
                <><RiCheckboxCircleFill className="w-5 h-5 text-emerald-400" /> Done! Come Back Tomorrow</>
              ) : (
                <><RiPlayCircleFill className="w-5 h-5" /> Watch Video Now</>
              )}
            </button>

            {/* Videos left */}
            <div className="flex items-center justify-center gap-2 mt-3">
              <RiTimerFlashLine className="w-3.5 h-3.5 text-slate-500" />
              <p className="text-[11px] text-slate-400">
                Videos Left Today: <span className={`font-bold ${watchedToday ? 'text-slate-500' : 'text-white'}`}>{watchedToday ? '0' : '1'}</span> / 1
              </p>
            </div>
          </div>
        </div>

        {/* ─── 7-Day Streak ─── */}
        <div className="rounded-2xl border border-dark-600/60 bg-dark-800/50 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <RiFireFill className="w-4 h-4 text-orange-400" />
              <p className="text-xs font-semibold text-white">Streak Progress</p>
            </div>
            <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 rounded-full px-2.5 py-0.5">
              <RiFireFill className="w-3 h-3 text-orange-400" />
              <span className="text-[10px] font-bold text-orange-300">{streakDays}d</span>
            </div>
          </div>

          {/* Day circles */}
          <div className="flex items-center justify-between mb-3">
            {last7.map((day, i) => {
              const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              const dayLabel = dayNames[new Date(day.date).getDay()];
              const isToday = day.date === new Date().toISOString().split('T')[0];
              return (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                    day.watched
                      ? 'bg-gradient-to-br from-purple-500/30 to-purple-600/20 border-purple-400 shadow-[0_0_10px_rgba(139,92,246,0.25)]'
                      : isToday
                      ? 'bg-dark-700 border-cyan-400/60 shadow-[0_0_8px_rgba(0,200,255,0.15)]'
                      : 'bg-dark-800/50 border-dark-600/80'
                  }`}>
                    {day.watched ? (
                      <RiCheckboxCircleFill className="w-4.5 h-4.5 text-purple-400" />
                    ) : isToday ? (
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    ) : (
                      <span className="text-[9px] text-slate-600">{i + 1}</span>
                    )}
                  </div>
                  <span className={`text-[8px] font-medium ${
                    day.watched ? 'text-purple-400' : isToday ? 'text-cyan-400' : 'text-slate-600'
                  }`}>{dayLabel}</span>
                </div>
              );
            })}
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 bg-dark-700/40 rounded-lg px-3 py-2">
            <RiInformationLine className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
            <p className="text-[9px] text-slate-500">Watch every day to keep your streak. Miss 1 day and it resets to 0.</p>
          </div>
        </div>

        {/* ─── Next Reward ─── */}
        {nextReward && (
          <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-[#081a12] to-[#0c0c24] p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                <RiGift2Fill className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-white">Next Streak Reward</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {nextReward.remaining} day{nextReward.remaining !== 1 ? 's' : ''} to go → <span className="text-emerald-400 font-medium">{nextReward.days}-Day Milestone</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3 ml-[60px]">
              <div className="flex items-center gap-1.5">
                <img src="/assets/nftimg.avif" alt="NFT" className="w-4 h-4 rounded" />
                <span className="text-xs font-bold text-cyan-400">+{nextReward.nft} NFT</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FMIconSimple size={16} />
                <span className="text-xs font-bold text-emerald-400">+{nextReward.fm} FM</span>
              </div>
            </div>
            {/* Progress towards next milestone */}
            <div className="mt-3">
              <div className="w-full h-1.5 bg-dark-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all"
                  style={{ width: `${(streakDays / nextReward.days) * 100}%` }} />
              </div>
              <p className="text-[9px] text-slate-600 mt-1 text-right">{streakDays}/{nextReward.days} days</p>
            </div>
          </div>
        )}

        {/* ─── Streak Rewards Table ─── */}
        <div className="rounded-2xl border border-dark-600/60 bg-dark-800/50 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <RiGift2Fill className="w-4 h-4 text-purple-400" />
            <p className="text-xs font-semibold text-white">All Streak Rewards</p>
          </div>
          <div className="space-y-2">
            {streakMilestones.map(({ days, nft, fm }) => {
              const achieved = streakDays >= days;
              const isCurrent = nextReward?.days === days;
              return (
                <div key={days} className={`flex items-center justify-between px-3.5 py-3 rounded-xl border transition-all ${
                  achieved
                    ? 'bg-purple-500/10 border-purple-500/30'
                    : isCurrent
                    ? 'bg-dark-700/60 border-cyan-500/20'
                    : 'bg-dark-700/30 border-dark-600/40'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {achieved ? (
                      <RiCheckboxCircleFill className="w-5 h-5 text-purple-400" />
                    ) : isCurrent ? (
                      <RiGift2Fill className="w-5 h-5 text-cyan-400" />
                    ) : (
                      <RiLock2Fill className="w-5 h-5 text-slate-600" />
                    )}
                    <span className={`text-xs font-semibold ${
                      achieved ? 'text-purple-300' : isCurrent ? 'text-white' : 'text-slate-500'
                    }`}>{days} Days</span>
                    {isCurrent && <span className="text-[8px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded-full">NEXT</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <img src="/assets/nftimg.avif" alt="" className="w-3.5 h-3.5 rounded" />
                      <span className={`text-xs font-bold ${achieved ? 'text-cyan-400' : 'text-slate-400'}`}>{nft}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FMIconSimple size={14} />
                      <span className={`text-xs font-bold ${achieved ? 'text-emerald-400' : 'text-slate-400'}`}>{fm}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── How It Works ─── */}
        <div className="rounded-2xl border border-dark-600/60 bg-dark-800/50 p-4 mb-4">
          <p className="text-xs font-semibold text-white mb-3">How It Works</p>
          <div className="space-y-2.5">
            {[
              { step: '1', text: 'Tap "Watch Video Now" button', color: 'text-purple-400' },
              { step: '2', text: 'Watch the full video (15-20 sec)', color: 'text-blue-400' },
              { step: '3', text: 'Tap "Claim Reward" after video ends', color: 'text-cyan-400' },
              { step: '4', text: '5 NFT + 1 FM credited instantly', color: 'text-emerald-400' },
            ].map(({ step, text, color }) => (
              <div key={step} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full bg-dark-700 border border-dark-600 flex items-center justify-center flex-shrink-0`}>
                  <span className={`text-[10px] font-bold ${color}`}>{step}</span>
                </div>
                <p className="text-[11px] text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Referral Commission ─── */}
        <div className="rounded-2xl border border-dark-600/60 bg-dark-800/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <RiTeamFill className="w-4 h-4 text-purple-400" />
            <p className="text-xs font-semibold text-white">Referral Commission</p>
          </div>
          <p className="text-[10px] text-slate-400 mb-3">Earn when your team watches ads daily:</p>
          <div className="grid grid-cols-3 gap-2 text-center mb-2">
            <div className="bg-dark-700/50 rounded-lg py-2.5 border border-purple-500/10">
              <p className="text-xs font-bold text-purple-400">20%</p>
              <p className="text-[8px] text-slate-500 mt-0.5">Level 1</p>
            </div>
            <div className="bg-dark-700/50 rounded-lg py-2.5 border border-blue-500/10">
              <p className="text-xs font-bold text-blue-400">10%</p>
              <p className="text-[8px] text-slate-500 mt-0.5">Level 2</p>
            </div>
            <div className="bg-dark-700/50 rounded-lg py-2.5 border border-cyan-500/10">
              <p className="text-xs font-bold text-cyan-400">5%</p>
              <p className="text-[8px] text-slate-500 mt-0.5">Level 3-5</p>
            </div>
          </div>
          <p className="text-[9px] text-slate-600 text-center">Level 6-15: 1% each • Commission on daily watch only</p>
        </div>
      </main>
    </div>
  );
}
