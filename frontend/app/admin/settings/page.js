'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../../lib/api';
import AdminLayout from '../AdminLayout';
import ConfirmDialog from '../../../components/shared/ConfirmDialog';
import Modal from '../../../components/shared/Modal';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import { Settings, Gift, Globe, CheckCircle, XCircle, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signupBonus, setSignupBonus] = useState('');
  const [networkRequests, setNetworkRequests] = useState([]);
  const [processingReq, setProcessingReq] = useState(null);
  const [networkConfirm, setNetworkConfirm] = useState({ show: false, id: null, action: '' });
  const [passwordForm, setPasswordForm] = useState({ old: '', new: '', confirm: '' });
  const [passwordConfirm, setPasswordConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordStep, setPasswordStep] = useState(1); // 1=form, 2=otp
  const [passwordOtp, setPasswordOtp] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailStep, setEmailStep] = useState(1); // 1=enter emails, 2=otp
  const [emailModal, setEmailModal] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);

  useEffect(() => {
    Promise.all([adminAPI.getSettings(), adminAPI.getNetworkChangeRequests({ status: 'pending' })])
      .then(([cfg, reqs]) => {
        setConfig(cfg.data.data);
        setSignupBonus(cfg.data.data.signupBonusAmount?.toString() || '100');
        setAdminEmail(cfg.data.data.adminEmail || '');
        setNetworkRequests(reqs.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSaveSignupBonus = async () => {
    setSaving(true);
    try {
      await adminAPI.updateSettings({ signupBonusAmount: parseInt(signupBonus, 10) });
      toast.success('Signup bonus updated');
    } catch (_) { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  const handleNetworkRequest = async (id, action) => {
    setNetworkConfirm({ show: false, id: null, action: '' });
    setProcessingReq(id);
    try {
      await adminAPI.handleNetworkChangeRequest(id, { action });
      toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'}`);
      setNetworkRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (_) { toast.error('Failed'); }
    finally { setProcessingReq(null); }
  };

  // Password change — Step 1: Send OTP
  const handlePasswordSendOTP = async () => {
    setChangingPassword(true);
    try {
      await adminAPI.requestPasswordChange({ oldPassword: passwordForm.old });
      toast.success('OTP sent to admin email');
      setPasswordStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed. Check current password.');
    } finally {
      setChangingPassword(false);
    }
  };

  // Password change — Step 2: Verify OTP and update
  const handlePasswordVerifyOTP = async () => {
    if (!passwordOtp || passwordOtp.length < 6) { toast.error('Enter 6-digit OTP'); return; }
    setChangingPassword(true);
    try {
      await adminAPI.confirmPasswordChange({ oldPassword: passwordForm.old, newPassword: passwordForm.new, otp: passwordOtp });
      toast.success('Admin password changed successfully');
      setPasswordForm({ old: '', new: '', confirm: '' });
      setPasswordOtp('');
      setPasswordStep(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setChangingPassword(false);
    }
  };

  // Email change — Step 1: Send OTP to current admin email
  const handleSendEmailOTP = async () => {
    if (!newAdminEmail || !newAdminEmail.includes('@')) {
      toast.error('Enter a valid new email');
      return;
    }
    if (newAdminEmail !== confirmEmail) {
      toast.error('Emails do not match');
      return;
    }
    setEmailSaving(true);
    try {
      await adminAPI.requestEmailChange({ newEmail: newAdminEmail });
      toast.success('OTP sent to current admin email');
      setEmailStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setEmailSaving(false);
    }
  };

  // Email change — Step 2: Verify OTP and update
  const handleVerifyEmailOTP = async () => {
    if (!emailOtp || emailOtp.length < 6) { toast.error('Enter 6-digit OTP'); return; }
    setEmailSaving(true);
    try {
      await adminAPI.confirmEmailChange({ newEmail: newAdminEmail, otp: emailOtp });
      toast.success('Admin email updated successfully');
      setAdminEmail(newAdminEmail);
      setNewAdminEmail('');
      setConfirmEmail('');
      setEmailOtp('');
      setEmailStep(1);
      setEmailModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setEmailSaving(false);
    }
  };

  const closeEmailModal = () => {
    setEmailModal(false);
    setEmailStep(1);
    setNewAdminEmail('');
    setConfirmEmail('');
    setEmailOtp('');
  };

  if (loading) {
    return <AdminLayout currentPage="settings"><div className="flex items-center justify-center h-64"><LoadingSpinner size="xl" /></div></AdminLayout>;
  }

  return (
    <AdminLayout currentPage="settings">
      <h1 className="page-title">Platform Settings</h1>

      {/* Change Admin Email */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-blue-400" />
          <h2 className="font-semibold text-white">Admin Email</h2>
        </div>
        <div className="flex items-center justify-between bg-dark-700 rounded-lg p-3">
          <div>
            <p className="text-xs text-slate-500">Current Email</p>
            <p className="text-sm text-white font-medium">{adminEmail}</p>
          </div>
          <button onClick={() => setEmailModal(true)} className="btn-secondary text-xs">
            Update
          </button>
        </div>
      </div>

      {/* Change Admin Password */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-red-400" />
          <h2 className="font-semibold text-white">Change Admin Password</h2>
        </div>

        {passwordStep === 1 ? (
          <div className="space-y-3">
            <div>
              <label className="label">Current Password</label>
              <input type="password" value={passwordForm.old} onChange={(e) => setPasswordForm({ ...passwordForm, old: e.target.value })}
                className="input-field" placeholder="Enter current password" />
            </div>
            <div>
              <label className="label">New Password</label>
              <input type="password" value={passwordForm.new} onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                className="input-field" placeholder="Min. 6 characters" />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                className="input-field" placeholder="Re-enter new password" />
            </div>
            <button onClick={() => {
              if (!passwordForm.old || !passwordForm.new || !passwordForm.confirm) { toast.error('Fill all fields'); return; }
              if (passwordForm.new.length < 6) { toast.error('New password must be at least 6 characters'); return; }
              if (passwordForm.new !== passwordForm.confirm) { toast.error('Passwords do not match'); return; }
              handlePasswordSendOTP();
            }} disabled={changingPassword} className="btn-danger w-full sm:w-auto">
              {changingPassword ? 'Sending OTP...' : 'Send OTP & Change'}
            </button>
            <p className="text-xs text-slate-500">OTP will be sent to admin email for verification</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
              <p className="text-sm text-blue-300 text-center">OTP sent to admin email. Verify to change password.</p>
            </div>
            <div>
              <label className="label">Enter 6-digit OTP</label>
              <input type="text" value={passwordOtp} onChange={(e) => setPasswordOtp(e.target.value)}
                className="input-field text-center font-mono text-lg tracking-widest" placeholder="000000" maxLength={6} />
            </div>
            <div className="flex gap-2">
              <button onClick={handlePasswordVerifyOTP} disabled={changingPassword || passwordOtp.length < 6} className="btn-danger flex-1">
                {changingPassword ? 'Changing...' : 'Verify & Change Password'}
              </button>
              <button onClick={() => { setPasswordStep(1); setPasswordOtp(''); }} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Signup Bonus */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Gift className="w-5 h-5 text-yellow-400" />
          <h2 className="font-semibold text-white">Signup Bonus</h2>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex-1">
            <label className="label">NFT amount for new signups</label>
            <input type="number" value={signupBonus} onChange={(e) => setSignupBonus(e.target.value)}
              className="input-field" min="1" />
          </div>
          <button onClick={handleSaveSignupBonus} disabled={saving} className="btn-primary sm:mb-0">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Network Change Requests */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-blue-400" />
          <h2 className="font-semibold text-white">Network Change Requests</h2>
          {networkRequests.length > 0 && (
            <span className="badge badge-warning ml-2">{networkRequests.length}</span>
          )}
        </div>

        {networkRequests.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <Globe className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No pending requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {networkRequests.map((req) => (
              <div key={req._id} className="p-3 bg-dark-700 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-400">{req.userId?.name?.charAt(0)?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{req.userId?.name}</p>
                    <p className="text-xs text-slate-500">{req.userId?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3 text-xs">
                  <span className="badge badge-info">{req.currentNetwork}</span>
                  <span className="text-slate-500">→</span>
                  <span className="badge badge-warning">{req.requestedNetwork}</span>
                  <span className="text-slate-600 ml-auto">{new Date(req.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNetworkConfirm({ show: true, id: req._id, action: 'approve' })}
                    disabled={processingReq === req._id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-900/30 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-900/50 transition-colors">
                    <CheckCircle className="w-3 h-3" /> Approve
                  </button>
                  <button
                    onClick={() => setNetworkConfirm({ show: true, id: req._id, action: 'reject' })}
                    disabled={processingReq === req._id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-900/30 text-red-400 rounded-lg text-xs font-medium hover:bg-red-900/50 transition-colors">
                    <XCircle className="w-3 h-3" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Network Request Confirm */}
      <ConfirmDialog
        isOpen={networkConfirm.show}
        onClose={() => setNetworkConfirm({ show: false, id: null, action: '' })}
        onConfirm={() => handleNetworkRequest(networkConfirm.id, networkConfirm.action)}
        title={networkConfirm.action === 'approve' ? 'Approve Network Change' : 'Reject Network Change'}
        message={networkConfirm.action === 'approve' ? "User's network will be changed. This affects their withdrawal address." : "User's request will be rejected."}
        confirmText={networkConfirm.action === 'approve' ? 'Approve' : 'Reject'}
        cancelText="Cancel"
        variant={networkConfirm.action === 'approve' ? 'primary' : 'danger'}
      />

      {/* Email Change Modal */}
      <Modal isOpen={emailModal} onClose={closeEmailModal} title="Update Admin Email" size="sm">
        {emailStep === 1 ? (
          <div className="space-y-4">
            <div className="bg-dark-700 rounded-lg p-3">
              <p className="text-xs text-slate-500">Current Email</p>
              <p className="text-sm text-white font-medium">{adminEmail}</p>
            </div>
            <div>
              <label className="label">New Email Address</label>
              <input type="email" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)}
                className="input-field" placeholder="newemail@example.com" />
            </div>
            <div>
              <label className="label">Confirm New Email</label>
              <input type="email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)}
                className="input-field" placeholder="Re-enter new email" />
            </div>
            <button onClick={handleSendEmailOTP} disabled={emailSaving} className="btn-primary w-full">
              {emailSaving ? 'Sending OTP...' : 'Send OTP to Current Email'}
            </button>
            <p className="text-xs text-slate-500 text-center">A verification OTP will be sent to <strong>{adminEmail}</strong></p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3 text-center">
              <p className="text-sm text-blue-300">OTP sent to <strong>{adminEmail}</strong></p>
            </div>
            <div>
              <label className="label">Enter 6-digit OTP</label>
              <input type="text" value={emailOtp} onChange={(e) => setEmailOtp(e.target.value)}
                className="input-field text-center font-mono text-lg tracking-widest" placeholder="000000" maxLength={6} />
            </div>
            <button onClick={handleVerifyEmailOTP} disabled={emailSaving || emailOtp.length < 6} className="btn-primary w-full">
              {emailSaving ? 'Verifying...' : 'Verify & Update Email'}
            </button>
            <button onClick={() => setEmailStep(1)} className="btn-secondary w-full">
              Back
            </button>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
