'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Coins, ArrowDownCircle,
  GitBranch, Settings, LogOut, Menu, X, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import toast from 'react-hot-toast';
import { adminAPI } from '../../lib/api';

const adminNavItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'All Users', href: '/admin/users', icon: Users },
  { label: 'Withdrawals', href: '/admin/withdrawals', icon: ArrowDownCircle },
  { label: 'Admin Transfer', href: '/admin/transfers', icon: RefreshCw },
  { label: 'Users Swap History', href: '/admin/swaps', icon: RefreshCw },
  { label: 'NFT Market', href: '/admin/nft', icon: Coins },
  { label: 'FM Market', href: '/admin/fm', icon: Coins },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const token = typeof window !== 'undefined' && localStorage.getItem('adminToken');
    if (token) setAuthed(true);
  }, []);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    
    if (!loginForm.email || !loginForm.password) {
      toast.error('Please enter email and password');
      setLoginLoading(false);
      return;
    }

    try {
      const response = await adminAPI.login({ email: loginForm.email, password: loginForm.password });
      const token = response.data.data.token;
      localStorage.setItem('adminToken', token);
      setAuthed(true);
      toast.success('Admin login successful');
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Check your credentials.';
      toast.error(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    localStorage.removeItem('adminToken');
    setAuthed(false);
    toast.success('Logged out');
  };

  if (!isClient) {
    return null; // Prevent hydration mismatch
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4">
        {/* Ambient glow blobs */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-md">
          {/* Top brand strip */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <img src="/assets/favicon/favicon-96x96.png" alt="FutureMint" className="w-10 h-10 rounded-xl shadow-lg" />
            <span className="text-xl font-bold text-white tracking-tight">FutureMint</span>
          </div>

          {/* Card */}
          <div className="bg-dark-800/80 backdrop-blur-xl border border-dark-700/60 rounded-2xl shadow-2xl px-8 py-10">
            {/* Lock icon */}
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary-600/15 border border-primary-500/30 flex items-center justify-center">
                <svg className="w-7 h-7 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V7a4.5 4.5 0 00-9 0v3.5M5 10.5h14a1 1 0 011 1V20a1 1 0 01-1 1H5a1 1 0 01-1-1v-8.5a1 1 0 011-1z" />
                </svg>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white text-center mb-1">Control Panel</h1>
            <p className="text-slate-500 text-sm text-center mb-8">Restricted access — authorised personnel only</p>

            <form onSubmit={handleAdminLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="admin-email" className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                  Email address
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6.75L2.25 6.75" />
                    </svg>
                  </span>
                  <input
                    id="admin-email"
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="w-full bg-dark-900/70 border border-dark-600 hover:border-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/40 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                    placeholder="admin@example.com"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="admin-password" className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                    </svg>
                  </span>
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full bg-dark-900/70 border border-dark-600 hover:border-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/40 rounded-xl pl-10 pr-12 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full mt-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 text-sm transition-all duration-200 shadow-lg shadow-primary-900/40 flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Verifying…
                  </>
                ) : (
                  'Sign in to Panel'
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-700 mt-6">FutureMint · Secure Admin Access</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-dark-900">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-dark-800 border-r border-dark-700 flex flex-col transition-transform duration-300 ${menuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-5 border-b border-dark-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/assets/favicon/favicon-96x96.png" alt="FutureMint" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-white">Admin Panel</span>
          </div>
          <button onClick={() => setMenuOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {adminNavItems.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === href ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-dark-700">
          <button onClick={() => setShowLogoutConfirm(true)} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-900/20 transition-colors">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {menuOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMenuOpen(false)} />}

      {/* Main */}
      <div className="flex-1 lg:ml-60 flex flex-col">
        <header className="sticky top-0 z-30 bg-dark-800 border-b border-dark-700 px-4 sm:px-6 h-14 flex items-center justify-between">
          <button onClick={() => setMenuOpen(true)} className="lg:hidden text-slate-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="w-2 h-2 bg-emerald-400 rounded-full" />
            Admin
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Logout Confirmation */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Admin Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
