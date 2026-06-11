'use client';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '../../../lib/api';
import OTPInput from '../../../components/shared/OTPInput';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import { ArrowLeft, Eye, EyeOff, CheckCircle, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { isConnected, address } = useSelector((s) => s.wallet);

  const [step, setStep] = useState(1); // 1=email+wallet, 2=OTP+newPassword, 3=done
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [walletAddress, setWalletAddress] = useState(address || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Block access if wallet not connected
  useEffect(() => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      router.push('/');
    }
  }, [isConnected, router]);
  // Step 1: Submit email + wallet to get OTP
  const handleSubmitEmail = async (e) => {
    e.preventDefault();
    if (!email || !walletAddress) {
      toast.error('Email and wallet address are required');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword({ email, walletAddress });
      toast.success(res.data.message);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP + set new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.resetPassword({ email, otp, newPassword });
      toast.success(res.data.message);
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await authAPI.forgotPassword({ email, walletAddress });
      toast.success('OTP resent');
    } catch (_) {
      toast.error('Failed to resend');
    }
  };

  // Step 3: Success
  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Password Reset!</h2>
          <p className="text-slate-400 text-sm mb-6">Your password has been changed successfully.</p>
          <Link href="/auth/login" className="btn-primary block text-center">
            Login with New Password
          </Link>
        </div>
      </div>
    );
  }

  // Step 2: OTP + New Password
  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-4">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-2xl font-bold text-white">Reset Password</h1>
            <p className="text-slate-400 text-sm mt-2">
              OTP sent to <span className="text-white font-medium">{email}</span>
            </p>
          </div>

          <div className="card">
            <form onSubmit={handleResetPassword} noValidate>
              <div className="space-y-4">
                <div>
                  <label className="label">Enter OTP</label>
                  <OTPInput length={6} onComplete={(val) => setOtp(val)} disabled={loading} />
                </div>

                <div>
                  <label htmlFor="newPassword" className="label">New Password</label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      required minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="input-field pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading || otp.length < 6} className="btn-primary w-full mt-6 flex items-center justify-center gap-2">
                {loading ? <><LoadingSpinner size="sm" /> Resetting...</> : 'Reset Password'}
              </button>
            </form>

            <div className="text-center mt-4">
              <button onClick={handleResendOTP} className="text-sm text-primary-400 hover:text-primary-300">
                Resend OTP
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Email + Wallet Address
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/auth/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
          <div className="w-14 h-14 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-7 h-7 text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Forgot Password</h1>
          <p className="text-slate-400 text-sm mt-2">Enter your email and connected wallet address to verify identity</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmitEmail} noValidate>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="label">Email Address</label>
                <input
                  id="email" type="email" required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input-field"
                />
              </div>
              <div>
                <label htmlFor="wallet" className="label">Wallet Address (USDT)</label>
                <input
                  id="wallet" type="text" required
                  value={walletAddress}
                  readOnly
                  placeholder="0x..."
                  className="input-field font-mono text-sm opacity-70 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">Must match the wallet linked to your account</p>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-6 flex items-center justify-center gap-2">
              {loading ? <><LoadingSpinner size="sm" /> Sending OTP...</> : 'Send Reset OTP'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
