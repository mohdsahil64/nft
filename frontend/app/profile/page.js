'use client';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '../../lib/api';
import { logout } from '../../store/slices/userSlice';
import { disconnectWallet } from '../../store/slices/walletSlice';
import Navbar from '../../components/shared/Navbar';
import { RiWallet3Line, RiArrowDownCircleLine, RiCoinLine, RiCustomerService2Line, RiInformationLine, RiLogoutBoxRLine, RiArrowRightSLine, RiVerifiedBadgeFill, RiSwapLine } from 'react-icons/ri';
import { truncateAddress } from '../../lib/web3';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, user, sessionChecked } = useSelector((s) => s.user);
  const { address } = useSelector((s) => s.wallet);
  const [showWallet, setShowWallet] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (sessionChecked && !isAuthenticated) router.push('/');
  }, [sessionChecked, isAuthenticated, router]);

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch (_) {}
    dispatch(logout());
    dispatch(disconnectWallet());
    localStorage.removeItem('token');
    localStorage.removeItem('walletAddress');
    router.push('/');
    toast.success('Logged out');
  };

  if (!sessionChecked || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070714]">
        <div className="relative"><div className="absolute inset-0 bg-purple-500/20 rounded-2xl blur-xl animate-pulse" /><img src="/assets/favicon/favicon-96x96.png" alt="" className="w-12 h-12 rounded-2xl relative animate-pulse" style={{animationDuration:"1.5s"}} /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070714] pb-24">
      <Navbar />

      {/* Wallet Popup */}
      {showWallet && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowWallet(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-dark-600 bg-[#0c0c24] p-6">
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center mx-auto mb-3">
                <RiWallet3Line className="w-7 h-7 text-purple-400" />
              </div>
              <p className="text-sm font-bold text-white">Connected Wallet</p>
            </div>
            <div className="bg-dark-800/70 rounded-xl border border-dark-600 p-4 mb-4">
              <p className="text-[10px] text-slate-500 mb-1">Address</p>
              <p className="text-xs text-white font-mono break-all">{address || user?.walletAddress || 'Not connected'}</p>
            </div>
            <div className="bg-dark-800/70 rounded-xl border border-dark-600 p-4 mb-5">
              <p className="text-[10px] text-slate-500 mb-1">Network</p>
              <p className="text-sm text-cyan-400 font-semibold">{user?.network || 'BSC'}</p>
            </div>
            <button onClick={() => setShowWallet(false)}
              className="w-full py-3 rounded-xl text-sm font-medium text-white bg-dark-700 border border-dark-600 hover:bg-dark-600 transition-colors">
              OK
            </button>
          </div>
        </div>
      )}

      <main className="max-w-lg mx-auto px-4 pt-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <img src="/assets/favicon/favicon-96x96.png" alt="FM" className="w-8 h-8 rounded-lg" />
          <h1 className="text-base font-bold text-white">Profile</h1>
        </div>

        {/* ─── User Card ─── */}
        <div className="rounded-2xl border border-dark-600/60 bg-dark-800/50 p-5 mb-5">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-[72px] h-[72px] rounded-full bg-white flex items-center justify-center flex-shrink-0 border-2 border-purple-500/30 p-1">
              <img src="/assets/avatar.png" alt="Avatar" className="w-full h-full rounded-full object-cover" />
            </div>
            {/* Info */}
            <div>
              <p className="text-lg font-bold text-white">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{user?.mobile?.startsWith('+') ? user.mobile : `+91${user?.mobile}`}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <RiVerifiedBadgeFill className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-medium">Verified User</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Menu Options ─── */}
        <div className="rounded-2xl border border-dark-600/60 bg-dark-800/50 overflow-hidden mb-5">
          {/* Connected Wallet */}
          <button onClick={() => setShowWallet(true)}
            className="w-full flex items-center justify-between px-4 py-4 border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <RiWallet3Line className="w-4.5 h-4.5 text-purple-400" />
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-white">Connected Wallet</p>
                <p className="text-[10px] text-slate-500 font-mono">{truncateAddress(address || user?.walletAddress, 6)}</p>
              </div>
            </div>
            <RiArrowRightSLine className="w-5 h-5 text-slate-600" />
          </button>

          {/* Withdrawal */}
          <Link href="/profile/swap"
            className="w-full flex items-center justify-between px-4 py-4 border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <RiSwapLine className="w-4.5 h-4.5 text-cyan-400" />
              </div>
              <p className="text-xs font-medium text-white">Swap NFT → USDT</p>
            </div>
            <RiArrowRightSLine className="w-5 h-5 text-slate-600" />
          </Link>

          {/* Withdrawal */}
          <Link href="/withdraw"
            className="w-full flex items-center justify-between px-4 py-4 border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <RiArrowDownCircleLine className="w-4.5 h-4.5 text-emerald-400" />
              </div>
              <p className="text-xs font-medium text-white">Withdrawal USDT</p>
            </div>
            <RiArrowRightSLine className="w-5 h-5 text-slate-600" />
          </Link>

          {/* FM Token Status */}
          <Link href="/profile/fm-status"
            className="w-full flex items-center justify-between px-4 py-4 border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <RiCoinLine className="w-4.5 h-4.5 text-yellow-400" />
              </div>
              <p className="text-xs font-medium text-white">FM Token Status</p>
            </div>
            <RiArrowRightSLine className="w-5 h-5 text-slate-600" />
          </Link>

          {/* Help & Support */}
          <Link href="/profile/support"
            className="w-full flex items-center justify-between px-4 py-4 border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <RiCustomerService2Line className="w-4.5 h-4.5 text-blue-400" />
              </div>
              <p className="text-xs font-medium text-white">Help & Support</p>
            </div>
            <RiArrowRightSLine className="w-5 h-5 text-slate-600" />
          </Link>

          {/* About */}
          <div className="flex items-center justify-between px-4 py-4 hover:bg-dark-700/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-500/10 flex items-center justify-center">
                <RiInformationLine className="w-4.5 h-4.5 text-slate-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-white">About FutureMint</p>
                <p className="text-[9px] text-slate-500">v1.0.0</p>
              </div>
            </div>
            <RiArrowRightSLine className="w-5 h-5 text-slate-600" />
          </div>
        </div>

        {/* Logout */}
        <button onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors">
          <RiLogoutBoxRLine className="w-5 h-5 text-red-400" />
          <span className="text-sm font-medium text-red-400">Log Out</span>
        </button>

        {/* Logout Confirmation Popup */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
            <div className="relative w-full max-w-xs rounded-2xl border border-dark-600 bg-[#0c0c24] p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center mx-auto mb-4">
                <RiLogoutBoxRLine className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Logout?</h3>
              <p className="text-xs text-slate-400 mb-6">Are you sure you want to logout from your FutureMint account?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-slate-300 bg-dark-700 border border-dark-600 hover:bg-dark-600 transition-colors">
                  Cancel
                </button>
                <button onClick={handleLogout}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-white bg-red-500/80 hover:bg-red-500 transition-colors">
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
