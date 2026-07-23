'use client';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/shared/Navbar';
import { RiMailLine, RiInstagramFill, RiTelegramFill, RiTwitterXFill, RiFacebookCircleFill, RiArrowLeftSLine } from 'react-icons/ri';

export default function SupportPage() {
  const router = useRouter();
  const { isAuthenticated, sessionChecked } = useSelector((s) => s.user);

  useEffect(() => {
    if (sessionChecked && !isAuthenticated) router.push('/');
  }, [sessionChecked, isAuthenticated, router]);

  const email = process.env.NEXT_PUBLIC_EMAIL_SUPPORT || 'futuremintnft@gmail.com';
  const instagram = process.env.NEXT_PUBLIC_INSTAGRAM_URL || '';
  const telegram = process.env.NEXT_PUBLIC_TELEGRAM_URL || '';
  const twitter = process.env.NEXT_PUBLIC_TWITTER_URL || '';
  const facebook = process.env.NEXT_PUBLIC_FACEBOOK_URL || '';

  const socials = [
    { name: 'Email', icon: RiMailLine, url: `mailto:${email}`, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', value: email },
    { name: 'Instagram', icon: RiInstagramFill, url: instagram, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', value: 'Follow us' },
    { name: 'Telegram', icon: RiTelegramFill, url: telegram, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', value: 'Join group' },
    { name: 'Twitter', icon: RiTwitterXFill, url: twitter, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', value: 'Follow us' },
    { name: 'Facebook', icon: RiFacebookCircleFill, url: facebook, color: 'text-blue-500', bg: 'bg-blue-600/10', border: 'border-blue-600/20', value: 'Like page' },
  ];

  return (
    <div className="min-h-screen bg-[#070714] pb-24">
      <Navbar />

      <main className="max-w-lg mx-auto px-4 pt-4">
        {/* Header with back */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-lg bg-dark-800 border border-dark-600 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <RiArrowLeftSLine className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold text-white">Help & Support</h1>
        </div>

        {/* Contact options */}
        <div className="rounded-2xl border border-dark-600/60 bg-dark-800/50 overflow-hidden">
          {socials.map(({ name, icon: Icon, url, color, bg, border, value }, i) => (
            <a
              key={name}
              href={url || '#'}
              target={url?.startsWith('mailto') ? undefined : '_blank'}
              rel="noopener noreferrer"
              className={`flex items-center justify-between px-4 py-4 hover:bg-dark-700/30 transition-colors ${
                i < socials.length - 1 ? 'border-b border-dark-700/50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-white">{name}</p>
                  <p className="text-[10px] text-slate-500">{value}</p>
                </div>
              </div>
              <span className="text-[10px] text-slate-600">→</span>
            </a>
          ))}
        </div>

        {/* Info */}
        <p className="text-[10px] text-slate-600 text-center mt-4">
          We typically respond within 24 hours
        </p>
      </main>
    </div>
  );
}
