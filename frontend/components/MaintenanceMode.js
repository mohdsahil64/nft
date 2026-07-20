'use client';

export default function MaintenanceScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4 relative overflow-hidden">
      {/* Background animated gradient blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="text-center max-w-lg relative z-10">
        {/* Animated gear icon */}
        <div className="relative inline-block mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-600/20 to-purple-600/20 rounded-full flex items-center justify-center border border-primary-500/30 mx-auto">
            <svg
              className="w-12 h-12 text-primary-400 animate-spin"
              style={{ animationDuration: '4s' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          {/* Ping animation */}
          <span className="absolute top-0 right-0 w-4 h-4 bg-yellow-400 rounded-full animate-ping opacity-75" />
          <span className="absolute top-0 right-0 w-4 h-4 bg-yellow-400 rounded-full" />
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Under Maintenance
        </h1>

        {/* Description */}
        <p className="text-slate-400 text-base sm:text-lg leading-relaxed mb-6">
          We are upgrading the platform to bring you a better experience. 
          This won&apos;t take long.
        </p>

        {/* Info card */}
        <div className="bg-dark-800/80 border border-dark-700 rounded-xl p-5 mb-8 text-left">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium text-sm mb-1">What&apos;s happening?</p>
              <ul className="text-slate-400 text-xs space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary-400 rounded-full" />
                  Platform upgrade in progress
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary-400 rounded-full" />
                  Your funds and NFTs are completely safe
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary-400 rounded-full" />
                  We&apos;ll be back online shortly
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Status indicator */}
        <div className="inline-flex items-center gap-2 bg-dark-800 border border-dark-700 rounded-full px-4 py-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-400"></span>
          </span>
          <span className="text-sm text-slate-400">Maintenance in progress...</span>
        </div>

        {/* Footer */}
        <p className="text-slate-600 text-xs mt-8">
          Thank you for your patience — FutureMint NFT Team
        </p>
      </div>
    </div>
  );
}
