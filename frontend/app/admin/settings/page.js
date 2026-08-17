'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '../AdminLayout';
import { adminAPI } from '../../../lib/api';
import toast from 'react-hot-toast';
import { Settings, DollarSign, Coins, Shield, RefreshCw, Save } from 'lucide-react';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    signupBonusAmount: 100,
    priceIncrement: 200000,
    minWithdrawal: 100,
    minSwap: 100,
    maintenanceMode: false,
    currentPrice: 0.01,
    totalMinted: 0,
    totalSupply: 2100000,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [settingsRes, maintenanceRes] = await Promise.all([
        adminAPI.getSettings(),
        adminAPI.getMaintenanceStatus(),
      ]);
      const data = settingsRes.data.data;
      const maintenanceStatus = maintenanceRes.data?.data?.maintenance || false;
      setSettings({
        signupBonusAmount: data.signupBonusAmount || 100,
        priceIncrement: data.priceIncrement || 200000,
        minWithdrawal: data.minWithdrawal || 100,
        minSwap: data.minSwap || 100,
        maintenanceMode: maintenanceStatus,
        currentPrice: data.currentPrice || 0.01,
        totalMinted: data.totalMinted || 0,
        totalSupply: data.totalSupply || 2100000,
      });
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminAPI.updateSettings({
        signupBonusAmount: Number(settings.signupBonusAmount),
        priceIncrement: Number(settings.priceIncrement),
        minWithdrawal: Number(settings.minWithdrawal),
        minSwap: Number(settings.minSwap),
        maintenanceMode: settings.maintenanceMode,
      });
      toast.success('Settings saved successfully!');
      fetchSettings(); // Refresh to show updated price
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  // Calculate current tier info
  const currentTier = Math.floor(settings.totalMinted / (settings.priceIncrement || 200000));
  const nextTierAt = (currentTier + 1) * (settings.priceIncrement || 200000);
  const remaining = nextTierAt - settings.totalMinted;

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl font-bold text-white">Platform Settings</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Current Status Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Current NFT Price</p>
            <p className="text-xl font-bold text-cyan-400">${settings.currentPrice}</p>
          </div>
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Total Minted</p>
            <p className="text-xl font-bold text-white">{settings.totalMinted.toLocaleString()}</p>
          </div>
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Next Price Increase</p>
            <p className="text-xl font-bold text-purple-400">{remaining.toLocaleString()} NFTs left</p>
            <p className="text-[9px] text-slate-500">At {nextTierAt.toLocaleString()} total minted</p>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* NFT Price Increment */}
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Coins className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-semibold text-white">NFT Price Increment</h3>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">Price doubles after this many NFTs are minted</p>
            <input
              type="number"
              value={settings.priceIncrement}
              onChange={(e) => handleChange('priceIncrement', e.target.value)}
              className="w-full bg-dark-700/50 border border-dark-600 rounded-lg py-3 px-4 text-white font-semibold focus:outline-none focus:border-purple-500 transition-colors"
              min="1000"
            />
            <p className="text-[9px] text-slate-500 mt-2">Current: Every {Number(settings.priceIncrement).toLocaleString()} NFTs</p>
          </div>

          {/* Signup Bonus */}
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Signup Bonus (NFTs)</h3>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">NFTs given to new users on registration</p>
            <input
              type="number"
              value={settings.signupBonusAmount}
              onChange={(e) => handleChange('signupBonusAmount', e.target.value)}
              className="w-full bg-dark-700/50 border border-dark-600 rounded-lg py-3 px-4 text-white font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
              min="0"
            />
            <p className="text-[9px] text-slate-500 mt-2">Current: {settings.signupBonusAmount} NFTs per signup</p>
          </div>

          {/* Min Withdrawal */}
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-yellow-400" />
              <h3 className="text-sm font-semibold text-white">Minimum Withdrawal (USDT)</h3>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">Minimum USDT amount user can withdraw</p>
            <input
              type="number"
              value={settings.minWithdrawal}
              onChange={(e) => handleChange('minWithdrawal', e.target.value)}
              className="w-full bg-dark-700/50 border border-dark-600 rounded-lg py-3 px-4 text-white font-semibold focus:outline-none focus:border-yellow-500 transition-colors"
              min="1"
            />
            <p className="text-[9px] text-slate-500 mt-2">Current: ${settings.minWithdrawal} USDT minimum</p>
          </div>

          {/* Min Swap */}
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Minimum NFT Swap</h3>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">Minimum NFTs required to swap to USDT</p>
            <input
              type="number"
              value={settings.minSwap}
              onChange={(e) => handleChange('minSwap', e.target.value)}
              className="w-full bg-dark-700/50 border border-dark-600 rounded-lg py-3 px-4 text-white font-semibold focus:outline-none focus:border-blue-500 transition-colors"
              min="1"
            />
            <p className="text-[9px] text-slate-500 mt-2">Current: {settings.minSwap} NFTs minimum</p>
          </div>

          {/* Maintenance Mode */}
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-5 md:col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-red-400" />
                <div>
                  <h3 className="text-sm font-semibold text-white">Maintenance Mode</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">When enabled, users cannot access the platform</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  try {
                    const res = await adminAPI.toggleMaintenance();
                    const newVal = res.data?.data?.maintenance || false;
                    handleChange('maintenanceMode', newVal);
                    toast.success(newVal ? 'Maintenance ON' : 'Maintenance OFF');
                  } catch (err) {
                    toast.error('Failed to toggle maintenance');
                  }
                }}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  settings.maintenanceMode ? 'bg-red-500' : 'bg-dark-600'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.maintenanceMode ? 'translate-x-8' : 'translate-x-1'
                }`} />
              </button>
            </div>
            {settings.maintenanceMode && (
              <div className="mt-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-[11px] text-red-400 font-medium">Site is currently in maintenance mode. Users cannot access the platform.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
