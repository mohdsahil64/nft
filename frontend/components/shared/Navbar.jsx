'use client';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { logout } from '../../store/slices/userSlice';
import { disconnectWallet } from '../../store/slices/walletSlice';
import { authAPI } from '../../lib/api';
import { truncateAddress } from '../../lib/web3';
import { LogOut, Menu, X, Wallet, LayoutDashboard, ArrowDownCircle, History, Users } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import toast from 'react-hot-toast';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Referrals', href: '/dashboard/referrals', icon: Users },
  { label: 'Withdraw', href: '/withdraw', icon: ArrowDownCircle },
  { label: 'Transactions', href: '/dashboard/transactions', icon: History },
];

export default function Navbar() {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useSelector((s) => s.user);
  const { address } = useSelector((s) => s.wallet);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    try { await authAPI.logout(); } catch (_) {}
    dispatch(logout());
    dispatch(disconnectWallet());
    localStorage.removeItem('token');
    localStorage.removeItem('walletAddress');
    router.push('/');
    toast.success('Logged out successfully');
  };

  if (!isAuthenticated) return null;

  return (
    <>
    <nav className="fixed top-0 left-0 right-0 z-40 bg-dark-800/90 backdrop-blur-md border-b border-dark-700">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/assets/favicon/favicon-96x96.png" alt="FutureMint" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-white text-xs sm:text-sm">FutureMint NFT</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === href
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-dark-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {address && (
              <div className="hidden sm:flex items-center gap-2 bg-dark-700 px-3 py-1.5 rounded-lg text-sm">
                <Wallet className="w-4 h-4 text-primary-400" />
                <span className="text-slate-300">{truncateAddress(address)}</span>
              </div>
            )}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors p-2"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 text-slate-400 hover:text-white"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-dark-700 bg-dark-800 px-4 py-3 space-y-1">
          {navItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === href
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          {address && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400">
              <Wallet className="w-4 h-4 text-primary-400" />
              {truncateAddress(address)}
            </div>
          )}
        </div>
      )}
    </nav>

      {/* Logout Confirmation */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Stay"
        variant="danger"
      />
    </>
  );
}
