'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../../lib/api';
import AdminLayout from '../AdminLayout';
import Modal from '../../../components/shared/Modal';
import ConfirmDialog from '../../../components/shared/ConfirmDialog';
import { CheckCircle, XCircle, ArrowDownCircle, Wallet, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [approveModal, setApproveModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [txHash, setTxHash] = useState('');
  const [processing, setProcessing] = useState(false);
  const [rejectConfirm, setRejectConfirm] = useState({ show: false, id: null });

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getWithdrawals({ status: statusFilter || undefined, page, limit: 20 });
      setWithdrawals(res.data.data.withdrawals);
      setPagination(res.data.data.pagination);
    } catch (_) {
      // Silently ignore background data loading errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWithdrawals(); }, [statusFilter, page]);

  const openApprove = (w) => { setSelected(w); setTxHash(''); setApproveModal(true); };

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await adminAPI.approveWithdrawal(selected._id, { txHash });
      toast.success('Withdrawal approved');
      setApproveModal(false);
      fetchWithdrawals();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setProcessing(false); }
  };

  const handleReject = async (id) => {
    setRejectConfirm({ show: false, id: null });
    try {
      await adminAPI.rejectWithdrawal(id, { adminNote: 'Rejected by admin' });
      toast.success('Withdrawal rejected & NFTs refunded');
      fetchWithdrawals();
    } catch (_) { toast.error('Failed to reject'); }
  };

  const statusColor = (s) => s === 'approved' ? 'badge-success' : s === 'rejected' ? 'badge-danger' : 'badge-warning';

  return (
    <AdminLayout currentPage="withdrawals">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title mb-0">Withdrawals</h1>
          <p className="text-xs text-slate-500 mt-1">{pagination.total || 0} total requests</p>
        </div>
        <div className="flex gap-2">
          {['pending', 'approved', 'rejected', ''].map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-dark-700 text-slate-400 hover:text-white'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Cards List */}
      {loading ? (
        <div className="space-y-3">{Array(4).fill(0).map((_, i) => <div key={i} className="card h-24 animate-pulse bg-dark-700" />)}</div>
      ) : withdrawals.length === 0 ? (
        <div className="card text-center py-16">
          <ArrowDownCircle className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="text-slate-500">No withdrawals found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {withdrawals.map((w) => (
            <div key={w._id} className="card">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-primary-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary-400">{w.userId?.name?.charAt(0)?.toUpperCase() || '?'}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{w.userId?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{w.userId?.email}</p>
                  </div>
                </div>
                <span className={`badge ${statusColor(w.status)}`}>{w.status}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-xs">
                <div className="bg-dark-700 rounded-lg p-2">
                  <p className="text-slate-500">Amount</p>
                  <p className="font-bold text-white">{w.amount} NFT</p>
                </div>
                <div className="bg-dark-700 rounded-lg p-2">
                  <p className="text-slate-500">Network</p>
                  <p className="text-white">{w.network}</p>
                </div>
                <div className="bg-dark-700 rounded-lg p-2">
                  <p className="text-slate-500">Wallet</p>
                  <p className="text-slate-300 font-mono truncate">{w.walletAddress?.slice(0, 10)}...</p>
                </div>
                <div className="bg-dark-700 rounded-lg p-2">
                  <p className="text-slate-500">Date</p>
                  <p className="text-slate-300">{new Date(w.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {w.txHash && (
                <p className="text-xs text-slate-500 mb-3">TxHash: <span className="font-mono text-slate-400">{w.txHash.slice(0, 20)}...</span></p>
              )}

              {w.status === 'pending' && (
                <div className="flex gap-2 pt-3 border-t border-dark-700">
                  <button onClick={() => openApprove(w)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900/30 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-900/50 transition-colors">
                    <CheckCircle className="w-3 h-3" /> Approve
                  </button>
                  <button onClick={() => setRejectConfirm({ show: true, id: w._id })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/30 text-red-400 rounded-lg text-xs font-medium hover:bg-red-900/50 transition-colors">
                    <XCircle className="w-3 h-3" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-dark-700">
          <p className="text-xs text-slate-400">Page {pagination.page}/{pagination.pages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn-secondary text-xs py-2 px-3 flex items-center gap-1"><ChevronLeft className="w-3 h-3" /> Prev</button>
            <button onClick={() => setPage(p => Math.min(pagination.pages, p+1))} disabled={page === pagination.pages} className="btn-secondary text-xs py-2 px-3 flex items-center gap-1">Next <ChevronRight className="w-3 h-3" /></button>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      <Modal isOpen={approveModal} onClose={() => setApproveModal(false)} title="Approve Withdrawal">
        <div className="space-y-4">
          <div className="bg-dark-700 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-slate-400">User</span><span className="text-white font-medium">{selected?.userId?.name}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-400">Amount</span><span className="text-white font-bold">{selected?.amount} NFT</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-400">Network</span><span className="text-white">{selected?.network}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-400">Wallet</span><span className="text-white font-mono text-xs">{selected?.walletAddress?.slice(0, 16)}...</span></div>
          </div>
          <div>
            <label className="label">Transaction Hash (optional)</label>
            <input type="text" value={txHash} onChange={(e) => setTxHash(e.target.value)} className="input-field font-mono text-sm" placeholder="0x..." />
          </div>
          <button onClick={handleApprove} disabled={processing} className="btn-success w-full">{processing ? 'Approving...' : 'Confirm Approval'}</button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={rejectConfirm.show} onClose={() => setRejectConfirm({ show: false, id: null })} onConfirm={() => handleReject(rejectConfirm.id)} title="Reject Withdrawal" message="NFTs will be refunded to the user's balance." confirmText="Reject" cancelText="Cancel" variant="danger" />
    </AdminLayout>
  );
}
