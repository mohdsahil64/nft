'use client';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '../../../lib/api';
import OTPInput from '../../../components/shared/OTPInput';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import { RiMailLine, RiLockLine } from 'react-icons/ri';
import { Eye, EyeOff, CheckCircle, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { isConnected, address } = useSelector((s) => s.wallet);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [walletAddress, setWalletAddress] = useState(address || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      router.push('/');
    }
  }, [isConnected, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleSubmitEmail = async (e) => {
    e.preventDefault();
    if (!email) { toast.error('Email is required'); return; }
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword({ email, walletAddress });
      toast.success(res.data.message);
      setStep(2);
      setResendCooldown(60);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) { toast.error('Enter the 6-digit OTP'); return; }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const res = await authAPI.resetPassword({ email, otp, newPassword });
      toast.success(res.data.message);
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally { setLoading(false); }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    try {
      await authAPI.forgotPassword({ email, walletAddress });
      toast.success('OTP resent');
      setResendCooldown(60);
    } catch (_) { toast.error('Failed to resend'); }
  };

  // Step 3: Success
  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070714] px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-500/30">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Password Reset!</h2>
          <p className="text-slate-400 text-sm mb-6">Your password has been changed successfully.</p>
          <Link href="/auth/login"
            className="inline-block w-full py-3.5 rounded-xl font-bold text-white text-center bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 shadow-[0_0_20px_rgba(0,180,255,0.2)]">
            Login with New Password
          </Link>
        </div>
      </div>
    );
  }

  // Step 2: OTP + New Password
  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070714] px-4 py-10">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-purple-900/15 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 w-full max-w-sm">
          <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs mb-5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>

          <div className="bg-dark-900/80 border border-dark-700 rounded-2xl p-6 backdrop-blur-sm">
            <div className="text-center mb-5">
              <h2 className="text-lg font-bold text-white mb-1">Reset Password</h2>
              <p className="text-slate-400 text-xs">
                OTP sent to <span className="text-cyan-400">{email}</span>
              </p>
            </div>

            <form onSubmit={handleResetPassword} noValidate className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-2">Enter 6-digit code</p>
                <OTPInput length={6} onComplete={(val) => setOtp(val)} disabled={loading} />
              </div>
              <div className="relative">
                <RiLockLine className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type={showPassword ? 'text' : 'password'} required minLength={8}
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password (min 8 chars)"
                  className="w-full bg-dark-800 border border-dark-600 rounded-xl py-3 pl-10 pr-12 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button type="submit" disabled={loading || otp.length < 6}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 shadow-[0_0_20px_rgba(0,180,255,0.2)] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Resetting...</> : 'Reset Password'}
              </button>
            </form>

            <div className="text-center mt-4">
              <button onClick={handleResendOTP} disabled={resendCooldown > 0}
                className="text-xs text-slate-400 hover:text-cyan-400 disabled:opacity-50 flex items-center gap-1.5 mx-auto transition-colors">
                <RefreshCw className="w-3 h-3" />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Email
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070714] px-4 py-10">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-purple-900/15 rounded-full blur-[120px]" />
      </div>
      <div className="relative z-10 w-full max-w-sm">
        <Link href="/auth/login" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs mb-5 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
        </Link>

        <div className="bg-dark-900/80 border border-dark-700 rounded-2xl p-6 backdrop-blur-sm">
          <div className="text-center mb-5">
            <div className="w-12 h-12 bg-purple-500/15 rounded-xl flex items-center justify-center mx-auto mb-3 border border-purple-500/25">
              <RiLockLine className="w-6 h-6 text-purple-400" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">Forgot Password</h2>
            <p className="text-slate-400 text-xs">Enter your email to receive a reset code</p>
          </div>

          <form onSubmit={handleSubmitEmail} noValidate className="space-y-4">
            <div className="relative">
              <RiMailLine className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full bg-dark-800 border border-dark-600 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                autoComplete="email" />
            </div>
            {/* Wallet address readonly */}
            <div className="relative opacity-60">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs">🔗</span>
              <input type="text" value={walletAddress} readOnly
                className="w-full bg-dark-800 border border-dark-600 rounded-xl py-3 pl-10 pr-4 text-slate-400 text-xs font-mono cursor-not-allowed" />
            </div>
            <p className="text-[10px] text-slate-600 -mt-2">Wallet must match your registered account</p>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 shadow-[0_0_20px_rgba(0,180,255,0.2)] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending OTP...</> : 'Send Reset OTP'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
