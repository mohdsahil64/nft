'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { adminAPI } from '../../lib/api';
import {
  LayoutDashboard, Users, Coins, ArrowDownCircle,
  GitBranch, Settings, LogOut, Menu, X, RefreshCw
} from 'lucide-react';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import toast from 'react-hot-toast';

const adminNavItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Withdrawals', href: '/admin/withdrawals', icon: ArrowDownCircle },
  { label: 'Referrals', href: '/admin/referrals', icon: GitBranch },
  { label: 'NFT', href: '/admin/nft', icon: Coins },
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
  const [loginStep, setLoginStep] = useState(1); // 1=credentials, 2=OTP
  const [otp, setOtp] = useState('');

  useEffect(() => {
    setIsClient(true);
    const token = typeof window !== 'undefined' && localStorage.getItem('adminToken');
    if (token) setAuthed(true);
  }, []);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const res = await adminAPI.login(loginForm);
      if (res.data.data?.requireOTP) {
        setLoginStep(2);
        toast.success('OTP sent to admin email');
      } else if (res.data.data?.token) {
        localStorage.setItem('adminToken', res.data.data.token);
        setAuthed(true);
        toast.success('Admin login successful');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length < 6) { toast.error('Enter 6-digit OTP'); return; }
    setLoginLoading(true);
    try {
      const res = await adminAPI.verifyLoginOTP({ email: loginForm.email, otp });
      localStorage.setItem('adminToken', res.data.data.token);
      setAuthed(true);
      toast.success('Admin login successful');
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await adminAPI.login(loginForm);
      toast.success('OTP resent');
    } catch (_) {
      toast.error('Failed to resend');
    }
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await adminAPI.logout().catch(() => {});
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
        <div className="card max-w-sm w-full">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">Admin Login</h1>
          
          {loginStep === 1 ? (
            <form onSubmit={handleAdminLogin}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="admin-email" className="label">Email</label>
                  <input id="admin-email" type="email" required value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="input-field" placeholder="admin@futuremintnft.com" autoComplete="username" />
                </div>
                <div>
                  <label htmlFor="admin-password" className="label">Password</label>
                  <input id="admin-password" type="password" required value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="input-field" placeholder="Password" autoComplete="current-password" />
                </div>
              </div>
              <button type="submit" disabled={loginLoading} className="btn-primary w-full mt-6">
                {loginLoading ? 'Verifying...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP}>
              <p className="text-sm text-slate-400 text-center mb-6">
                OTP sent to <span className="text-white font-medium">{loginForm.email}</span>
              </p>
              <div>
                <label htmlFor="admin-otp" className="label">Enter OTP</label>
                <input id="admin-otp" type="text" inputMode="numeric" maxLength={6} required
                  value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="input-field text-center text-2xl tracking-[0.5em] font-bold"
                  placeholder="••••••" autoFocus />
              </div>
              <button type="submit" disabled={loginLoading || otp.length < 6} className="btn-primary w-full mt-6">
                {loginLoading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <div className="flex items-center justify-between mt-4">
                <button type="button" onClick={() => { setLoginStep(1); setOtp(''); }}
                  className="text-sm text-slate-400 hover:text-white">← Back</button>
                <button type="button" onClick={handleResendOTP}
                  className="text-sm text-primary-400 hover:text-primary-300">Resend OTP</button>
              </div>
            </form>
          )}
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
