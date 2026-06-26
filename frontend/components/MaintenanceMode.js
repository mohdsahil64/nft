'use client';

// Set to true to enable maintenance mode for users
// Admin panel (/admin) will still be accessible
export const MAINTENANCE_MODE = false;

export default function MaintenanceScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-6">🔧</div>
        <h1 className="text-2xl font-bold text-white mb-3">Under Maintenance</h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          We're making some improvements. Please check back shortly.
        </p>
        <p className="text-slate-500 text-xs mt-6">— FutureMint NFT Team</p>
      </div>
    </div>
  );
}
