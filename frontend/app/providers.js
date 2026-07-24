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
    // Restore wallet state from localStorage (survives page refresh)
    const savedWallet = localStorage.getItem('walletAddress');
    if (savedWallet && !store.getState().wallet.isConnected) {
      store.dispatch(connectWallet({ address: savedWallet, chainId: null }));
    }

    const token = localStorage.getItem('token');
    if (token && !store.getState().user.isAuthenticated) {
      // Restore session from token — user didn't logout, so keep them logged in
      userAPI.getProfile()
        .then((res) => {
          store.dispatch(loginSuccess({ user: res.data.data, token }));
        })
        .catch(() => {
          // Token expired or invalid — clear it, user must login again
          localStorage.removeItem('token');
          store.dispatch(sessionCheckDone());
        });
    } else {
      // No token or already authenticated — mark session check as done
      store.dispatch(sessionCheckDone());
    }
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
