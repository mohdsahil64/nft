import { TrendingUp } from 'lucide-react';

export default function StatCard({ label, value, subValue, icon: Icon, imageSrc, color = 'primary', trend }) {
  const colorMap = {
    primary: 'bg-primary-600/20 text-primary-400',
    emerald: 'bg-emerald-600/20 text-emerald-400',
    blue: 'bg-blue-600/20 text-blue-400',
    purple: 'bg-purple-600/20 text-purple-400',
    yellow: 'bg-yellow-600/20 text-yellow-400',
    red: 'bg-red-600/20 text-red-400',
  };

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        {imageSrc ? (
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
            <img src={imageSrc} alt="NFT" className="w-5 h-5 sm:w-6 sm:h-6 rounded" />
          </div>
        ) : Icon ? (
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        ) : null}
        {trend !== undefined && (
          <div className="flex items-center gap-1 text-xs text-emerald-400">
            <TrendingUp className="w-3 h-3" />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className="mt-2 sm:mt-3">
        <div className="stat-value">{value}</div>
        {subValue && <div className="text-xs text-emerald-400 mt-0.5 truncate">{subValue}</div>}
        <div className="stat-label mt-0.5 sm:mt-1">{label}</div>
      </div>
    </div>
  );
}
