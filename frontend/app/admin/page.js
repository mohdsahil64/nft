'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import AdminLayout from './AdminLayout';
import { Users, Coins, ArrowDownCircle, TrendingUp, UserPlus, DollarSign } from 'lucide-react';

export default function AdminDashboard() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getReports()
      .then((r) => setReports(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
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
          {Array(7).fill(0).map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-dark-700" />
          ))}
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
