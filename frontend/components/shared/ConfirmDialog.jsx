'use client';
import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger' }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: { btn: 'bg-red-600 hover:bg-red-500', icon: 'text-red-400 bg-red-900/30' },
    warning: { btn: 'bg-yellow-600 hover:bg-yellow-500', icon: 'text-yellow-400 bg-yellow-900/30' },
    primary: { btn: 'bg-primary-600 hover:bg-primary-500', icon: 'text-primary-400 bg-primary-900/30' },
  };
  const styles = variantStyles[variant] || variantStyles.danger;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6" role="dialog" aria-modal="true" style={{ margin: 0 }}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      {/* Panel */}
      <div className="relative w-full max-w-[300px] bg-dark-800 rounded-2xl border border-dark-700 shadow-2xl p-5">
        <div className="flex flex-col items-center text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${styles.icon}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1.5">{title}</h3>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed">{message}</p>
          <div className="flex gap-2 w-full">
            <button onClick={onClose} className="flex-1 bg-dark-700 hover:bg-dark-600 text-white font-medium py-2.5 px-3 rounded-lg transition-all text-sm border border-dark-600">
              {cancelText}
            </button>
            <button onClick={onConfirm} className={`flex-1 text-white font-medium py-2.5 px-3 rounded-lg transition-all text-sm ${styles.btn}`}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
