'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../../lib/api';
import AdminLayout from '../AdminLayout';
import Modal from '../../../components/shared/Modal';
import ConfirmDialog from '../../../components/shared/ConfirmDialog';
import { Search, Ban, CheckCircle, Edit2, Users, ChevronLeft, ChevronRight, Coins, Wallet, Send, AlertTriangle, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [nftModal, setNftModal] = useState(false);
  const [nftAmount, setNftAmount] = useState('');
  const [nftNote, setNftNote] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [blockConfirm, setBlockConfirm] = useState({ show: false, id: null, blocked: false });

  // Transfer states
  const [transferModal, setTransferModal] = useState(false);
  const [transferUser, setTransferUser] = useState(null);
  const [transferAddress, setTransferAddress] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferConfirm, setTransferConfirm] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [adminWalletAddress, setAdminWalletAddress] = useState('');
  const [usdtLoading, setUsdtLoading] = useState(false);

  const fetchUsers = async (retryCount = 0) => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await adminAPI.getUsers({ page, limit: 20, search });
      if (!res.data?.data?.users) throw new Error('Invalid response');
      const sorted = [...res.data.data.users].sort((a, b) => parseFloat(b.walletUsdt || 0) - parseFloat(a.walletUsdt || 0));
      setUsers(sorted);
      setPagination(res.data.data.pagination);

      // Fetch real USDT balances in background
      fetchUsdtBalances(sorted);
    } catch (err) {
      if (retryCount < 4) {
        // Wait longer each retry: 1s, 2s, 3s, 4s
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));
        return fetchUsers(retryCount + 1);
      }
      // All retries failed
      console.error('Failed to load users after retries:', err.message);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsdtBalances = async (usersList) => {
    const walletsToFetch = usersList
      .filter((u) => u.walletAddress)
      .map((u) => ({ walletAddress: u.walletAddress, network: u.network || 'BSC' }));

    if (walletsToFetch.length === 0) return;

    setUsdtLoading(true);
    try {
      const res = await adminAPI.fetchUsdtBalances({ wallets: walletsToFetch });
      const balances = res.data.data.balances;

      setUsers((prev) => {
        const updated = prev.map((u) => {
          if (u.walletAddress && balances[u.walletAddress] !== undefined) {
            return { ...u, walletUsdt: balances[u.walletAddress] };
          }
          return u;
        });
        // Sort by USDT balance highest first (any network)
        return updated.sort((a, b) => parseFloat(b.walletUsdt || 0) - parseFloat(a.walletUsdt || 0));
      });
    } catch (_) {
      // Silently ignore - users are already shown with '0' USDT
    } finally {
      setUsdtLoading(false);
    }
  };

  // Fetch admin wallet address once on mount
  useEffect(() => {
    adminAPI.getSettings()
      .then((res) => setAdminWalletAddress(res.data.data.adminWalletAddress || ''))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchUsers(); }, [page, search]);

  const handleBlock = async (id) => {
    setBlockConfirm({ show: false, id: null, blocked: false });
    try {
      const res = await adminAPI.blockUser(id);
      toast.success(res.data.message);
      fetchUsers();
    } catch (_) { toast.error('Action failed'); }
  };

  const openNFTModal = (user) => {
    setSelectedUser(user);
    setNftAmount('');
    setNftNote('');
    setNftModal(true);
  };

  const handleAdjustNFT = async () => {
    if (!nftAmount) { toast.error('Enter amount'); return; }
    setAdjusting(true);
    try {
      await adminAPI.adjustNFTBalance(selectedUser._id, { amount: parseFloat(nftAmount), description: nftNote });
      toast.success('NFT balance adjusted');
      setNftModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setAdjusting(false);
    }
  };

  const openTransferModal = (user) => {
    setTransferUser(user);
    setTransferAddress(adminWalletAddress);
    setTransferAmount('');
    setTransferModal(true);
  };

  const handleTransferSubmit = () => {
    if (!transferAddress || !transferAddress.startsWith('0x') || transferAddress.length !== 42) {
      toast.error('Enter a valid wallet address (0x...)');
      return;
    }
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (parseFloat(transferAmount) > parseFloat(transferUser?.walletUsdt || 0)) {
      toast.error('Amount exceeds user wallet USDT balance');
      return;
    }
    // Show confirmation
    setTransferConfirm(true);
  };

  const handleTransferConfirm = async () => {
    setTransferConfirm(false);
    setTransferring(true);
    try {
      const res = await adminAPI.createTransferRequest({
        userId: transferUser._id,
        toAddress: transferAddress,
        amount: parseFloat(transferAmount),
      });
      toast.success(res.data.message || 'Transfer completed!');
      setTransferModal(false);
      fetchUsers(); // Refresh to show updated USDT balance
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transfer failed');
    } finally {
      setTransferring(false);
    }
  };

  return (
    <AdminLayout currentPage="users">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title mb-0">Users</h1>
          <p className="text-xs text-slate-500 mt-1">{pagination.total || 0} registered</p>
        </div>
        <div className="relative w-full sm:w-56">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, email, mobile..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-10 w-full"
          />
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="space-y-3">{Array(4).fill(0).map((_, i) => <div key={i} className="card h-32 animate-pulse bg-dark-700" />)}</div>
      ) : loadError ? (
        <div className="card text-center py-16">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
          <p className="text-white font-medium mb-1">Failed to load users</p>
          <p className="text-slate-500 text-sm mb-4">Server is slow or not responding. Try again.</p>
          <button onClick={() => fetchUsers()} className="btn-primary text-sm px-6">
            Retry
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="card text-center py-16">
          <Users className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="text-slate-500">No users found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u._id} className="bg-dark-800 rounded-xl border border-dark-700 p-4 hover:border-dark-600 transition-all">
              {/* Row 1: Avatar + Name + Status */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-primary-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-base font-bold text-primary-400">{u.name?.charAt(0)?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{u.name}</p>
                  <p className="text-xs text-slate-500 truncate">{u.email}</p>
                </div>
                {u.isBlocked
                  ? <span className="badge badge-danger text-xs">Blocked</span>
                  : u.isVerified
                  ? <span className="badge badge-success text-xs">Active</span>
                  : <span className="badge badge-warning text-xs">Pending</span>
                }
              </div>

              {/* Row 2: Mobile + NFT + USDT + Network */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <div className="bg-dark-700/70 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-500">Mobile</p>
                  <p className="text-sm font-medium text-white">{u.mobile}</p>
                </div>
                <div className="bg-dark-700/70 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-500">NFT Balance</p>
                  <p className="text-sm font-bold text-primary-400">{u.nftBalance?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-dark-700/70 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-500">Wallet USDT</p>
                  <p className="text-sm font-bold text-emerald-400">
                    {usdtLoading && parseFloat(u.walletUsdt || 0) === 0
                      ? <span className="inline-block animate-pulse">Loading...</span>
                      : `$${parseFloat(u.walletUsdt || 0).toFixed(2)}`
                    }
                  </p>
                </div>
                <div className="bg-dark-700/70 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-500">Network</p>
                  <p className="text-sm font-medium text-white">{u.network}</p>
                </div>
              </div>

              {/* Row 3: Phone + Wallet + Date */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mb-3">
              
                {u.walletAddress && (
                  <button
                    onClick={() => { navigator.clipboard.writeText(u.walletAddress); toast.success('Address copied!'); }}
                    className="flex items-center gap-1.5 font-mono hover:text-primary-400 transition-colors break-all text-left"
                    title="Click to copy"
                  >
                    🔗 <span className="break-all">{u.walletAddress}</span>
                    <Copy className="w-3 h-3 flex-shrink-0" />
                  </button>
                )}
                <span>📅 {new Date(u.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Row 4: Actions */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-dark-700">
                <button
                  onClick={() => openTransferModal(u)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-900/30 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-900/50 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" /> Transfer USDT
                </button>
                <button
                  onClick={() => openNFTModal(u)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-primary-900/30 text-primary-400 rounded-lg text-xs font-medium hover:bg-primary-900/50 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Adjust NFT
                </button>
                <button
                  onClick={() => setBlockConfirm({ show: true, id: u._id, blocked: u.isBlocked })}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    u.isBlocked
                      ? 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50'
                      : 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                  }`}
                >
                  {u.isBlocked ? <><CheckCircle className="w-3.5 h-3.5" /> Unblock</> : <><Ban className="w-3.5 h-3.5" /> Block</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-dark-700">
          <p className="text-xs text-slate-400">Page {pagination.page}/{pagination.pages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1"><ChevronLeft className="w-3 h-3" /> Prev</button>
            <button onClick={() => setPage(p => Math.min(pagination.pages, p+1))} disabled={page === pagination.pages}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1">Next <ChevronRight className="w-3 h-3" /></button>
          </div>
        </div>
      )}

      {/* NFT Adjust Modal */}
      <Modal isOpen={nftModal} onClose={() => setNftModal(false)} title={`Adjust NFT — ${selectedUser?.name}`}>
        <div className="space-y-4">
          <div className="bg-dark-700 rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600/20 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-primary-400">{selectedUser?.name?.charAt(0)?.toUpperCase()}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{selectedUser?.name}</p>
              <p className="text-xs text-slate-500">{selectedUser?.email}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Current</p>
              <p className="text-sm font-bold text-primary-400">{selectedUser?.nftBalance || 0} NFT</p>
            </div>
          </div>
          <div>
            <label className="label">Amount (+credit / -debit)</label>
            <input type="number" value={nftAmount} onChange={(e) => setNftAmount(e.target.value)}
              className="input-field" placeholder="e.g. 50 or -10" />
            <p className="text-xs text-slate-500 mt-1">+50 adds NFTs, -10 removes</p>
          </div>
          <div>
            <label className="label">Reason</label>
            <input type="text" value={nftNote} onChange={(e) => setNftNote(e.target.value)}
              className="input-field" placeholder="Bonus, correction, etc." />
          </div>
          <button onClick={handleAdjustNFT} disabled={adjusting} className="btn-primary w-full">
            {adjusting ? 'Adjusting...' : 'Apply Adjustment'}
          </button>
        </div>
      </Modal>

      {/* Block/Unblock Confirmation */}
      <ConfirmDialog
        isOpen={blockConfirm.show}
        onClose={() => setBlockConfirm({ show: false, id: null, blocked: false })}
        onConfirm={() => handleBlock(blockConfirm.id)}
        title={blockConfirm.blocked ? 'Unblock User' : 'Block User'}
        message={blockConfirm.blocked ? 'User will be able to login and use the platform again.' : 'User will be blocked. They cannot login or withdraw.'}
        confirmText={blockConfirm.blocked ? 'Unblock' : 'Block'}
        cancelText="Cancel"
        variant={blockConfirm.blocked ? 'primary' : 'danger'}
      />

      {/* Transfer USDT Modal */}
      <Modal isOpen={transferModal} onClose={() => setTransferModal(false)} title={`Transfer USDT — ${transferUser?.name}`}>
        <div className="space-y-4">
          {/* User info card */}
          <div className="bg-dark-700 rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600/20 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-emerald-400">{transferUser?.name?.charAt(0)?.toUpperCase()}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{transferUser?.name}</p>
              <p className="text-xs text-slate-500 font-mono">{transferUser?.walletAddress ? `${transferUser.walletAddress.slice(0, 10)}...${transferUser.walletAddress.slice(-6)}` : 'No wallet'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Available USDT</p>
              <p className="text-sm font-bold text-emerald-400">${parseFloat(transferUser?.walletUsdt || 0).toFixed(2)}</p>
            </div>
          </div>

          {/* Transfer form */}
          <div>
            <label className="label">Send to admin wallet</label>
            <input
              type="text"
              value={transferAddress}
              readOnly
              className="input-field font-mono text-xs opacity-80 cursor-not-allowed"
            />
            
          </div>
          <div>
            <label className="label">Amount (USDT)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              className="input-field"
              placeholder="0.00"
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-slate-500">Max: ${parseFloat(transferUser?.walletUsdt || 0).toFixed(2)}</p>
              <button
                type="button"
                onClick={() => setTransferAmount(parseFloat(transferUser?.walletUsdt || 0).toFixed(2))}
                className="text-xs text-primary-400 hover:text-primary-300"
              >
                Max
              </button>
            </div>
          </div>

          

          <button
            onClick={handleTransferSubmit}
            disabled={transferring}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {transferring ? 'Transferring...' : <><Send className="w-4 h-4" /> Transfer Now</>}
          </button>
        </div>
      </Modal>

      {/* Transfer Warning Confirmation */}
      <ConfirmDialog
        isOpen={transferConfirm}
        onClose={() => setTransferConfirm(false)}
        onConfirm={handleTransferConfirm}
        title="Confirm Transfer"
        message={`Transfer $${transferAmount} USDT from ${transferUser?.name} to ${transferAddress?.slice(0, 6)}...${transferAddress?.slice(-4)}?`}
        confirmText="Transfer"
        cancelText="Cancel"
        variant="danger"
      />
    </AdminLayout>
  );
}
