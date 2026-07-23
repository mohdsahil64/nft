'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../../lib/api';
import AdminLayout from '../AdminLayout';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import { Coins, TrendingUp, DollarSign, Lock } from 'lucide-react';

export default function AdminFMPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getFMStats()
      .then((r) => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <AdminLayout currentPage="fm"><div className="flex items-center justify-center h-64"><LoadingSpinner size="xl" /></div></AdminLayout>;
  }

  const mintPercent = stats ? ((stats.totalMinted / stats.totalSupply) * 100).toFixed(2) : 0;

  return (
    <AdminLayout currentPage="fm">
      <h1 className="page-title">FM Token Market</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Total Minted', value: stats?.totalMinted?.toLocaleString(), icon: Coins, color: 'text-yellow-400', bg: 'bg-yellow-600/15' },
          { label: 'Total Supply', value: '21,000,000', icon: Coins, color: 'text-white', bg: 'bg-dark-600' },
          { label: 'Remaining', value: stats?.remaining?.toLocaleString(), icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-600/15' },
          { label: 'Listing Price', value: '$1.00', icon: DollarSign, color: 'text-cyan-400', bg: 'bg-cyan-600/15' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card">
            <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-lg sm:text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Minting Progress */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-white text-sm">Minting Progress</h2>
          <span className="text-sm font-bold text-yellow-400">{mintPercent}%</span>
        </div>
        <div className="w-full bg-dark-700 rounded-full h-3 sm:h-4 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full rounded-full transition-all"
            style={{ width: `${Math.min(mintPercent, 100)}%` }} />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {stats?.totalMinted?.toLocaleString()} / {stats?.totalSupply?.toLocaleString()} minted
        </p>
      </div>

      {/* Token Info */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4">Token Info</h2>
        <div className="space-y-2">
          {[
            { label: 'Lock Period', value: `${stats?.lockPeriodDays} Days` },
            { label: 'Daily Watch Reward', value: `${stats?.dailyWatchRewardFM} FM` },
            { label: 'Signup Bonus', value: `${stats?.signupBonusFM} FM` },
            { label: 'Total FM Held (Users)', value: `${stats?.totalFMHeld?.toLocaleString()} FM` },
            { label: 'Status', value: 'Locked — Coming Soon' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
              <span className="text-sm text-slate-400">{label}</span>
              <span className="text-sm text-white font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
