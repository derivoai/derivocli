import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DerivoPreview } from '../components/light/DerivoPreview';
import { CommandLine } from '../components/CommandLine';
import { LightNavbar } from '../components/light/LightNavbar';
import { CLIDemo } from '../components/light/CLIDemo';
import { Ecosystem } from '../components/light/Ecosystem';
import { Features } from '../components/light/Features';
import { Comparison } from '../components/light/Comparison';
import { Commands } from '../components/light/Commands';
import { HowItWorks } from '../components/light/HowItWorks';
import { UseCases } from '../components/light/UseCases';
import { Security } from '../components/light/Security';
import { Pricing } from '../components/light/Pricing';
import { FAQ } from '../components/light/FAQ';
import { CTA } from '../components/light/CTA';
import { Footer } from '../components/light/Footer';

const ease = [0.16, 1, 0.3, 1] as const;

export function LightLanding() {
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const previewScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 0.94]);
  const previewY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -40]);
  const previewOpacity = useTransform(scrollYProgress, [0, 0.8], [1, reduce ? 1 : 0.55]);

  return (
    <div className="lightui min-h-screen bg-background font-body text-foreground">
      <LightNavbar />

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover z-0"
          autoPlay
          muted
          loop
          playsInline
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4"
        />

        <div className="relative z-10 flex flex-col items-center w-full px-6 pt-24 md:pt-32 pb-8">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
            className="text-center font-display text-5xl md:text-6xl lg:text-[5rem] leading-[0.95] tracking-tight text-foreground max-w-2xl"
          >
            Stop configuring. Start <span className="italic">shipping</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease }}
            className="mt-4 text-center text-base md:text-lg text-muted-foreground max-w-[650px] leading-relaxed"
          >
            Derivo configures runtime versions, validates Docker daemons, and prepares local
            databases in seconds—so you can just clone and code.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease }}
            className="mt-6 flex items-center gap-3"
          >
            <Link
              to="/register"
              className="rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 group"
            >
              Install CLI
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/docs"
              className="rounded-full border border-border bg-background px-6 py-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              Read the docs
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease }}
          >
            <CommandLine command="npm install -g derivo" variant="pill" className="mt-6" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease }}
            className="mt-10 w-full max-w-3xl"
          >
            <motion.div
              style={{
                scale: previewScale,
                y: previewY,
                opacity: previewOpacity,
                background: 'rgba(255, 255, 255, 0.55)',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                boxShadow: 'var(--shadow-dashboard)',
              }}
              className="origin-top rounded-2xl overflow-hidden p-3 md:p-4 backdrop-blur-2xl"
            >
              <DerivoPreview />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Sections ───────────────────────────────────────────────────────── */}
      <Ecosystem />
      <CLIDemo />
      <Comparison />
      <Features />
      <Commands />
      <HowItWorks />
      <UseCases />
      <Security />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
