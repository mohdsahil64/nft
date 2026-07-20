'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import MaintenanceScreen from './MaintenanceMode';

export default function MaintenanceGate({ children }) {
  const pathname = usePathname();
  const [maintenance, setMaintenance] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Check maintenance status from backend
    const checkMaintenance = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const baseUrl = apiUrl.startsWith('http') ? apiUrl : `https://${apiUrl}`;
        const res = await fetch(`${baseUrl}/api/maintenance/status`, {
          cache: 'no-store',
          next: { revalidate: 0 },
        });
        const data = await res.json();
        if (data.success && data.data.maintenance) {
          setMaintenance(true);
        } else {
          setMaintenance(false);
        }
      } catch {
        // If backend is down, don't block (fallback to normal)
        setMaintenance(false);
      } finally {
        setChecked(true);
      }
    };

    checkMaintenance();

    // Re-check every 30 seconds (so when you turn off maintenance, it auto-recovers)
    const interval = setInterval(checkMaintenance, 30000);
    return () => clearInterval(interval);
  }, []);

  // Admin panel always accessible — no maintenance gate
  if (pathname?.startsWith('/admin')) {
    return children;
  }

  // While checking, show nothing briefly (avoids flash)
  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If maintenance mode is ON, show maintenance screen
  if (maintenance) {
    return <MaintenanceScreen />;
  }

  return children;
}
