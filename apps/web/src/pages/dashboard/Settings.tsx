import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/dashboard/layout/DashboardLayout';
import { Github, AlertTriangle, User as UserIcon, Check, Loader2 } from 'lucide-react';
import { useUserProfile } from '../../hooks/useUserProfile';
import { isTrialActive } from '../../lib/subscription';
import { auth, db, doc, setDoc, deleteDoc } from '../../lib/firebase';
import {
  updateProfile,
  linkWithPopup,
  unlink,
  deleteUser,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut
} from 'firebase/auth';

export function Settings() {
  const navigate = useNavigate();
  const { currentUser, profile, subscription, loading } = useUserProfile();

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Sync state with loaded profile
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setAvatarUrl(currentUser?.photoURL || '');
    }
  }, [profile, currentUser]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-white/80 animate-spin" />
            <span className="text-xs text-white/40 font-mono">Loading settings...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Connected accounts processing
  const providers = currentUser?.providerData || [];
  const hasPassword = providers.some((p: any) => p.providerId === 'password');
  const hasGoogle = providers.some((p: any) => p.providerId === 'google.com');
  const hasGithub = providers.some((p: any) => p.providerId === 'github.com');

  const googleAccount = providers.find((p: any) => p.providerId === 'google.com');
  const githubAccount = providers.find((p: any) => p.providerId === 'github.com');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setUpdating(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      // Update Firebase Auth details
      await updateProfile(currentUser, {
        displayName: name,
        photoURL: avatarUrl || null
      });

      // Update Firestore user document
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(
          userRef,
          {
            name,
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      } catch (firestoreErr: any) {
        console.warn('Could not update Firestore profile, likely due to security rules:', firestoreErr);
      }

      // Force session refresh in local state
      await currentUser.reload();
      setSuccessMsg('Profile updated successfully.');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to update profile settings.');
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Image size must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setAvatarUrl(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleLinkProvider = async (providerId: string) => {
    if (!currentUser) return;
    setErrorMsg('');
    setSuccessMsg('');
    setActionLoading(providerId);

    try {
      let provider;
      if (providerId === 'google.com') {
        provider = new GoogleAuthProvider();
      } else if (providerId === 'github.com') {
        provider = new GithubAuthProvider();
      } else {
        throw new Error('Unsupported provider linking.');
      }

      await linkWithPopup(currentUser, provider);
      await currentUser.reload();
      setSuccessMsg(`Successfully linked ${providerId === 'google.com' ? 'Google' : 'GitHub'} account.`);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/credential-already-in-use') {
        setErrorMsg('This social account is already linked to another Derivo user.');
      } else {
        setErrorMsg(err.message || 'Failed to link account.');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnlinkProvider = async (providerId: string) => {
    if (!currentUser) return;
    if (providers.length <= 1) {
      setErrorMsg('You cannot disconnect your only connected account. Please link another sign-in option first.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setActionLoading(`unlink-${providerId}`);

    try {
      await unlink(currentUser, providerId);
      await currentUser.reload();
      setSuccessMsg(`Successfully disconnected ${providerId === 'google.com' ? 'Google' : 'GitHub'} account.`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to disconnect account.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    const confirm = window.confirm(
      'Are you absolutely sure you want to delete your Derivo account? This will permanently delete your user profile, configurations, and active sessions. This action cannot be undone.'
    );
    if (!confirm) return;

    setErrorMsg('');
    setSuccessMsg('');
    setActionLoading('delete');

    try {
      // 1. Delete Firestore user document (Try deleting doc or marking deleted, fallback gracefully on permission error)
      const userRef = doc(db, 'users', currentUser.uid);
      try {
        await deleteDoc(userRef);
      } catch (firestoreErr) {
        console.warn('Could not delete Firestore document with deleteDoc:', firestoreErr);
        try {
          await setDoc(userRef, { deleted: true, deletedAt: new Date().toISOString() }, { merge: true });
        } catch (innerErr) {
          console.warn('Could not update Firestore document status:', innerErr);
        }
      }

      // 2. Delete Auth User from Firebase (Sensitive operation, might throw requires-recent-login)
      await deleteUser(currentUser);

      // 3. Sign out and redirect
      await signOut(auth);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setErrorMsg('For security reasons, deleting your account requires a recent login. Please sign out, log back in, and try again.');
      } else {
        setErrorMsg(err.message || 'Failed to delete account. Please contact support.');
      }
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-10 max-w-3xl pb-10">
        <header className="flex flex-col justify-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Settings</h1>
          <p className="text-sm text-white/50">Manage your profile, connected accounts, and security preferences.</p>
        </header>

        {/* Success/Error Alerts */}
        {successMsg && (
          <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Profile Section */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-white/90">Profile</h2>
          <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.01] flex flex-col gap-6">
            <div className="flex items-center gap-6">
              <div className="relative group">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={profile?.name || 'User'}
                    className="w-16 h-16 rounded-full border border-white/10 object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-xl font-semibold text-white/70 uppercase">
                    {profile?.name?.charAt(0) || currentUser?.email?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-white/90">User Avatar</span>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="cursor-pointer px-3 py-1.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors shadow-sm"
                  >
                    Choose Picture
                  </label>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1] text-xs font-medium text-white transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <span className="text-[11px] text-white/40">JPG, PNG or GIF. Max size 2MB.</span>
              </div>
            </div>

            <div className="w-full h-px bg-white/[0.06]" />

            <form className="flex flex-col gap-4" onSubmit={handleUpdateProfile}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/70 ml-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#050505] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/70 ml-1">Email Address</label>
                  <input
                    type="email"
                    value={currentUser?.email || ''}
                    className="w-full bg-[#050505] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/40 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/70 ml-1">Avatar Image URL (Alternative)</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className="w-full bg-[#050505] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
                />
              </div>

              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 rounded-lg bg-white text-black text-xs font-medium hover:bg-white/95 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {updating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Subscription Section */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-white/90">Subscription & Plan</h2>
          <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.01] flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-white/40">Current Plan</span>
                <span className="text-sm font-semibold text-white">
                  {subscription?.plan === 'pro'
                    ? 'Pro Plan'
                    : subscription?.plan === 'trial'
                      ? (subscription && isTrialActive(subscription) ? 'Pro Trial' : 'Trial Expired')
                      : 'Community Plan'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-white/40">Subscription Status</span>
                <span className="text-sm font-semibold text-white capitalize">
                  {subscription?.status || 'Inactive'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-white/40">Trial Expiration</span>
                <span className="text-sm font-semibold text-white">
                  {subscription?.plan === 'trial'
                    ? new Date(subscription.trialEndsAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Connected Accounts */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-white/90">Connected Accounts</h2>
          <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.01] flex flex-col gap-4">
            
            {/* Password Sign in connection status */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-white/[0.06] bg-[#050505]">
              <div className="flex items-center gap-3">
                <UserIcon className="w-5 h-5 text-white/80" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white/90">Email & Password</span>
                  <span className="text-[11px] text-white/40">
                    {hasPassword ? `Connected via ${currentUser?.email}` : 'Not connected'}
                  </span>
                </div>
              </div>
            </div>

            {/* GitHub Provider */}
            <div className={`flex items-center justify-between p-4 rounded-xl border ${hasGithub ? 'border-white/[0.06] bg-[#050505]' : 'border-dashed border-white/[0.1] bg-transparent'}`}>
              <div className="flex items-center gap-3">
                <Github className="w-5 h-5 text-white/80" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white/90">GitHub</span>
                  <span className="text-[11px] text-white/40">
                    {hasGithub 
                      ? `Connected as ${githubAccount?.displayName || githubAccount?.email || 'GitHub User'}` 
                      : 'Connect your GitHub account'}
                  </span>
                </div>
              </div>
              {hasGithub ? (
                <button
                  onClick={() => handleUnlinkProvider('github.com')}
                  disabled={actionLoading !== null}
                  className="text-xs text-white/50 hover:text-white transition-colors disabled:opacity-40"
                >
                  {actionLoading === 'unlink-github.com' ? 'Disconnecting...' : 'Disconnect'}
                </button>
              ) : (
                <button
                  onClick={() => handleLinkProvider('github.com')}
                  disabled={actionLoading !== null}
                  className="text-xs text-white/90 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] px-3 py-1.5 rounded-lg border border-white/[0.06] transition-colors disabled:opacity-40 flex items-center gap-1.5"
                >
                  {actionLoading === 'github.com' && <Loader2 className="w-3 h-3 animate-spin" />}
                  Connect
                </button>
              )}
            </div>

            {/* Google Provider */}
            <div className={`flex items-center justify-between p-4 rounded-xl border ${hasGoogle ? 'border-white/[0.06] bg-[#050505]' : 'border-dashed border-white/[0.1] bg-transparent'}`}>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 opacity-80" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white/90">Google</span>
                  <span className="text-[11px] text-white/40">
                    {hasGoogle 
                      ? `Connected as ${googleAccount?.displayName || googleAccount?.email || 'Google User'}` 
                      : 'Connect your Google account'}
                  </span>
                </div>
              </div>
              {hasGoogle ? (
                <button
                  onClick={() => handleUnlinkProvider('google.com')}
                  disabled={actionLoading !== null}
                  className="text-xs text-white/50 hover:text-white transition-colors disabled:opacity-40"
                >
                  {actionLoading === 'unlink-google.com' ? 'Disconnecting...' : 'Disconnect'}
                </button>
              ) : (
                <button
                  onClick={() => handleLinkProvider('google.com')}
                  disabled={actionLoading !== null}
                  className="text-xs text-white/90 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] px-3 py-1.5 rounded-lg border border-white/[0.06] transition-colors disabled:opacity-40 flex items-center gap-1.5"
                >
                  {actionLoading === 'google.com' && <Loader2 className="w-3 h-3 animate-spin" />}
                  Connect
                </button>
              )}
            </div>

          </div>
        </section>

        {/* Danger Zone */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-red-400">Danger Zone</h2>
          <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-white/90">Delete Account</span>
              <span className="text-xs text-white/50 leading-relaxed max-w-sm">
                Permanently delete your account and all of its contents from the Derivo platform. This action is not reversible.
              </span>
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={actionLoading !== null}
              className="px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors shrink-0 disabled:opacity-40 flex items-center gap-1.5"
            >
              {actionLoading === 'delete' && <Loader2 className="w-3 h-3 animate-spin" />}
              Delete Account
            </button>
          </div>
        </section>

      </div>
    </DashboardLayout>
  );
}
