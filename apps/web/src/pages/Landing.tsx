import { lazy, Suspense, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

// ── Above-the-fold (eager) — LCP-critical, immediately visible. ─────────────
import { Navbar } from '../components/landing/Navbar';
import { Hero } from '../components/landing/Hero';
import { Background } from '../components/landing/Background';
import { CLIDemo } from '../components/landing/CLIDemo';
import { Splash } from '../components/util/Splash';

// ── Below-the-fold sections. Kept as separate chunks (parallel download) but
// PRELOADED behind the splash screen, then rendered all-at-once. Nothing mounts
// during scroll, so there is no on-scroll jank. ─────────────────────────────
const loaders = {
  TrustedBy: () => import('../components/landing/TrustedBy'),
  Features: () => import('../components/landing/Features'),
  Commands: () => import('../components/landing/Commands'),
  DeveloperWorkflow: () => import('../components/landing/DeveloperWorkflow'),
  Security: () => import('../components/landing/Security'),
  PricingPreview: () => import('../components/landing/PricingPreview'),
  FAQ: () => import('../components/landing/FAQ'),
  CTA: () => import('../components/landing/CTA'),
  Footer: () => import('../components/landing/Footer'),
};

const TrustedBy = lazy(() => loaders.TrustedBy().then((m) => ({ default: m.TrustedBy })));
const Features = lazy(() => loaders.Features().then((m) => ({ default: m.Features })));
const Commands = lazy(() => loaders.Commands().then((m) => ({ default: m.Commands })));
const DeveloperWorkflow = lazy(() =>
  loaders.DeveloperWorkflow().then((m) => ({ default: m.DeveloperWorkflow })),
);
const Security = lazy(() => loaders.Security().then((m) => ({ default: m.Security })));
const PricingPreview = lazy(() =>
  loaders.PricingPreview().then((m) => ({ default: m.PricingPreview })),
);
const FAQ = lazy(() => loaders.FAQ().then((m) => ({ default: m.FAQ })));
const CTA = lazy(() => loaders.CTA().then((m) => ({ default: m.CTA })));
const Footer = lazy(() => loaders.Footer().then((m) => ({ default: m.Footer })));

// Minimum splash duration — the boot bar fills over this window.
const SPLASH_MS = 2000;

export function Landing() {
  const location = useLocation();
  // `false` until every section chunk is fetched. The splash covers this gap.
  const [ready, setReady] = useState(false);
  // Drives the splash fade-out (kept mounted one tick longer for the animation).
  const [hideSplash, setHideSplash] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const started = performance.now();

    Promise.all(Object.values(loaders).map((load) => load().catch(() => null))).then(() => {
      if (cancelled) return;
      // Hold the splash for a minimum of 2s (so the boot bar always completes
      // its fill), then reveal the fully-mounted page.
      const elapsed = performance.now() - started;
      const wait = Math.max(0, SPLASH_MS - elapsed);
      window.setTimeout(() => {
        if (cancelled) return;
        setReady(true);
        // Next frame: start the splash fade now that content is painted.
        requestAnimationFrame(() => setHideSplash(true));
      }, wait);
    });

    // Safety net: never trap the user behind the splash if a chunk stalls.
    const safety = window.setTimeout(() => {
      if (cancelled) return;
      setReady(true);
      requestAnimationFrame(() => setHideSplash(true));
    }, SPLASH_MS + 4000);

    return () => {
      cancelled = true;
      window.clearTimeout(safety);
    };
  }, []);

  useEffect(() => {
    // Only scroll when navigating to a specific section (e.g. /features).
    if (!ready) return;
    const path = location.pathname.replace('/', '');
    if (!path) return;
    const el = document.getElementById(path);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.pathname, ready]);

  return (
    <div className="relative min-h-screen bg-[#080808] overflow-x-hidden font-sans text-white selection:bg-white/20">
      {(!ready || !hideSplash) && <Splash hiding={hideSplash} duration={SPLASH_MS} />}

      <Background />
      <Navbar />

      <main className="relative z-10 pt-20 pb-24 flex flex-col items-center">
        <Hero />
        <CLIDemo />

        {ready && (
          <Suspense fallback={null}>
            <TrustedBy />

            <div id="features" className="w-full flex flex-col items-center">
              <Features />
            </div>
            <div id="commands" className="w-full flex flex-col items-center">
              <Commands />
            </div>
            <div id="how-it-works" className="w-full flex flex-col items-center">
              <DeveloperWorkflow />
            </div>
            <div id="security" className="w-full flex flex-col items-center">
              <Security />
            </div>
            <div id="pricing" className="w-full flex flex-col items-center">
              <PricingPreview />
            </div>
            <div id="faq" className="w-full flex flex-col items-center">
              <FAQ />
            </div>
            <CTA />
          </Suspense>
        )}
      </main>

      {ready && (
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      )}
    </div>
  );
}
