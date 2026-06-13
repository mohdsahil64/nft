'use client';
import { useEffect } from 'react';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger' }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const btnColor = variant === 'danger'
    ? 'bg-red-500 hover:bg-red-400 shadow-red-500/20'
    : variant === 'warning'
    ? 'bg-yellow-500 hover:bg-yellow-400 shadow-yellow-500/20'
    : 'bg-primary-500 hover:bg-primary-400 shadow-primary-500/20';

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      {/* Panel — slides up on mobile, centered on desktop */}
      <div className="relative w-full sm:max-w-[320px] bg-[#1a1f2e] sm:rounded-2xl rounded-t-2xl border-t sm:border border-white/5 shadow-2xl overflow-hidden">
        {/* Top accent line */}
        <div className={`h-0.5 w-full ${variant === 'danger' ? 'bg-red-500' : variant === 'warning' ? 'bg-yellow-500' : 'bg-primary-500'}`} />
        
        <div className="px-6 pt-6 pb-5 text-center">
          <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">{message}</p>
        </div>

        {/* Buttons */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-sm font-medium text-slate-300 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 text-sm font-semibold text-white rounded-xl transition-all shadow-lg ${btnColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
