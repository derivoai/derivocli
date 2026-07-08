import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { useUserProfile } from '../../hooks/useUserProfile';
import { auth, db, doc, setDoc } from '../../lib/firebase';
import { updateProfile } from 'firebase/auth';

type Step = 'name' | 'questions';

const USE_CASES = [
  'Personal projects',
  'Startup / small team',
  'Enterprise',
  'Open source',
  'Just exploring',
];

const REFERRAL_SOURCES = [
  'Search engine',
  'GitHub',
  'Twitter / X',
  'Friend or colleague',
  'Blog or article',
  'Other',
];

const PERSONAS = [
  'Frontend developer',
  'Backend developer',
  'Full-stack developer',
  'DevOps / Platform',
  'Engineering lead',
  'Student',
  'Other',
];

function ChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-xs font-medium text-foreground ml-0.5">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(active ? '' : opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                active
                  ? 'bg-accent text-accent-foreground border-accent'
                  : 'bg-background text-foreground border-border hover:bg-secondary'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Onboarding() {
  const navigate = useNavigate();
  const { currentUser, profile, loading } = useUserProfile();

  const [step, setStep] = useState<Step>('questions');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [useCase, setUseCase] = useState('');
  const [referralSource, setReferralSource] = useState('');
  const [persona, setPersona] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Decide initial step + prefill once auth/profile resolves.
  useEffect(() => {
    if (loading) return;

    if (!currentUser) {
      navigate('/login', { replace: true });
      return;
    }

    // Already finished onboarding -> straight to the dashboard.
    if (profile?.onboardingCompleted) {
      navigate('/dashboard', { replace: true });
      return;
    }

    // OAuth (or any) users missing a name complete it first. Prefill from any
    // available display name.
    const hasName = Boolean(profile?.firstName || profile?.lastName);
    if (!hasName) {
      const display = currentUser.displayName || '';
      const [f, ...rest] = display.trim().split(/\s+/);
      setFirstName(profile?.firstName || f || '');
      setLastName(profile?.lastName || rest.join(' ') || '');
      setStep('name');
    } else {
      setFirstName(profile?.firstName || '');
      setLastName(profile?.lastName || '');
      setStep('questions');
    }
  }, [loading, currentUser, profile, navigate]);

  const handleNameContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!firstName.trim()) {
      setError('Please enter your first name.');
      return;
    }
    if (!currentUser) return;
    setSaving(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      await updateProfile(currentUser, { displayName: fullName });
      await setDoc(
        doc(db, 'users', currentUser.uid),
        {
          name: fullName,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: currentUser.email || '',
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      setStep('questions');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not save your name. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Persist onboarding answers (or just the completion flag when skipping).
  const finishOnboarding = async (withAnswers: boolean) => {
    if (!currentUser) return;
    setSaving(true);
    setError('');
    try {
      await setDoc(
        doc(db, 'users', currentUser.uid),
        {
          onboardingCompleted: true,
          ...(withAnswers
            ? {
                onboarding: {
                  useCase: useCase || null,
                  referralSource: referralSource || null,
                  persona: persona || null,
                  completedAt: new Date().toISOString(),
                },
              }
            : { onboardingSkipped: true }),
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch (err) {
      // Onboarding is non-critical — never block the user from entering.
      console.warn('Could not persist onboarding answers:', err);
    } finally {
      setSaving(false);
      navigate('/dashboard', { replace: true });
    }
  };

  if (loading || !currentUser) {
    return (
      <AuthLayout title="Setting things up" subtitle="One moment…">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        </div>
      </AuthLayout>
    );
  }

  if (step === 'name') {
    return (
      <AuthLayout title="Tell us your name" subtitle="So we know what to call you">
        <form className="flex flex-col gap-4" onSubmit={handleNameContinue}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="ob-first" className="text-xs font-medium text-foreground ml-1">
                First Name
              </label>
              <input
                type="text"
                id="ob-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                required
                autoFocus
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="ob-last" className="text-xs font-medium text-foreground ml-1">
                Last Name
              </label>
              <input
                type="text"
                id="ob-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && (
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            )}
            Continue
            {!saving && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={`Welcome${firstName ? `, ${firstName}` : ''}`}
      subtitle="Help us tailor Derivo to you. You can skip this."
    >
      <div className="flex flex-col gap-6">
        <ChipGroup
          label="What will you use Derivo for?"
          options={USE_CASES}
          value={useCase}
          onChange={setUseCase}
        />
        <ChipGroup
          label="Where did you hear about us?"
          options={REFERRAL_SOURCES}
          value={referralSource}
          onChange={setReferralSource}
        />
        <ChipGroup
          label="What best describes you?"
          options={PERSONAS}
          value={persona}
          onChange={setPersona}
        />

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 mt-2">
          <button
            type="button"
            onClick={() => finishOnboarding(false)}
            disabled={saving}
            className="py-3 px-5 rounded-xl bg-background border border-border hover:bg-secondary transition-all text-sm font-medium text-foreground disabled:opacity-50"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={() => finishOnboarding(true)}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {saving ? 'Saving…' : 'Finish'}
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
