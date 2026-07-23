'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';

// Login page now redirects to combined auth page with mode=login
export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated } = useSelector((s) => s.user);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.replace('/auth/register?mode=login');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070714]">
      <div className="relative"><div className="absolute inset-0 bg-purple-500/20 rounded-2xl blur-xl animate-pulse" /><img src="/assets/favicon/favicon-96x96.png" alt="" className="w-12 h-12 rounded-2xl relative animate-pulse" style={{animationDuration:"1.5s"}} /></div>
    </div>
  );
}
