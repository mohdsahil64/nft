'use client';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { logout } from '../../store/slices/userSlice';
import { disconnectWallet } from '../../store/slices/walletSlice';
import { authAPI } from '../../lib/api';
import { RiHome5Fill, RiHome5Line, RiTeamFill, RiTeamLine, RiPlayCircleFill, RiPlayCircleLine, RiHistoryFill, RiHistoryLine, RiUser3Fill, RiUser3Line } from 'react-icons/ri';
import ConfirmDialog from './ConfirmDialog';
import toast from 'react-hot-toast';

const navItems = [
  { label: 'Home', href: '/dashboard', iconActive: RiHome5Fill, icon: RiHome5Line },
  { label: 'Team', href: '/dashboard/referrals', iconActive: RiTeamFill, icon: RiTeamLine },
  { label: 'Earn', href: '/tasks', iconActive: RiPlayCircleFill, icon: RiPlayCircleLine },
  { label: 'History', href: '/dashboard/transactions', iconActive: RiHistoryFill, icon: RiHistoryLine },
  { label: 'Profile', href: '/profile', iconActive: RiUser3Fill, icon: RiUser3Line },
];

export default function Navbar() {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useSelector((s) => s.user);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    try { await authAPI.logout(); } catch (_) {}
    dispatch(logout());
    dispatch(disconnectWallet());
    localStorage.removeItem('token');
    localStorage.removeItem('walletAddress');
    router.push('/');
    toast.success('Logged out');
  };

  if (!isAuthenticated) return null;

  return (
    <>
      {/* ─── Top Bar (minimal) ─── */}
      {/* No fixed header - logo/brand is part of page content, scrolls with page */}

      {/* ─── Bottom Tab Bar (mobile classic) ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a1a]/98 backdrop-blur-md border-t border-dark-700/60">
        <div className="max-w-lg mx-auto px-2">
          <div className="flex items-center justify-around py-2">
            {navItems.map(({ label, href, icon: Icon, iconActive: IconActive }) => {
              const isActive = pathname === href || pathname?.startsWith(href + '/');

              return (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center gap-0.5 px-2 py-1"
                >
                  {isActive ? (
                    <IconActive className="w-5 h-5 text-cyan-400" />
                  ) : (
                    <Icon className="w-5 h-5 text-slate-500" />
                  )}
                  <span className={`text-[9px] ${isActive ? 'text-cyan-400 font-medium' : 'text-slate-500'}`}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
        {/* Safe area for iPhones */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>

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
