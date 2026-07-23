'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../../lib/api';
import AdminLayout from '../AdminLayout';
import { RefreshCw, ChevronLeft, ChevronRight, Copy, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminTransfersPage() {
  const [transfers, setTransfers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getTransfers({ page, limit: 10, dateFilter });
      setTransfers(res.data.data.transfers || []);
      setPagination(res.data.data.pagination || {});
    } catch (_) {
      toast.error('Failed to load transfers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransfers(); }, [page, dateFilter]);

  const statusIcon = (status) => {
    if (status === 'completed') return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    if (status === 'rejected' || status === 'cancelled') return <XCircle className="w-4 h-4 text-red-400" />;
    return <Clock className="w-4 h-4 text-yellow-400" />;
  };

  const statusColor = (status) => {
    if (status === 'completed') return 'text-emerald-400 bg-emerald-500/10';
    if (status === 'rejected' || status === 'cancelled') return 'text-red-400 bg-red-500/10';
    return 'text-yellow-400 bg-yellow-500/10';
  };

  return (
    <AdminLayout currentPage="transfers">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title mb-0">USDT Transfer History</h1>
          <p className="text-xs text-slate-500 mt-1">{pagination.total || 0} total transactions</p>
        </div>
        {/* Date Filter */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'today', label: 'Today' },
            { key: 'week', label: 'Week' },
            { key: 'month', label: 'Month' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => { setDateFilter(key); setPage(1); }}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                dateFilter === key ? 'bg-primary-600 text-white' : 'bg-dark-700 text-slate-400 hover:text-white'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Transfers List */}
      {loading ? (
        <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="card h-20 animate-pulse bg-dark-700" />)}</div>
      ) : transfers.length === 0 ? (
        <div className="card text-center py-16">
          <RefreshCw className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="text-slate-500">No transfers found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transfers.map((t) => (
            <div key={t._id} className="card">
              {/* Header row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {statusIcon(t.status)}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor(t.status)}`}>
                    {t.status?.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{new Date(t.createdAt).toLocaleString()}</p>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-xs">
                <div className="bg-dark-700 rounded-lg p-2.5">
                  <p className="text-slate-500 mb-0.5">User</p>
                  <p className="text-white font-medium truncate">{t.userId?.name || 'Unknown'}</p>
                  <p className="text-slate-500 text-[10px] truncate">{t.userId?.email}</p>
                </div>
                <div className="bg-dark-700 rounded-lg p-2.5">
                  <p className="text-slate-500 mb-0.5">Amount</p>
                  <p className="text-emerald-400 font-bold">${t.amount} USDT</p>
                  <p className="text-slate-500 text-[10px]">{t.network}</p>
                </div>
                <div className="bg-dark-700 rounded-lg p-2.5">
                  <p className="text-slate-500 mb-0.5">From</p>
                  <button onClick={() => { navigator.clipboard.writeText(t.fromAddress); toast.success('Copied!'); }}
                    className="flex items-center gap-1 text-slate-300 font-mono text-[10px] hover:text-primary-400 transition-colors truncate">
                    {t.fromAddress} <Copy className="w-3 h-3 flex-shrink-0" />
                  </button>
                </div>
                <div className="bg-dark-700 rounded-lg p-2.5">
                  <p className="text-slate-500 mb-0.5">To</p>
                  <button onClick={() => { navigator.clipboard.writeText(t.toAddress); toast.success('Copied!'); }}
                    className="flex items-center gap-1 text-slate-300 font-mono text-[10px] hover:text-primary-400 transition-colors truncate">
                    {t.toAddress} <Copy className="w-3 h-3 flex-shrink-0" />
                  </button>
                </div>
              </div>

              {/* TxHash */}
              {t.txHash && (
                <div className="bg-dark-700 rounded-lg p-2.5 mb-2">
                  <p className="text-slate-500 text-xs mb-0.5">Transaction Hash</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { navigator.clipboard.writeText(t.txHash); toast.success('TxHash copied!'); }}
                      className="flex items-center gap-1 text-cyan-400 font-mono text-[10px] hover:text-cyan-300 transition-colors truncate">
                      {t.txHash} <Copy className="w-3 h-3 flex-shrink-0" />
                    </button>
                    <a href={`${t.network === 'Polygon' ? 'https://polygonscan.com/tx/' : 'https://bscscan.com/tx/'}${t.txHash}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full hover:bg-emerald-500/20 transition-colors whitespace-nowrap flex-shrink-0">
                      Verify ↗
                    </a>
                  </div>
                </div>
              )}

              {/* Admin Note / Failure Reason */}
              {t.adminNote && (
                <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-2.5">
                  <p className="text-red-400 text-xs font-medium mb-0.5">Reason</p>
                  <p className="text-red-300 text-[11px]">{t.adminNote}</p>
                </div>
              )}

              {/* Completed date */}
              {t.completedAt && (
                <p className="text-[10px] text-slate-600 mt-2">Completed: {new Date(t.completedAt).toLocaleString()}</p>
              )}
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
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1 disabled:opacity-30">
              <ChevronLeft className="w-3 h-3" /> Prev
            </button>
            <button onClick={() => setPage(p => Math.min(pagination.pages, p+1))} disabled={page === pagination.pages}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1 disabled:opacity-30">
              Next <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
