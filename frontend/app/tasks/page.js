'use client';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { userAPI } from '../../lib/api';
import Navbar from '../../components/shared/Navbar';
import { CheckCircle, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const taskDefinitions = [
  {
    key: 'telegram_channel',
    label: 'Telegram Channel',
    description: 'Follow our official Telegram channel',
    link: 'https://t.me/futuremintnft',
    icon: '📣',
    color: 'blue',
  },
  {
    key: 'telegram_group',
    label: 'Telegram Group',
    description: 'Join our Telegram community group',
    link: 'https://t.me/futuremintnftgroup',
    icon: '💬',
    color: 'blue',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    description: 'Follow us on Instagram',
    link: 'https://instagram.com/futuremintnft',
    icon: '📸',
    color: 'pink',
  },
  {
    key: 'twitter',
    label: 'Twitter / X',
    description: 'Follow us on X (Twitter)',
    link: 'https://twitter.com/futuremintnft',
    icon: '🐦',
    color: 'sky',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    description: 'Follow our Facebook page',
    link: 'https://facebook.com/futuremintnft',
    icon: '👤',
    color: 'blue',
  },
];

export default function TasksPage() {
  const router = useRouter();
  const { isAuthenticated, sessionChecked } = useSelector((s) => s.user);
  const [tasks, setTasks] = useState({
    telegram_channel: false,
    telegram_group: false,
    instagram: false,
    twitter: false,
    facebook: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    if (!sessionChecked) return;
    if (!isAuthenticated) { router.push('/'); return; }
    userAPI.getTasks()
      .then((r) => setTasks(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionChecked, isAuthenticated, router]);

  const markDone = async (key) => {
    setSaving(key);
    try {
      const updated = { ...tasks, [key]: true };
      await userAPI.updateTasks({ [key]: true });
      setTasks(updated);
      toast.success('Task marked as completed!');
    } catch (_) {
      toast.error('Failed to update task');
    } finally {
      setSaving(null);
    }
  };

  const completedCount = Object.values(tasks).filter(Boolean).length;

  return (
    <div className="min-h-screen pb-16">
      <Navbar />
      <main className="max-w-3xl mx-auto px-3 sm:px-6 pt-20 sm:pt-24">
        <div className="flex items-center justify-between mb-8">
          <h1 className="page-title mb-0">Social Media Tasks</h1>
          <span className="text-sm text-slate-400">{completedCount}/{taskDefinitions.length} completed</span>
        </div>

        {/* Progress */}
        <div className="card mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Overall Progress</span>
            <span className="text-white font-medium">{completedCount}/{taskDefinitions.length}</span>
          </div>
          <div className="w-full bg-dark-700 rounded-full h-3">
            <div
              className="bg-primary-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / taskDefinitions.length) * 100}%` }}
              role="progressbar"
              aria-valuenow={completedCount}
              aria-valuemax={taskDefinitions.length}
              aria-label={`${completedCount} of ${taskDefinitions.length} tasks completed`}
            />
          </div>
          {completedCount === taskDefinitions.length && (
            <p className="text-emerald-400 text-sm mt-3 font-medium text-center">
              🎉 All tasks completed! Thanks for supporting FutureMint NFT.
            </p>
          )}
        </div>

        {/* Tasks list */}
        <div className="space-y-4">
          {taskDefinitions.map((task) => {
            const done = tasks[task.key];
            return (
              <div
                key={task.key}
                className={`card transition-all ${done ? 'opacity-70 border-emerald-700/30' : 'hover:border-primary-500/30'}`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="text-2xl sm:text-3xl flex-shrink-0" role="img" aria-hidden="true">{task.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-sm sm:text-base">{task.label}</h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{task.description}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <a
                        href={task.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary flex items-center gap-1.5 text-xs sm:text-sm py-1.5 px-3"
                        aria-label={`Open ${task.label}`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Open
                      </a>
                      {done ? (
                        <div className="flex items-center gap-1 text-emerald-400 font-medium text-xs sm:text-sm">
                          <CheckCircle className="w-4 h-4" /> Done
                        </div>
                      ) : (
                        <button
                          onClick={() => markDone(task.key)}
                          disabled={saving === task.key}
                          className="btn-primary text-xs sm:text-sm py-1.5 px-3"
                        >
                          {saving === task.key ? 'Saving...' : 'Mark Done'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
