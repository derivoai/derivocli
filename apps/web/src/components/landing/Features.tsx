import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cpu,
  Database,
  Network,
  FileCode,
  Layers,
  RefreshCw,
  Check,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

interface Scenario {
  id: string;
  title: string;
  icon: any;
  desc: string;
  steps: {
    analysis: string[];
    resolution: string[];
    verification: string[];
  };
}

const scenarios: Scenario[] = [
  {
    id: 'node-version',
    title: 'Wrong Node Version',
    icon: Cpu,
    desc: 'Project requires Node v20.x, but system is running v16.x.',
    steps: {
      analysis: [
        'Reading target version from .nvmrc...',
        'Target engine configured: v20.11.0',
        'Current machine engine: v16.20.2',
        'Engine mismatch flagged',
      ],
      resolution: [
        'Activating Node version v20.11.0 via fnm...',
        'Updating local PATH variable...',
        'Syncing global shell configuration...',
      ],
      verification: [
        'Executing node --version...',
        'Engine response verified: v20.11.0',
        'Developer workspace re-validated',
      ],
    },
  },
  {
    id: 'redis',
    title: 'Redis Not Running',
    icon: Database,
    desc: 'Redis client failed to connect to localhost:6379.',
    steps: {
      analysis: [
        'Testing TCP port 6379 connectivity...',
        'Port 6379 is closed or unreachable',
        'Scanning running service processes...',
        'Redis instance not running natively',
      ],
      resolution: [
        'Locating local Docker containers...',
        'Found container: derivo-redis (Stopped)',
        'Executing: docker start derivo-redis...',
        'Container booted successfully',
      ],
      verification: [
        'Pinging Redis database connection...',
        'Received: PONG (1.2ms latency)',
        'Redis client handshake complete',
      ],
    },
  },
  {
    id: 'port-in-use',
    title: 'Port Already In Use',
    icon: Network,
    desc: 'Port 3000 is occupied by a stale zombie process.',
    steps: {
      analysis: [
        'Attempting socket bind on port 3000...',
        'Socket error: EADDRINUSE',
        'Querying network socket tables...',
        'Stale PID identified: 84920 (node)',
      ],
      resolution: [
        'Sending SIGTERM to process 84920...',
        'Process unresponsive. Escalating...',
        'Sending SIGKILL (Force Kill) to 84920...',
        'Port 3000 released successfully',
      ],
      verification: [
        'Verifying port 3000 socket availability...',
        'Port open. Local server binding allowed',
        'No other conflicting services detected',
      ],
    },
  },
  {
    id: 'env-config',
    title: 'Missing .env Configuration',
    icon: FileCode,
    desc: 'Database credentials and API secret keys are missing.',
    steps: {
      analysis: [
        'Checking workspace root directory...',
        'File .env not found',
        'Locating template file .env.example...',
        'Template verified successfully',
      ],
      resolution: [
        'Copying template to active .env...',
        'Generating dynamic JWT_SECRET token...',
        'Injecting secure dev credentials...',
        'Populating local environment values',
      ],
      verification: [
        'Validating newly created .env structure...',
        'All 12 required keys populated correctly',
        'Environment config schema matching signature',
      ],
    },
  },
  {
    id: 'docker-offline',
    title: 'Docker Daemon Offline',
    icon: Layers,
    desc: 'Docker engine socket is not responding to client requests.',
    steps: {
      analysis: [
        'Attempting ping to Docker unix socket...',
        'Connection refused (Daemon offline)',
        'Querying background system services...',
        'Docker engine service found: Disabled',
      ],
      resolution: [
        'Enabling Docker system service daemon...',
        'Executing background service start...',
        'Initializing local engine runtime...',
        'Docker daemon successfully booted',
      ],
      verification: [
        'Running Docker client handshake...',
        'Docker engine connection: Active (v24.0.7)',
        'Container networks online',
      ],
    },
  },
  {
    id: 'db-schema',
    title: 'Database Schema Out of Sync',
    icon: RefreshCw,
    desc: 'Migrations are 4 versions behind upstream repository.',
    steps: {
      analysis: [
        'Connecting to local PostgreSQL instance...',
        'Querying migration tables...',
        'Local schema version: v12',
        'Upstream schema version: v16 (4 behind)',
      ],
      resolution: [
        'Running database migrations...',
        'Applying migration 013_auth.sql...',
        'Applying migration 014_billing.sql...',
        'Applying migration 015_teams.sql...',
        'Applying migration 016_indices.sql...',
      ],
      verification: [
        'Validating table indices and constraints...',
        'Seeding database mockup fixtures...',
        'Schema state matches upstream main',
      ],
    },
  },
];

type Phase = 'analysis' | 'resolution' | 'verification';
type PhaseLogs = Record<Phase, string[]>;
const emptyLogs = (): PhaseLogs => ({ analysis: [], resolution: [], verification: [] });

const PHASES: { key: Phase; label: string; accent: string }[] = [
  { key: 'analysis', label: 'Analysis', accent: 'text-sky-300' },
  { key: 'resolution', label: 'Resolution', accent: 'text-indigo-300' },
  { key: 'verification', label: 'Verification', accent: 'text-amber-300' },
];

export function Features() {
  const [selectedId, setSelectedId] = useState('node-version');
  const [activeStep, setActiveStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [logs, setLogs] = useState<PhaseLogs>(emptyLogs);

  const sectionRef = useRef<HTMLDivElement>(null);
  const [hasEnteredViewport, setHasEnteredViewport] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting && !hasEnteredViewport) setHasEnteredViewport(true);
      },
      { threshold: 0.1 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [hasEnteredViewport]);

  const activeScenario = scenarios.find((s) => s.id === selectedId) || scenarios[0];

  useEffect(() => {
    if (!hasEnteredViewport) return;

    let cancelled = false;
    setActiveStep(0);
    setLogs(emptyLogs());

    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const stream = async (phase: Phase, lines: string[], gap: number) => {
      for (const line of lines) {
        if (cancelled) return;
        setLogs((prev) => ({ ...prev, [phase]: [...prev[phase], line] }));
        await wait(gap);
      }
    };

    const run = async () => {
      setActiveStep(0);
      await wait(650);
      if (cancelled) return;

      setActiveStep(1);
      await stream('analysis', activeScenario.steps.analysis, 320);
      await wait(350);
      if (cancelled) return;

      setActiveStep(2);
      await stream('resolution', activeScenario.steps.resolution, 400);
      await wait(350);
      if (cancelled) return;

      setActiveStep(3);
      await stream('verification', activeScenario.steps.verification, 320);
      await wait(450);
      if (cancelled) return;

      setActiveStep(4);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [selectedId, hasEnteredViewport, activeScenario]);

  const railProgress = activeStep === 0 ? 0 : activeStep / 4;

  return (
    <section
      ref={sectionRef}
      className="w-full max-w-6xl mx-auto px-6 mt-32 md:mt-40 relative z-10 text-left"
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-3xl mb-14"
      >
        <div className="flex items-center gap-2.5">
          <span className="h-px w-8 bg-gradient-to-r from-white/40 to-transparent" />
          <span className="text-[11px] font-mono tracking-[0.2em] text-white/40 uppercase">
            Automated Recovery
          </span>
        </div>
        <h2 className="text-4xl md:text-[3.25rem] font-bold tracking-tight mt-4 leading-[1.05] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/55">
          We don&apos;t just report errors.
          <br className="hidden sm:block" /> We fix them.
        </h2>
        <p className="mt-5 text-base md:text-lg text-white/45 max-w-xl font-light leading-relaxed">
          Derivo diagnoses local environment friction, resolves dependency alignment, and clears
          setup blockers automatically — while you keep building.
        </p>
      </motion.div>

      {/* ── Body ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        {/* Left — Issue Library */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/35">
              Issue Library
            </span>
            <span className="text-[10px] font-mono text-white/25">{scenarios.length} detected</span>
          </div>

          <div className="flex flex-col gap-2">
            {scenarios.map((sc) => {
              const Icon = sc.icon;
              const isSelected = selectedId === sc.id;
              const status = !isSelected ? 'error' : activeStep === 4 ? 'healthy' : 'repairing';

              return (
                <button
                  key={sc.id}
                  onClick={() => setSelectedId(sc.id)}
                  className={`group relative w-full text-left rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 cursor-pointer overflow-hidden shadow-sm ${
                    isSelected
                      ? 'border-white/15 bg-white/[0.04] shadow-md shadow-black/10'
                      : 'border-white/[0.06] bg-[#0c0c0e]/30 hover:border-white/12 hover:bg-[#141416]/40'
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="issueAccent"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-full ${
                        status === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                  )}

                  <div className="relative z-10 flex items-center gap-4 p-4">
                    <div
                      className={`grid place-items-center w-11 h-11 rounded-xl border shrink-0 transition-colors ${
                        isSelected
                          ? 'border-white/15 bg-white/[0.06] text-white'
                          : 'border-white/[0.07] bg-white/[0.02] text-white/40 group-hover:text-white/70'
                      }`}
                    >
                      <Icon className="w-[18px] h-[18px]" strokeWidth={1.6} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`text-sm font-medium truncate transition-colors ${
                            isSelected ? 'text-white' : 'text-white/75 group-hover:text-white/90'
                          }`}
                        >
                          {sc.title}
                        </span>
                        <StatusChip status={status} />
                      </div>
                      <p className="text-xs text-white/40 font-light mt-1 truncate leading-relaxed">
                        {sc.desc}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right — Repair Engine console */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/35">
              Internal Repair Engine
            </span>
            <LiveBadge healthy={activeStep === 4} />
          </div>

          <div className="relative flex-1 rounded-2xl border border-white/10 bg-[#0e0e11]/80 backdrop-blur-xl overflow-hidden flex flex-col min-h-[480px] shadow-[0_0_60px_rgba(124,58,237,0.08),0_40px_80px_-30px_rgba(0,0,0,0.95)]">
            {/* top sheen */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

            {/* console title bar */}
            <div className="flex items-center gap-3 px-5 h-12 border-b border-white/[0.07] bg-white/[0.015]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-white/15" />
                <span className="w-3 h-3 rounded-full bg-white/15" />
                <span className="w-3 h-3 rounded-full bg-white/15" />
              </div>
              <span className="text-[11px] font-mono text-white/40 truncate">
                derivo repair <span className="text-white/25">·</span> {activeScenario.id}
              </span>
              <span className="ml-auto text-[10px] font-mono text-white/30 tabular-nums">
                {Math.round(railProgress * 100)}%
              </span>
            </div>

            {/* body */}
            <div className="relative flex-1 p-6 md:p-7">
              {/* progress rail */}
              <div className="absolute left-[38px] top-8 bottom-8 w-px bg-white/[0.08]" />
              <motion.div
                className="absolute left-[38px] top-8 w-px origin-top bg-gradient-to-b from-rose-400 via-sky-400 to-emerald-400"
                style={{ bottom: 32 }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: railProgress }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />

              <div className="relative space-y-6">
                {/* Issue found */}
                <Step
                  index={0}
                  activeStep={activeStep}
                  title="Issue Detected"
                  tone="rose"
                  idleIcon={<AlertTriangle className="w-3.5 h-3.5" />}
                >
                  <p className="text-xs font-mono text-white/65 mt-1 leading-relaxed select-text">
                    <span className="text-rose-300/80">{activeScenario.title}</span> —{' '}
                    {activeScenario.desc}
                  </p>
                </Step>

                {/* Phases */}
                {PHASES.map((phase, i) => {
                  const stepIndex = (i + 1) as 1 | 2 | 3;
                  return (
                    <Step
                      key={phase.key}
                      index={stepIndex}
                      activeStep={activeStep}
                      title={phase.label}
                      tone="sky"
                    >
                      <LogList lines={logs[phase.key]} accent={phase.accent} />
                    </Step>
                  );
                })}

                {/* Healthy */}
                <Step
                  index={4}
                  activeStep={activeStep}
                  title="Environment Healthy"
                  tone="emerald"
                  idleIcon={<ShieldCheck className="w-3.5 h-3.5" />}
                  last
                >
                  <AnimatePresence>
                    {activeStep === 4 && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2 font-mono text-[11px] text-emerald-300/85"
                      >
                        {[
                          'Environment Healthy',
                          'Services Running',
                          'Configuration Valid',
                          'Ready to Develop',
                        ].map((t) => (
                          <div key={t} className="flex items-center gap-1.5">
                            <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>{t}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Step>
              </div>
            </div>

            {/* footer status */}
            <div className="border-t border-white/[0.07] bg-white/[0.012] px-5 h-[68px] flex items-center">
              <AnimatePresence mode="wait">
                {activeStep === 4 ? (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex flex-col">
                      <span className="text-[9px] font-mono text-white/30 uppercase tracking-[0.18em]">
                        System Status
                      </span>
                      <span className="text-sm font-semibold text-white/90 mt-0.5">
                        Environment repaired
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-emerald-300/90">
                      {['Node.js', 'Docker', 'Redis', 'Database'].map((s) => (
                        <span key={s} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
                          <span className="hidden sm:inline">{s}</span>
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="running"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full flex items-center gap-2.5 text-[11px] font-mono text-white/65"
                  >
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white/60" />
                    <span>Repairing environment</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white/25" />
                    <span className="text-white/60">{activeScenario.title}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Status chip in the issue list ─────────────────────────────── */
function StatusChip({ status }: { status: 'error' | 'repairing' | 'healthy' }) {
  const map = {
    error: { dot: 'bg-rose-500', text: 'text-rose-300/70', label: 'error' },
    repairing: { dot: 'bg-amber-400 animate-pulse', text: 'text-amber-300/80', label: 'repairing' },
    healthy: { dot: 'bg-emerald-400', text: 'text-emerald-300/80', label: 'healthy' },
  }[status];

  return (
    <span className="flex items-center gap-1.5 shrink-0">
      <span className={`w-1.5 h-1.5 rounded-full ${map.dot}`} />
      <span
        className={`text-[9px] font-mono uppercase tracking-[0.12em] ${map.text} hidden sm:inline`}
      >
        {map.label}
      </span>
    </span>
  );
}

/* ── Live badge above console ──────────────────────────────────── */
function LiveBadge({ healthy }: { healthy: boolean }) {
  return (
    <span
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-mono uppercase tracking-[0.14em] transition-colors ${
        healthy
          ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
          : 'border-amber-400/25 bg-amber-400/10 text-amber-300'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${healthy ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}
      />
      {healthy ? 'stable' : 'live'}
    </span>
  );
}

/* ── Streaming log lines ───────────────────────────────────────── */
function LogList({ lines, accent }: { lines: string[]; accent: string }) {
  if (lines.length === 0) return null;
  return (
    <div className="space-y-1 mt-1.5 font-mono text-[11px] text-white/45">
      {lines.map((line, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -3 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-start gap-2 leading-relaxed"
        >
          <span className={`${accent} select-none`}>❯</span>
          <span>{line}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ── A single pipeline step ────────────────────────────────────── */
function Step({
  index,
  activeStep,
  title,
  tone,
  idleIcon,
  children,
  last,
}: {
  index: number;
  activeStep: number;
  title: string;
  tone: 'rose' | 'sky' | 'emerald';
  idleIcon?: React.ReactNode;
  children?: React.ReactNode;
  last?: boolean;
}) {
  const isPast = activeStep > index;
  const isActive = activeStep === index;
  const isFuture = activeStep < index;

  const toneRing = {
    rose: 'border-rose-400/60 bg-rose-500/10 text-rose-300 shadow-[0_0_16px_rgba(244,63,94,0.25)]',
    sky: 'border-sky-400/60 bg-sky-500/10 text-sky-300 shadow-[0_0_16px_rgba(56,189,248,0.25)]',
    emerald:
      'border-emerald-400/60 bg-emerald-500/10 text-emerald-300 shadow-[0_0_16px_rgba(52,211,153,0.3)]',
  }[tone];

  // The final "healthy" node shows a check only once reached.
  const showSpinner = isActive && !last && tone === 'sky';

  return (
    <div
      className={`flex gap-5 items-start transition-opacity duration-300 ${
        isFuture ? 'opacity-35' : 'opacity-100'
      }`}
    >
      <div
        className={`grid place-items-center w-6 h-6 rounded-full border shrink-0 relative z-10 bg-[#0a0a0c] transition-all duration-300 ${
          isPast
            ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-300'
            : isActive
              ? toneRing
              : 'border-white/10 text-white/25'
        }`}
      >
        {isPast ? (
          <Check className="w-3 h-3" />
        ) : showSpinner ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          (idleIcon ?? <span className="w-1.5 h-1.5 rounded-full bg-current" />)
        )}
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        <h3
          className={`text-[13px] font-semibold tracking-tight transition-colors ${
            isActive ? 'text-white' : isPast ? 'text-white/65' : 'text-white/35'
          }`}
        >
          {title}
        </h3>
        <div>{children}</div>
      </div>
    </div>
  );
}
