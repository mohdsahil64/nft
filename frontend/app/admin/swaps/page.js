'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../../lib/api';
import AdminLayout from '../AdminLayout';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSwapHistory() {
  const [swaps, setSwaps] = useState([]);
  const [pagination, setPagination] = useState({});
  const [totalSwappedNFT, setTotalSwappedNFT] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchSwaps = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getSwapHistory({ page });
      setSwaps(res.data.data.swaps || []);
      setPagination(res.data.data.pagination || {});
      setTotalSwappedNFT(res.data.data.totalSwappedNFT || 0);
    } catch (_) {
      toast.error('Failed to load swap history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSwaps(); }, [page]);

  return (
    <AdminLayout currentPage="swaps">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title mb-0">Swap History</h1>
          <p className="text-xs text-slate-500 mt-1">{pagination.total || 0} total swaps</p>
        </div>
        <div className="flex gap-3 text-xs">
          <div className="bg-dark-700 rounded-lg px-3 py-2">
            <p className="text-slate-500">Total NFT Swapped</p>
            <p className="font-bold text-primary-400">{totalSwappedNFT.toLocaleString()}</p>
          </div>
          <div className="bg-dark-700 rounded-lg px-3 py-2">
            <p className="text-slate-500">Commission (5%)</p>
            <p className="font-bold text-emerald-400">{(totalSwappedNFT * 0.05).toLocaleString()} NFT</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="card h-16 animate-pulse bg-dark-700" />)}</div>
      ) : swaps.length === 0 ? (
        <div className="card text-center py-16">
          <RefreshCw className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="text-slate-500">No swaps yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {swaps.map((s) => (
            <div key={s._id} className="card flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-cyan-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{s.userId?.name || 'Unknown'}</p>
                  <p className="text-xs text-slate-500 truncate">{s.userId?.email}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-red-400">{s.amount} NFT</p>
                <p className="text-[10px] text-slate-500">{s.description?.match(/→ \$[\d.]+/)?.[0] || ''}</p>
                <p className="text-[10px] text-slate-600">{new Date(s.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-dark-700">
          <p className="text-xs text-slate-400">Page {page}/{pagination.pages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1"><ChevronLeft className="w-3 h-3" /> Prev</button>
            <button onClick={() => setPage(p => Math.min(pagination.pages, p+1))} disabled={page === pagination.pages}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1">Next <ChevronRight className="w-3 h-3" /></button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
