'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../../lib/api';
import AdminLayout from '../AdminLayout';
import { Send, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, ExternalLink, Ban } from 'lucide-react';
import toast from 'react-hot-toast';

const statusColors = {
  pending: { bg: 'bg-yellow-900/20', text: 'text-yellow-400', border: 'border-yellow-700/30', label: 'Pending' },
  completed: { bg: 'bg-emerald-900/20', text: 'text-emerald-400', border: 'border-emerald-700/30', label: 'Completed' },
  rejected: { bg: 'bg-red-900/20', text: 'text-red-400', border: 'border-red-700/30', label: 'Rejected' },
  cancelled: { bg: 'bg-slate-900/20', text: 'text-slate-400', border: 'border-slate-700/30', label: 'Cancelled' },
};

export default function AdminTransfersPage() {
  const [transfers, setTransfers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await adminAPI.getTransfers(params);
      setTransfers(res.data.data.transfers);
      setPagination(res.data.data.pagination);
    } catch (_) {
      toast.error('Failed to load transfers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransfers(); }, [page, statusFilter]);

  const handleCancel = async (id) => {
    try {
      await adminAPI.cancelTransfer(id);
      toast.success('Transfer request cancelled');
      fetchTransfers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const getExplorerUrl = (network, txHash) => {
    if (!txHash) return null;
    return network === 'Polygon'
      ? `https://polygonscan.com/tx/${txHash}`
      : `https://bscscan.com/tx/${txHash}`;
  };

  return (
    <AdminLayout currentPage="transfers">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title mb-0">Transfer History</h1>
          <p className="text-xs text-slate-500 mt-1">{pagination.total || 0} total transfers</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-field w-full sm:w-40"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => <div key={i} className="card h-28 animate-pulse bg-dark-700" />)}
        </div>
      ) : transfers.length === 0 ? (
        <div className="card text-center py-16">
          <Send className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="text-slate-500">No transfers found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transfers.map((t) => {
            const sc = statusColors[t.status] || statusColors.pending;
            const explorerUrl = getExplorerUrl(t.network, t.txHash);
            return (
              <div key={t._id} className={`bg-dark-800 rounded-xl border ${sc.border} p-4`}>
                {/* Row 1: User + Status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary-600/20 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-primary-400">
                        {t.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{t.userId?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{t.userId?.email}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text} border ${sc.border}`}>
                    {sc.label}
                  </span>
                </div>

                {/* Row 2: Transfer details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  <div className="bg-dark-700/70 rounded-lg px-3 py-2">
                    <p className="text-xs text-slate-500">Amount</p>
                    <p className="text-sm font-bold text-emerald-400">${t.amount} USDT</p>
                  </div>
                  <div className="bg-dark-700/70 rounded-lg px-3 py-2">
                    <p className="text-xs text-slate-500">Network</p>
                    <p className="text-sm font-medium text-white">{t.network}</p>
                  </div>
                  <div className="bg-dark-700/70 rounded-lg px-3 py-2">
                    <p className="text-xs text-slate-500">From</p>
                    <p className="text-xs font-mono text-slate-300">{t.fromAddress?.slice(0, 6)}...{t.fromAddress?.slice(-4)}</p>
                  </div>
                  <div className="bg-dark-700/70 rounded-lg px-3 py-2">
                    <p className="text-xs text-slate-500">To</p>
                    <p className="text-xs font-mono text-slate-300">{t.toAddress?.slice(0, 6)}...{t.toAddress?.slice(-4)}</p>
                  </div>
                </div>

                {/* Row 3: Date + TxHash + Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-dark-700">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>📅 {new Date(t.createdAt).toLocaleString()}</span>
                    {t.completedAt && <span>✅ {new Date(t.completedAt).toLocaleString()}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {explorerUrl && (
                      <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300">
                        <ExternalLink className="w-3 h-3" /> Tx
                      </a>
                    )}
                    {t.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(t._id)}
                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 px-2 py-1 bg-red-900/20 rounded-lg"
                      >
                        <Ban className="w-3 h-3" /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-dark-700">
          <p className="text-xs text-slate-400">Page {pagination.page}/{pagination.pages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1">
              <ChevronLeft className="w-3 h-3" /> Prev
            </button>
            <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1">
              Next <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
