import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/dashboard/layout/DashboardLayout';
import { Github, AlertTriangle, User as UserIcon, Check } from 'lucide-react';
import { useUserProfile } from '../../hooks/useUserProfile';
import { getPlanLabel, parseFirebaseDate } from '../../lib/subscription';
import { auth, db, doc, setDoc, deleteDoc } from '../../lib/firebase';
import {
  updateProfile,
  linkWithPopup,
  unlink,
  deleteUser,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut,
} from 'firebase/auth';
import { PageHeader } from '../../components/dashboard/shared/PageHeader';
import { ConfirmDialog } from '../../components/dashboard/shared/ConfirmDialog';
import { Section, Card, Btn, Divider } from '../../components/dashboard/ui/kit';

export function Settings() {
  const navigate = useNavigate();
  const { currentUser, profile, subscription, loading } = useUserProfile();

  const [name, setName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [avatarError, setAvatarError] = useState(false);
  const [clearAvatar, setClearAvatar] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setAvatarPreview(currentUser?.photoURL || '');
      setAvatarError(false);
    }
  }, [profile, currentUser]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-8 max-w-3xl">
          <div className="h-10 w-48 bg-secondary animate-pulse rounded-lg" />
          <div className="h-48 bg-secondary animate-pulse rounded-[14px]" />
          <div className="h-32 bg-secondary animate-pulse rounded-[14px]" />
        </div>
      </DashboardLayout>
    );
  }

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
      const existingPhotoUrl = currentUser.photoURL ?? null;
      let nextPhotoUrl: string | null = existingPhotoUrl;
      if (clearAvatar) nextPhotoUrl = null;
      else if (avatarFile) nextPhotoUrl = existingPhotoUrl;

      await updateProfile(currentUser, { displayName: name, photoURL: nextPhotoUrl });

      try {
        await setDoc(
          doc(db, 'users', currentUser.uid),
          { name, updatedAt: new Date().toISOString() },
          { merge: true },
        );
      } catch (firestoreErr: any) {
        console.warn('Could not update Firestore profile:', firestoreErr);
      }

      setAvatarFile(null);
      setClearAvatar(false);
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
    e.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Image size must be less than 2MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please choose a JPG, PNG, GIF, or WebP image.');
      return;
    }
    setErrorMsg('');
    setClearAvatar(false);
    setAvatarFile(file);
    setAvatarError(false);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setClearAvatar(true);
    setAvatarPreview('');
    setAvatarError(false);
  };

  const handleLinkProvider = async (providerId: string) => {
    if (!currentUser) return;
    setErrorMsg('');
    setSuccessMsg('');
    setActionLoading(providerId);
    try {
      let provider;
      if (providerId === 'google.com') provider = new GoogleAuthProvider();
      else if (providerId === 'github.com') provider = new GithubAuthProvider();
      else throw new Error('Unsupported provider linking.');
      await linkWithPopup(currentUser, provider);
      await currentUser.reload();
      setSuccessMsg(
        `Successfully linked ${providerId === 'google.com' ? 'Google' : 'GitHub'} account.`,
      );
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/credential-already-in-use')
        setErrorMsg('This social account is already linked to another Derivo user.');
      else setErrorMsg(err.message || 'Failed to link account.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnlinkProvider = async (providerId: string) => {
    if (!currentUser) return;
    if (providers.length <= 1) {
      setErrorMsg(
        'You cannot disconnect your only connected account. Please link another sign-in option first.',
      );
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setActionLoading(`unlink-${providerId}`);
    try {
      await unlink(currentUser, providerId);
      await currentUser.reload();
      setSuccessMsg(
        `Successfully disconnected ${providerId === 'google.com' ? 'Google' : 'GitHub'} account.`,
      );
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to disconnect account.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    setErrorMsg('');
    setSuccessMsg('');
    setActionLoading('delete');
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      try {
        await deleteDoc(userRef);
      } catch (firestoreErr) {
        console.warn('Could not delete Firestore document with deleteDoc:', firestoreErr);
        try {
          await setDoc(
            userRef,
            { deleted: true, deletedAt: new Date().toISOString() },
            { merge: true },
          );
        } catch (innerErr) {
          console.warn('Could not update Firestore document status:', innerErr);
        }
      }
      await deleteUser(currentUser);
      await signOut(auth);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login')
        setErrorMsg(
          'For security reasons, deleting your account requires a recent login. Please sign out, log back in, and try again.',
        );
      else setErrorMsg(err.message || 'Failed to delete account. Please contact support.');
      setConfirmDelete(false);
    } finally {
      setActionLoading(null);
    }
  };

  const providerBox = (connected: boolean) =>
    `flex items-center justify-between p-4 rounded-xl border ${
      connected ? 'border-border bg-secondary/50' : 'border-dashed border-border bg-transparent'
    }`;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 max-w-3xl pb-10">
        <PageHeader
          eyebrow="Account"
          title="Settings"
          description="Manage your profile, connected accounts, and security preferences."
        />

        {successMsg && (
          <Card className="px-4 py-3 !border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            {successMsg}
          </Card>
        )}
        {errorMsg && (
          <Card className="px-4 py-3 !border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </Card>
        )}

        {/* Profile */}
        <Section title="Profile">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-6">
              {avatarPreview && !avatarError ? (
                <img
                  src={avatarPreview}
                  alt={profile?.name || 'User'}
                  onError={() => setAvatarError(true)}
                  className="w-16 h-16 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-xl font-semibold text-accent uppercase overflow-hidden leading-none">
                  {(profile?.name?.charAt(0) || currentUser?.email?.charAt(0) || '?').slice(0, 1)}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-foreground">User Avatar</span>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="cursor-pointer px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Choose Picture
                  </label>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="px-3 py-1.5 rounded-lg bg-secondary border border-border hover:bg-secondary text-xs font-medium text-foreground transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  JPG, PNG, GIF or WebP. Max size 2MB.
                </span>
              </div>
            </div>

            <Divider />

            <form className="flex flex-col gap-4" onSubmit={handleUpdateProfile}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-background border border-border rounded-[10px] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Email Address</label>
                  <input
                    type="email"
                    value={currentUser?.email || ''}
                    className="w-full bg-secondary/50 border border-border rounded-[10px] px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Btn variant="primary" type="submit" busy={updating}>
                  {updating ? 'Saving...' : 'Save Changes'}
                </Btn>
              </div>
            </form>
          </div>
        </Section>

        {/* Subscription */}
        <Section title="Subscription & Plan">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryStat label="Current Plan">{getPlanLabel(subscription)}</SummaryStat>
            <SummaryStat label="Subscription Status">
              <span className="capitalize">{subscription?.status || 'Inactive'}</span>
            </SummaryStat>
            <SummaryStat label="Trial Expiration">
              {subscription?.plan === 'trial'
                ? parseFirebaseDate(subscription.trialEndsAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'N/A'}
            </SummaryStat>
          </div>
        </Section>

        {/* Connected accounts */}
        <Section title="Connected Accounts">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary/50">
              <div className="flex items-center gap-3">
                <UserIcon className="w-5 h-5 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">Email & Password</span>
                  <span className="text-[11px] text-muted-foreground">
                    {hasPassword ? `Connected via ${currentUser?.email}` : 'Not connected'}
                  </span>
                </div>
              </div>
            </div>

            <div className={providerBox(hasGithub)}>
              <div className="flex items-center gap-3">
                <Github className="w-5 h-5 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">GitHub</span>
                  <span className="text-[11px] text-muted-foreground">
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
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                >
                  {actionLoading === 'unlink-github.com' ? 'Disconnecting...' : 'Disconnect'}
                </button>
              ) : (
                <Btn
                  variant="secondary"
                  size="sm"
                  onClick={() => handleLinkProvider('github.com')}
                  busy={actionLoading === 'github.com'}
                  disabled={actionLoading !== null}
                >
                  Connect
                </Btn>
              )}
            </div>

            <div className={providerBox(hasGoogle)}>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 opacity-80" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">Google</span>
                  <span className="text-[11px] text-muted-foreground">
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
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                >
                  {actionLoading === 'unlink-google.com' ? 'Disconnecting...' : 'Disconnect'}
                </button>
              ) : (
                <Btn
                  variant="secondary"
                  size="sm"
                  onClick={() => handleLinkProvider('google.com')}
                  busy={actionLoading === 'google.com'}
                  disabled={actionLoading !== null}
                >
                  Connect
                </Btn>
              )}
            </div>
          </div>
        </Section>

        {/* Danger zone */}
        <Section title="Danger Zone" className="!border-red-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-foreground">Delete Account</span>
              <span className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                Permanently delete your account and all of its contents from the Derivo platform.
                This action is not reversible.
              </span>
            </div>
            <Btn
              variant="danger"
              onClick={() => setConfirmDelete(true)}
              busy={actionLoading === 'delete'}
              className="shrink-0"
            >
              Delete Account
            </Btn>
          </div>
        </Section>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete your account?"
        message="This permanently deletes your user profile, configurations, and active sessions. This action cannot be undone."
        confirmLabel="Delete Account"
        busy={actionLoading === 'delete'}
        onConfirm={handleDeleteAccount}
        onCancel={() => setConfirmDelete(false)}
      />
    </DashboardLayout>
  );
}

function SummaryStat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{children}</span>
    </div>
  );
}
