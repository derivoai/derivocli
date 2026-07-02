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
  AlertCircle,
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

export function Features() {
  const [selectedId, setSelectedId] = useState('node-version');
  const [activeStep, setActiveStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [logs, setLogs] = useState<string[]>([]);

  const sectionRef = useRef<HTMLDivElement>(null);
  const [hasEnteredViewport, setHasEnteredViewport] = useState(false);

  // Intersection observer to auto play first scenario
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting && !hasEnteredViewport) {
          setHasEnteredViewport(true);
        }
      },
      { threshold: 0.1 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasEnteredViewport]);

  const activeScenario = scenarios.find((s) => s.id === selectedId) || scenarios[0];

  // Pipeline simulation logic
  useEffect(() => {
    if (!hasEnteredViewport) return;

    let isCancelled = false;
    setActiveStep(0);
    setLogs([]);

    const runPipeline = async () => {
      // Step 1: Issue Found
      if (isCancelled) return;
      setActiveStep(0);
      await new Promise((r) => setTimeout(r, 600));

      // Step 2: Analysis
      if (isCancelled) return;
      setActiveStep(1);

      const analysisLogs = activeScenario.steps.analysis;
      for (let i = 0; i < analysisLogs.length; i++) {
        if (isCancelled) return;
        setLogs((prev) => [...prev, analysisLogs[i] || '']);
        await new Promise((r) => setTimeout(r, 350));
      }
      await new Promise((r) => setTimeout(r, 400));

      // Step 3: Resolution
      if (isCancelled) return;
      setActiveStep(2);

      const resolutionLogs = activeScenario.steps.resolution;
      for (let i = 0; i < resolutionLogs.length; i++) {
        if (isCancelled) return;
        setLogs((prev) => [...prev, resolutionLogs[i] || '']);
        await new Promise((r) => setTimeout(r, 450));
      }
      await new Promise((r) => setTimeout(r, 400));

      // Step 4: Verification
      if (isCancelled) return;
      setActiveStep(3);

      const verificationLogs = activeScenario.steps.verification;
      for (let i = 0; i < verificationLogs.length; i++) {
        if (isCancelled) return;
        setLogs((prev) => [...prev, verificationLogs[i] || '']);
        await new Promise((r) => setTimeout(r, 350));
      }
      await new Promise((r) => setTimeout(r, 500));

      // Step 5: Healthy Environment
      if (isCancelled) return;
      setActiveStep(4);
    };

    runPipeline();

    return () => {
      isCancelled = true;
    };
  }, [selectedId, hasEnteredViewport, activeScenario]);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="w-full max-w-6xl mx-auto px-6 mt-32 md:mt-40 relative z-10 text-left"
    >
      {/* Title section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-3xl mb-16"
      >
        <span className="text-[11px] font-mono tracking-widest text-white/30 uppercase">
          Automated Recovery
        </span>
        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mt-3 block leading-[1.1]">
          We don't just report errors. We fix them.
        </h2>
        <p className="mt-4 text-base text-white/50 max-w-xl font-light">
          Derivo diagnoses local environment friction, resolves dependency alignment, and fixes
          setup blockers automatically.
        </p>
      </motion.div>

      {/* Two-column Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        {/* Left Column: Issue Library */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/30 pl-1">
            Issue Library
          </span>
          <div className="flex flex-col gap-3">
            {scenarios.map((sc) => {
              const Icon = sc.icon;
              const isSelected = selectedId === sc.id;

              return (
                <button
                  key={sc.id}
                  onClick={() => setSelectedId(sc.id)}
                  className={`relative w-full text-left p-4 rounded-2xl border transition-all duration-300 group cursor-pointer ${
                    isSelected
                      ? 'bg-white/[0.03] border-white/20 shadow-[0_0_24px_rgba(255,255,255,0.03)]'
                      : 'bg-white/[0.01] border-white/[0.06] hover:bg-white/[0.02] hover:border-white/10'
                  }`}
                >
                  {/* Selected Indicator slide-in */}
                  {isSelected && (
                    <motion.div
                      layoutId="selectedIssueIndicator"
                      className="absolute inset-0 rounded-2xl bg-white/[0.01] border border-white/10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}

                  <div className="relative z-10 flex gap-4 items-start">
                    <div
                      className={`p-2.5 rounded-xl border transition-colors ${
                        isSelected
                          ? 'bg-white/5 border-white/10 text-white'
                          : 'bg-white/[0.02] border-white/[0.08] text-white/40 group-hover:text-white/70'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-sm font-medium transition-colors ${
                            isSelected ? 'text-white' : 'text-white/70 group-hover:text-white/90'
                          }`}
                        >
                          {sc.title}
                        </span>

                        {/* Miniature status dot indicator */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected
                                ? activeStep === 4
                                  ? 'bg-emerald-500 animate-pulse'
                                  : 'bg-amber-500 animate-pulse'
                                : 'bg-red-500/60'
                            }`}
                          />
                          <span className="text-[9px] font-mono tracking-wider uppercase text-white/30 hidden sm:inline">
                            {isSelected ? (activeStep === 4 ? 'healthy' : 'repairing') : 'error'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-white/40 font-light mt-1 line-clamp-1 leading-relaxed">
                        {sc.desc}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Automated Repair Pipeline */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div className="flex flex-col gap-3 h-full justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/30 pl-1">
              Internal Repair Engine
            </span>

            {/* Visualizer Frame */}
            <div className="flex-1 rounded-2xl bg-[#09090a]/80 border border-white/10 p-6 md:p-8 backdrop-blur-xl relative overflow-hidden flex flex-col min-h-[460px] justify-between">
              {/* Vertical connecting line indicator */}
              <div className="absolute left-[38px] top-12 bottom-12 w-[2px] bg-white/[0.06] z-0" />

              {/* Glowing animated line */}
              <motion.div
                className="absolute left-[38px] top-12 w-[2px] bg-gradient-to-b from-red-500 via-cyan-500 to-emerald-500 z-0 origin-top"
                initial={{ scaleY: 0 }}
                animate={{
                  scaleY:
                    activeStep === 0
                      ? 0
                      : activeStep === 1
                        ? 0.25
                        : activeStep === 2
                          ? 0.5
                          : activeStep === 3
                            ? 0.75
                            : 1,
                }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              />

              {/* Node Pipeline Steps */}
              <div className="space-y-7 relative z-10">
                {/* Node 1: Issue Found */}
                <PipelineNode
                  stepIndex={0}
                  activeStep={activeStep}
                  title="Issue Found"
                  colorClass={
                    activeStep === 0
                      ? 'border-red-500 bg-red-950/40 text-red-400'
                      : 'border-white/20 bg-white/5 text-white/60'
                  }
                  icon={<AlertCircle className="w-3.5 h-3.5" />}
                >
                  <p className="text-xs text-white/50 font-mono mt-0.5 select-all">
                    {activeScenario.title}: {activeScenario.desc}
                  </p>
                </PipelineNode>

                {/* Node 2: Analysis */}
                <PipelineNode
                  stepIndex={1}
                  activeStep={activeStep}
                  title="Analysis"
                  colorClass={
                    activeStep === 1
                      ? 'border-cyan-500 bg-cyan-950/40 text-cyan-400'
                      : activeStep > 1
                        ? 'border-white/20 bg-white/5 text-white/60'
                        : 'border-white/5 bg-transparent text-white/20'
                  }
                  icon={
                    activeStep === 1 ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {activeStep >= 1 && (
                    <div className="space-y-1 mt-1 font-mono text-[11px] text-white/40">
                      {logs
                        .filter((_, idx) => idx < 4)
                        .map((log, lIdx) => (
                          <motion.div
                            key={lIdx}
                            initial={{ opacity: 0, x: -3 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-1.5"
                          >
                            <span className="text-cyan-500/50">❯</span>
                            <span>{log}</span>
                          </motion.div>
                        ))}
                    </div>
                  )}
                </PipelineNode>

                {/* Node 3: Resolution */}
                <PipelineNode
                  stepIndex={2}
                  activeStep={activeStep}
                  title="Resolution"
                  colorClass={
                    activeStep === 2
                      ? 'border-indigo-500 bg-indigo-950/40 text-indigo-400'
                      : activeStep > 2
                        ? 'border-white/20 bg-white/5 text-white/60'
                        : 'border-white/5 bg-transparent text-white/20'
                  }
                  icon={
                    activeStep === 2 ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {activeStep >= 2 && (
                    <div className="space-y-1 mt-1 font-mono text-[11px] text-white/40">
                      {logs
                        .filter((_, idx) => idx >= 4 && idx < 7)
                        .map((log, lIdx) => (
                          <motion.div
                            key={lIdx}
                            initial={{ opacity: 0, x: -3 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-1.5"
                          >
                            <span className="text-indigo-500/50">❯</span>
                            <span>{log}</span>
                          </motion.div>
                        ))}
                    </div>
                  )}
                </PipelineNode>

                {/* Node 4: Verification */}
                <PipelineNode
                  stepIndex={3}
                  activeStep={activeStep}
                  title="Verification"
                  colorClass={
                    activeStep === 3
                      ? 'border-amber-500 bg-amber-950/40 text-amber-400'
                      : activeStep > 3
                        ? 'border-white/20 bg-white/5 text-white/60'
                        : 'border-white/5 bg-transparent text-white/20'
                  }
                  icon={
                    activeStep === 3 ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {activeStep >= 3 && (
                    <div className="space-y-1 mt-1 font-mono text-[11px] text-white/40">
                      {logs
                        .filter((_, idx) => idx >= 7)
                        .map((log, lIdx) => (
                          <motion.div
                            key={lIdx}
                            initial={{ opacity: 0, x: -3 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-1.5"
                          >
                            <span className="text-amber-500/50">❯</span>
                            <span>{log}</span>
                          </motion.div>
                        ))}
                    </div>
                  )}
                </PipelineNode>

                {/* Node 5: Healthy Environment */}
                <PipelineNode
                  stepIndex={4}
                  activeStep={activeStep}
                  title="Healthy Environment"
                  colorClass={
                    activeStep === 4
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : 'border-white/5 bg-transparent text-white/20'
                  }
                  icon={<Check className="w-3.5 h-3.5" />}
                >
                  {activeStep === 4 && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-2 gap-2 mt-2 font-mono text-[11px] text-emerald-400/80"
                    >
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>Environment Healthy</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>Services Running</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>Configuration Valid</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>Ready to Develop</span>
                      </div>
                    </motion.div>
                  )}
                </PipelineNode>
              </div>

              {/* Bottom Status Panel - slide in on complete */}
              <div className="h-16 mt-6 relative overflow-hidden flex items-end">
                <AnimatePresence>
                  {activeStep === 4 && (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 30 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                      className="w-full bg-white/[0.02] border border-white/10 rounded-xl p-3.5 flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest leading-none">
                          System Status
                        </span>
                        <span className="text-xs font-semibold text-white/80 mt-1">
                          Environment Repaired
                        </span>
                      </div>

                      {/* Pill statuses list */}
                      <div className="flex items-center gap-3 text-[10px] font-mono text-emerald-400">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="hidden sm:inline">Node.js</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="hidden sm:inline">Docker</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="hidden sm:inline">Redis</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="hidden sm:inline">Database</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Pipeline Node Subcomponent
function PipelineNode({
  stepIndex,
  activeStep,
  title,
  colorClass,
  icon,
  children,
}: {
  stepIndex: number;
  activeStep: number;
  title: string;
  colorClass: string;
  icon: any;
  children?: React.ReactNode;
}) {
  const isPast = activeStep > stepIndex;
  const isActive = activeStep === stepIndex;

  return (
    <div
      className={`flex gap-5 items-start transition-opacity duration-300 ${!isActive && !isPast ? 'opacity-40' : 'opacity-100'}`}
    >
      {/* Node circle */}
      <div
        className={`w-[24px] h-[24px] rounded-full border flex items-center justify-center shrink-0 z-10 transition-all duration-300 ${
          isPast ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400' : colorClass
        }`}
      >
        {isPast ? <Check className="w-3 h-3" /> : icon}
      </div>

      {/* Node content */}
      <div className="flex-1 min-w-0">
        <h3
          className={`text-xs font-semibold tracking-wide transition-colors ${
            isActive
              ? 'text-white font-bold'
              : isPast
                ? 'text-white/60 font-medium'
                : 'text-white/30'
          }`}
        >
          {title}
        </h3>

        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
}
