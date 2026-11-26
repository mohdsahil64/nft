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
      <div className="min-h-screen bg-dark-900 flex overflow-hidden">

        {/* ── Left panel (hidden on mobile) ── */}
        <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12"
          style={{ background: 'linear-gradient(145deg, #1e1b4b 0%, #0f172a 50%, #1a1035 100%)' }}>

          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

          {/* Glow orbs */}
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-600/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Brand */}
          <div className="relative flex items-center gap-3">
            <img src="/assets/favicon/favicon-96x96.png" alt="FutureMint" className="w-10 h-10 rounded-xl" />
            <span className="text-xl font-bold text-white tracking-tight">FutureMint</span>
          </div>

          {/* Centre copy */}
          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-primary-600/15 border border-primary-500/30 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-primary-300 tracking-wide uppercase">Secure Admin Portal</span>
            </div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Manage your<br />
              <span className="bg-gradient-to-r from-primary-400 to-violet-400 bg-clip-text text-transparent">
                platform
              </span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              Full control over users, withdrawals, transfers, NFT market and platform settings — all in one place.
            </p>
          </div>

          {/* Stats strip */}
          <div className="relative flex items-center gap-6">
            {[
              { label: 'Users', value: '2,800+' },
              { label: 'Networks', value: 'BSC & Polygon' },
              { label: 'Uptime', value: '99.9%' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-white font-bold text-lg">{value}</p>
                <p className="text-slate-500 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel (login form) ── */}
        <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative">

          {/* Mobile brand */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <img src="/assets/favicon/favicon-96x96.png" alt="FutureMint" className="w-9 h-9 rounded-xl" />
            <span className="text-lg font-bold text-white">FutureMint</span>
          </div>

          <div className="w-full max-w-sm">
            {/* Heading */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
              <p className="text-slate-500 text-sm">Sign in to access the control panel</p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-5">

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="admin-email" className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Email
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary-400 transition-colors">
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
                    className="w-full bg-dark-800 border border-dark-700 hover:border-dark-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-600 outline-none transition-all"
                    placeholder="admin@example.com"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="admin-password" className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Password
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary-400 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V7a4.5 4.5 0 00-9 0v3.5M5 10.5h14a1 1 0 011 1V20a1 1 0 01-1 1H5a1 1 0 01-1-1v-8.5a1 1 0 011-1z" />
                    </svg>
                  </span>
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 hover:border-dark-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 rounded-xl pl-11 pr-12 py-3.5 text-sm text-white placeholder-slate-600 outline-none transition-all"
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors"
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
                className="w-full mt-2 relative overflow-hidden bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3.5 text-sm transition-all duration-200 shadow-lg shadow-primary-900/50 flex items-center justify-center gap-2 group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-white/5 to-primary-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                {loginLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Verifying…
                  </>
                ) : (
                  <>
                    Sign in
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-xs text-slate-700 mt-10">
              Restricted access · FutureMint © {new Date().getFullYear()}
            </p>
          </div>
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
