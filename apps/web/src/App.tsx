/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Landing is the LCP route — keep it eager so it paints immediately without a
// Suspense fallback flash. Everything else is lazy so its JS (and Firebase) is
// never shipped in the landing critical path.
import { Landing } from './pages/Landing';

// ── Lazy routes ──────────────────────────────────────────────────────────────
const Docs = lazy(() => import('./pages/Docs').then((m) => ({ default: m.Docs })));
const PrivacyPolicy = lazy(() =>
  import('./pages/legal/PrivacyPolicy').then((m) => ({ default: m.PrivacyPolicy })),
);
const TermsOfService = lazy(() =>
  import('./pages/legal/TermsOfService').then((m) => ({ default: m.TermsOfService })),
);
const Login = lazy(() => import('./pages/auth/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./pages/auth/Register').then((m) => ({ default: m.Register })));
const ForgotPassword = lazy(() =>
  import('./pages/auth/ForgotPassword').then((m) => ({ default: m.ForgotPassword })),
);
const ResetPassword = lazy(() =>
  import('./pages/auth/ResetPassword').then((m) => ({ default: m.ResetPassword })),
);
const VerifyEmail = lazy(() =>
  import('./pages/auth/VerifyEmail').then((m) => ({ default: m.VerifyEmail })),
);
const Action = lazy(() => import('./pages/auth/Action').then((m) => ({ default: m.Action })));
const Onboarding = lazy(() =>
  import('./pages/auth/Onboarding').then((m) => ({ default: m.Onboarding })),
);
const CliLogin = lazy(() => import('./pages/auth/CliLogin').then((m) => ({ default: m.CliLogin })));
const DashboardHome = lazy(() =>
  import('./pages/dashboard/Home').then((m) => ({ default: m.DashboardHome })),
);
const Projects = lazy(() =>
  import('./pages/dashboard/Projects').then((m) => ({ default: m.Projects })),
);
const Devices = lazy(() =>
  import('./pages/dashboard/Devices').then((m) => ({ default: m.Devices })),
);
const ApiKeys = lazy(() =>
  import('./pages/dashboard/ApiKeys').then((m) => ({ default: m.ApiKeys })),
);
const Activity = lazy(() =>
  import('./pages/dashboard/Activity').then((m) => ({ default: m.Activity })),
);
const Billing = lazy(() =>
  import('./pages/dashboard/Billing').then((m) => ({ default: m.Billing })),
);
const Sessions = lazy(() =>
  import('./pages/dashboard/Sessions').then((m) => ({ default: m.Sessions })),
);
const Settings = lazy(() =>
  import('./pages/dashboard/Settings').then((m) => ({ default: m.Settings })),
);

// Provider + guards are only needed by app routes. Lazy-loaded together so
// Firebase is pulled in ONLY when an app route is visited.
const AppProviders = lazy(() => import('./providers/AppProviders'));
const ProtectedLayout = lazy(() =>
  import('./providers/GuardLayouts').then((m) => ({ default: m.ProtectedLayout })),
);
const PublicAuthLayout = lazy(() =>
  import('./providers/GuardLayouts').then((m) => ({ default: m.PublicAuthLayout })),
);
const VerifyEmailLayout = lazy(() =>
  import('./providers/GuardLayouts').then((m) => ({ default: m.VerifyEmailLayout })),
);

// Minimal, brandless fallback — dark canvas to avoid a white flash / CLS.
function RouteFallback() {
  return <div className="min-h-screen bg-[#080808]" aria-hidden="true" />;
}

export default function App() {
  return (
    <Router>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* ── Public marketing routes (no Firebase, no provider) ── */}
          <Route path="/" element={<Landing />} />
          <Route path="/features" element={<Landing />} />
          <Route path="/how-it-works" element={<Landing />} />
          <Route path="/pricing" element={<Landing />} />
          <Route path="/blog" element={<Landing />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/docs/:slug" element={<Docs />} />
          <Route path="/privacy-policies" element={<PrivacyPolicy />} />
          <Route path="/terms-of-services" element={<TermsOfService />} />

          {/* ── App routes (UserProfileProvider mounted once via layout) ── */}
          <Route element={<AppProviders />}>
            {/* Public auth (redirects away if already signed in) */}
            <Route element={<PublicAuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>

            {/* Email-link handlers — public regardless of session state */}
            <Route path="/cli-login" element={<CliLogin />} />
            <Route path="/action" element={<Action />} />

            {/* Email verification gate */}
            <Route element={<VerifyEmailLayout />}>
              <Route path="/verify-email" element={<VerifyEmail />} />
            </Route>

            {/* Protected dashboard + aliases */}
            <Route element={<ProtectedLayout />}>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/dashboard" element={<DashboardHome />} />
              <Route path="/dashboard/projects" element={<Projects />} />
              <Route path="/dashboard/devices" element={<Devices />} />
              <Route path="/dashboard/keys" element={<ApiKeys />} />
              <Route path="/dashboard/activity" element={<Activity />} />
              <Route path="/dashboard/billing" element={<Billing />} />
              <Route path="/dashboard/sessions" element={<Sessions />} />
              <Route path="/dashboard/settings" element={<Settings />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/billing" element={<Billing />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}
