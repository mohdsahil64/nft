'use client';
import { useState, useEffect } from 'react';
import { nftAPI } from '../../../lib/api';
import AdminLayout from '../AdminLayout';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import { Coins, TrendingUp, Package, DollarSign } from 'lucide-react';

export default function AdminNFTPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    nftAPI.getStats()
      .then((r) => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <AdminLayout currentPage="nft"><div className="flex items-center justify-center h-64"><LoadingSpinner size="xl" /></div></AdminLayout>;
  }

  const mintPercent = stats ? ((stats.totalMinted / stats.totalSupply) * 100).toFixed(2) : 0;

  return (
    <AdminLayout currentPage="nft">
      <h1 className="page-title">NFT Overview</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Total Minted', value: stats?.totalMinted?.toLocaleString(), icon: Coins, color: 'text-primary-400', bg: 'bg-primary-600/15' },
          { label: 'Total Supply', value: stats?.totalSupply?.toLocaleString(), icon: Package, color: 'text-white', bg: 'bg-dark-600' },
          { label: 'Remaining', value: stats?.remaining?.toLocaleString(), icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-600/15' },
          { label: 'Current Price', value: `$${stats?.currentPrice}`, icon: DollarSign, color: 'text-yellow-400', bg: 'bg-yellow-600/15' },
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
          <span className="text-sm font-bold text-primary-400">{mintPercent}%</span>
        </div>
        <div className="w-full bg-dark-700 rounded-full h-3 sm:h-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-primary-600 to-purple-600 h-full rounded-full transition-all"
            style={{ width: `${Math.min(mintPercent, 100)}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {stats?.totalMinted?.toLocaleString()} / {stats?.totalSupply?.toLocaleString()} minted
        </p>
      </div>

      {/* Price Schedule */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4">Price Schedule</h2>
        <div className="space-y-2">
          {stats?.priceRanges?.map((r, i) => {
            const active = stats.totalMinted >= r.from && stats.totalMinted <= r.to;
            return (
              <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${active ? 'bg-primary-900/20 border border-primary-700/30' : 'bg-dark-700'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? 'bg-primary-600/30' : 'bg-dark-600'}`}>
                    <span className={`text-xs font-bold ${active ? 'text-primary-400' : 'text-slate-500'}`}>{i + 1}</span>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${active ? 'text-white' : 'text-slate-400'}`}>
                      {r.from.toLocaleString()} — {r.to.toLocaleString()}
                    </p>
                    {active && <p className="text-xs text-primary-400">Current range</p>}
                  </div>
                </div>
                <span className={`text-sm font-bold ${active ? 'text-emerald-400' : 'text-slate-500'}`}>${r.price}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
