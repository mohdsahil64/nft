'use client';
import { Provider } from 'react-redux';
import { useEffect } from 'react';
import { store } from '../store';
import { loginSuccess, sessionCheckDone } from '../store/slices/userSlice';
import { connectWallet } from '../store/slices/walletSlice';
import { userAPI } from '../lib/api';
import { Toaster } from 'react-hot-toast';
import MaintenanceGate from '../components/MaintenanceGate';

function SessionRestorer() {
  useEffect(() => {
    const token = sessionStorage.getItem('token');

    if (token && !store.getState().user.isAuthenticated) {
      // Valid session — restore user (page reload, keep logged in)
      userAPI.getProfile()
        .then((res) => {
          const user = res.data.data;
          // Restore wallet from DB record only (trusted source)
          if (user.walletAddress) {
            localStorage.setItem('walletAddress', user.walletAddress);
            store.dispatch(connectWallet({ address: user.walletAddress, chainId: null }));
          }
          store.dispatch(loginSuccess({ user, token }));
        })
        .catch(() => {
          // Token expired — clear everything
          sessionStorage.removeItem('token');
          localStorage.removeItem('walletAddress');
          store.dispatch(sessionCheckDone());
        });
    } else {
      // No session token — clear stale wallet so old user's wallet doesn't leak
      localStorage.removeItem('walletAddress');
      store.dispatch(sessionCheckDone());
    }
  }, []);

  // Tab/browser close — if no active session, clear localStorage
  useEffect(() => {
    const handleUnload = () => {
      const token = sessionStorage.getItem('token');
      if (!token) {
        localStorage.removeItem('walletAddress');
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  return null;
}

export default function Providers({ children }) {
  return (
    <Provider store={store}>
      <SessionRestorer />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#e2e8f0',
            border: '1px solid #334155',
            borderRadius: '10px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#1e293b' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#1e293b' },
          },
        }}
      />
      <MaintenanceGate>
        {children}
      </MaintenanceGate>
    </Provider>
  );
}
