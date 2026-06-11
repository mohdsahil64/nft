'use client';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { userAPI } from '../../../lib/api';
import Navbar from '../../../components/shared/Navbar';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import { ArrowUp, ArrowDown, Gift, Users, Star, ChevronLeft, ChevronRight } from 'lucide-react';

const typeConfig = {
  signup:      { label: 'Signup Bonus',  icon: Gift,  color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-700/30' },
  referral:    { label: 'Referral',      icon: Users, color: 'text-blue-400',   bg: 'bg-blue-900/20', border: 'border-blue-700/30' },
  team:        { label: 'Team Reward',   icon: Star,  color: 'text-purple-400', bg: 'bg-purple-900/20', border: 'border-purple-700/30' },
  withdrawal:  { label: 'Withdrawal',    icon: ArrowUp, color: 'text-red-400',  bg: 'bg-red-900/20', border: 'border-red-700/30' },
  admin_credit:{ label: 'Admin Credit',  icon: Gift,  color: 'text-emerald-400', bg: 'bg-emerald-900/20', border: 'border-emerald-700/30' },
  usdt_transfer:{ label: 'USDT Transfer', icon: ArrowUp, color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-700/30' },
};

export default function TransactionsPage() {
  const router = useRouter();
  const { isAuthenticated, sessionChecked } = useSelector((s) => s.user);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!sessionChecked) return;
    if (!isAuthenticated) { router.push('/'); return; }
    setLoading(true);
    userAPI.getTransactions({ page, limit: 20 })
      .then((r) => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionChecked, isAuthenticated, page, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="xl" /></div>;
  }

  return (
    <div className="min-h-screen pb-16">
      <Navbar />
      <main className="max-w-3xl mx-auto px-3 sm:px-6 pt-20 sm:pt-24">
        <h1 className="page-title">Transaction History</h1>

        {data?.transactions?.length === 0 ? (
          <div className="card text-center py-16">
            <ArrowDown className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-500">No transactions yet</p>
          </div>
        ) : (
          <>
            {/* Mobile-friendly card list */}
            <div className="space-y-3">
              {data?.transactions?.map((tx) => {
                const cfg = typeConfig[tx.type] || { label: tx.type, icon: Gift, color: 'text-white', bg: 'bg-dark-700', border: 'border-dark-600' };
                const Icon = cfg.icon;
                return (
                  <div key={tx._id} className={`p-3 sm:p-4 rounded-xl border ${cfg.border} ${cfg.bg}`}>
                    <div className="flex items-center gap-3">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg} border ${cfg.border}`}>
                        <Icon className={`w-5 h-5 ${cfg.color}`} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
                          <span className={`text-sm font-bold ${tx.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {tx.amount >= 0 ? '+' : ''}{tx.amount} NFT
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <p className="text-xs text-slate-500 truncate max-w-[200px]">
                            {tx.description || (tx.level ? `Level ${tx.level} referral` : '—')}
                          </p>
                          <span className="text-xs text-slate-500 flex-shrink-0">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {data?.pagination?.pages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-dark-700">
                <p className="text-xs sm:text-sm text-slate-400">
                  Page {data.pagination.page} of {data.pagination.pages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary flex items-center gap-1 text-xs sm:text-sm py-2 px-3"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))}
                    disabled={page === data.pagination.pages}
                    className="btn-secondary flex items-center gap-1 text-xs sm:text-sm py-2 px-3"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
