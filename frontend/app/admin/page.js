'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import AdminLayout from './AdminLayout';
import { Users, Coins, ArrowDownCircle, TrendingUp, UserPlus, DollarSign, AlertTriangle, Shield, ShieldOff } from 'lucide-react';

export default function AdminDashboard() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

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

  const fetchMaintenanceStatus = async () => {
    try {
      const r = await adminAPI.getMaintenanceStatus();
      setMaintenance(r.data?.data?.maintenance || false);
    } catch (_) {}
  };

  const handleToggleMaintenance = async () => {
    setMaintenanceLoading(true);
    try {
      const r = await adminAPI.toggleMaintenance();
      setMaintenance(r.data?.data?.maintenance || false);
    } catch (_) {
      alert('Failed to toggle maintenance mode');
    } finally {
      setMaintenanceLoading(false);
    }
  };

  useEffect(() => { fetchReports(); fetchMaintenanceStatus(); }, []);

  const stats = reports ? [
    { label: 'Total Users', value: reports.totalUsers?.toLocaleString(), icon: Users, color: 'text-blue-400' },
    { label: 'Verified Users', value: reports.verifiedUsers?.toLocaleString(), icon: UserPlus, color: 'text-emerald-400' },
    { label: 'New Today', value: reports.newUsersToday?.toLocaleString(), icon: TrendingUp, color: 'text-purple-400' },
    { label: 'Active Today', value: reports.activeToday?.toLocaleString() || '0', icon: Users, color: 'text-cyan-400' },
    { label: 'NFT Minted', value: reports.totalNFTMinted?.toLocaleString(), icon: Coins, color: 'text-primary-400' },
    { label: 'NFT Price', value: `$${reports.currentNFTPrice}`, icon: DollarSign, color: 'text-yellow-400' },
    { label: 'FM Minted', value: reports.totalFMMinted?.toLocaleString() || '0', icon: Coins, color: 'text-orange-400' },
    { label: 'Internal USDT', value: `$${(reports.totalInternalUSDT || 0).toFixed(2)}`, icon: DollarSign, color: 'text-emerald-400' },
    { label: 'USDT Withdrawn', value: `$${(reports.totalUSDTWithdrawn || 0).toFixed(2)}`, icon: ArrowDownCircle, color: 'text-red-400' },
    { label: 'Pending Withdrawals', value: reports.totalWithdrawals?.toLocaleString(), icon: ArrowDownCircle, color: 'text-yellow-400' },
  ] : [];

  return (
    <AdminLayout currentPage="dashboard">
      <h1 className="page-title">Admin Dashboard</h1>

      {/* Maintenance Mode Toggle */}
      <div className={`card mb-6 border ${maintenance ? 'border-red-500/50 bg-red-950/20' : 'border-emerald-500/30 bg-emerald-950/10'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {maintenance ? <ShieldOff className="w-6 h-6 text-red-400" /> : <Shield className="w-6 h-6 text-emerald-400" />}
            <div>
              <p className="text-white font-semibold">Maintenance Mode</p>
              <p className="text-slate-400 text-sm">
                {maintenance ? 'Site is DOWN — users see maintenance page' : 'Site is LIVE — users can access normally'}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleMaintenance}
            disabled={maintenanceLoading}
            className={`px-5 py-2 rounded-lg font-medium text-sm transition-all ${
              maintenance
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-red-600 hover:bg-red-500 text-white'
            } disabled:opacity-50`}
          >
            {maintenanceLoading ? 'Switching...' : maintenance ? 'Turn OFF' : 'Turn ON'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(7).fill(0).map((_, i) => (
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
        </div>
      )}
    </AdminLayout>
  );
}
