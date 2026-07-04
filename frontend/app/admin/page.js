'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import AdminLayout from './AdminLayout';
import { Users, Coins, ArrowDownCircle, TrendingUp, UserPlus, DollarSign, AlertTriangle, Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [totalUsdt, setTotalUsdt] = useState(null);
  const [usdtLoading, setUsdtLoading] = useState(true);

  const fetchReports = async (retryCount = 0) => {
    setLoading(true);
    setLoadError(false);
    try {
      const r = await adminAPI.getReports();
      if (!r.data?.data) throw new Error('Invalid response');
      setReports(r.data.data);
    } catch (_) {
      if (retryCount < 4) {
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));
        return fetchReports(retryCount + 1);
      }
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalUsdt = async () => {
    setUsdtLoading(true);
    try {
      const res = await adminAPI.getTotalUsdt();
      setTotalUsdt(res.data.data.totalUsdt);
    } catch (_) {
      setTotalUsdt(0);
    } finally {
      setUsdtLoading(false);
    }
  };

  // Call both independently on mount
  useEffect(() => {
    fetchReports();
    fetchTotalUsdt();
  }, []);

  const stats = reports ? [
    { label: 'Total Users', value: reports.totalUsers?.toLocaleString(), icon: Users, color: 'text-blue-400' },
    { label: 'Verified Users', value: reports.verifiedUsers?.toLocaleString(), icon: UserPlus, color: 'text-emerald-400' },
    { label: 'New Users Today', value: reports.newUsersToday?.toLocaleString(), icon: TrendingUp, color: 'text-purple-400' },
    { label: 'Total NFT Minted', value: reports.totalNFTMinted?.toLocaleString(), icon: Coins, color: 'text-primary-400' },
    { label: 'Current NFT Price', value: `$${reports.currentNFTPrice}`, icon: DollarSign, color: 'text-yellow-400' },
    { label: 'Total Withdrawals', value: reports.totalWithdrawals?.toLocaleString(), icon: ArrowDownCircle, color: 'text-red-400' },
    { label: 'Total NFT Withdrawn', value: reports.totalNFTWithdrawn?.toLocaleString(), icon: ArrowDownCircle, color: 'text-orange-400' },
  ] : [];

  return (
    <AdminLayout currentPage="dashboard">
      <h1 className="page-title">Admin Dashboard</h1>
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-dark-700" />
          ))}
        </div>
      ) : loadError ? (
        <div className="card text-center py-16">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
          <p className="text-white font-medium mb-1">Failed to load reports</p>
          <p className="text-slate-500 text-sm mb-4">Server is slow or not responding.</p>
          <button onClick={() => fetchReports()} className="btn-primary text-sm px-6">
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="stat-card">
              <Icon className={`w-7 h-7 ${color}`} />
              <div className="stat-value mt-2">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}

          {/* Total USDT Widget — independent loading */}
          <div className="stat-card">
            <DollarSign className="w-7 h-7 text-emerald-400" />
            <div className="stat-value mt-2">
              {usdtLoading ? (
                <span className="flex items-center gap-2 text-slate-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Calculating...
                </span>
              ) : (
                `$${parseFloat(totalUsdt || 0).toFixed(2)}`
              )}
            </div>
            <div className="stat-label">Total Users USDT</div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
