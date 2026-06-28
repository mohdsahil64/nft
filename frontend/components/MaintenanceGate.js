'use client';
import { usePathname } from 'next/navigation';
import MaintenanceScreen, { MAINTENANCE_MODE } from './MaintenanceMode';
import LaunchCountdown from './LaunchCountdown';

export default function MaintenanceGate({ children }) {
  const pathname = usePathname();

  // Admin panel always accessible
  if (pathname?.startsWith('/admin')) {
    return children;
  }

  // If maintenance mode is ON, show maintenance screen for all users
  if (MAINTENANCE_MODE) {
    return <MaintenanceScreen />;
  }

  return (
    <>
      <LaunchCountdown />
      {children}
    </>
  );
}
