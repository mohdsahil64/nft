'use client';
import { useState } from 'react';
import { adminAPI } from '../../../lib/api';
import AdminLayout from '../AdminLayout';
import { Search, Users, GitBranch, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminReferralsPage() {
  const [userId, setUserId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!userId.trim()) return;
    setLoading(true);
    try {
      const res = await adminAPI.getReferralTree(userId.trim());
      setData(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'User not found');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout currentPage="referrals">
      <h1 className="page-title">Referral Tree</h1>

      {/* Search */}
      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter User ID..."
              className="input-field pl-10"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2">
            <Search className="w-4 h-4" />
            {loading ? 'Searching...' : 'View Tree'}
          </button>
        </form>
      </div>

      {!data && !loading && (
        <div className="card text-center py-16">
          <GitBranch className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="text-slate-500 text-sm">Enter a User ID to view their referral tree</p>
        </div>
      )}

      {data && (
        <>
          {/* User Info Card */}
          <div className="card mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary-600/20 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-primary-400">{data.user?.name?.charAt(0)?.toUpperCase()}</span>
              </div>
              <div>
                <p className="font-semibold text-white">{data.user?.name}</p>
                <p className="text-xs text-slate-500">{data.user?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-dark-700 rounded-xl p-3 text-center">
                <p className="text-xl sm:text-2xl font-bold text-primary-400">{data.teamSize}</p>
                <p className="text-xs text-slate-400 mt-1">Total Team</p>
              </div>
              <div className="bg-dark-700 rounded-xl p-3 text-center">
                <p className="text-xl sm:text-2xl font-bold text-emerald-400">{data.directReferrals?.length || 0}</p>
                <p className="text-xs text-slate-400 mt-1">Direct</p>
              </div>
              <div className="bg-dark-700 rounded-xl p-3 text-center">
                <p className="text-base font-bold text-white font-mono">{data.user?.referralCode}</p>
                <p className="text-xs text-slate-400 mt-1">Code</p>
              </div>
            </div>
          </div>

          {/* Level-wise Grid */}
          <div className="card mb-6">
            <h2 className="font-semibold text-white mb-4">Level Breakdown</h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {data.levelWise?.map((row) => (
                <div key={row.level} className={`rounded-xl p-3 text-center ${row.count > 0 ? 'bg-primary-900/20 border border-primary-700/30' : 'bg-dark-700'}`}>
                  <p className={`text-xs font-bold ${row.count > 0 ? 'text-primary-400' : 'text-slate-600'}`}>L{row.level}</p>
                  <p className={`text-lg font-bold ${row.count > 0 ? 'text-white' : 'text-slate-600'}`}>{row.count}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Direct Referrals */}
          <div className="card">
            <h2 className="font-semibold text-white mb-4">Direct Referrals</h2>
            {data.directReferrals?.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No direct referrals</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.directReferrals?.map((ref) => (
                  <div key={ref._id} className="flex items-center gap-3 p-3 bg-dark-700 rounded-xl">
                    <div className="w-9 h-9 bg-primary-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary-400">{ref.userId?.name?.charAt(0)?.toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{ref.userId?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{ref.userId?.email}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {ref.userId?.isVerified
                        ? <span className="inline-flex items-center gap-1 text-xs text-emerald-400"><CheckCircle className="w-3 h-3" /> Active</span>
                        : <span className="inline-flex items-center gap-1 text-xs text-yellow-400"><XCircle className="w-3 h-3" /> Pending</span>}
                      <p className="text-xs text-slate-600 mt-0.5">{new Date(ref.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
