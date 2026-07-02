import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Settings, Eye, ShieldCheck, Activity, Check, CircleDot } from 'lucide-react';

interface CommandOutputLine {
  type: 'progress' | 'success';
  text: string;
}

interface CommandData {
  name: string;
  icon: any;
  desc: string;
  output: CommandOutputLine[];
}

const commandsData: Record<string, CommandData> = {
  'derivo setup': {
    name: 'derivo setup',
    icon: Settings,
    desc: 'Onboard and configure environment',
    output: [
      { type: 'progress', text: 'Scanning project...' },
      { type: 'success', text: 'package.json detected' },
      { type: 'success', text: 'React detected' },
      { type: 'success', text: 'TypeScript detected' },
      { type: 'success', text: 'pnpm detected' },
      { type: 'success', text: 'Docker detected' },
      { type: 'success', text: 'Environment verified' },
      { type: 'success', text: 'Dependencies resolved' },
      { type: 'success', text: 'Dashboard synchronized' },
      { type: 'success', text: 'Setup complete' },
    ],
  },
  'derivo inspect': {
    name: 'derivo inspect',
    icon: Eye,
    desc: 'Analyze project architecture',
    output: [
      { type: 'progress', text: 'Reading project structure...' },
      { type: 'success', text: 'Framework detected' },
      { type: 'success', text: '124 source files analyzed' },
      { type: 'success', text: 'Dependency graph generated' },
      { type: 'success', text: 'Security configuration validated' },
      { type: 'success', text: 'Build health: Excellent' },
      { type: 'success', text: 'Project ready' },
    ],
  },
  'derivo validate': {
    name: 'derivo validate',
    icon: ShieldCheck,
    desc: 'Verify sanity & state',
    output: [
      { type: 'progress', text: 'Running validation...' },
      { type: 'success', text: 'Configuration valid' },
      { type: 'success', text: 'Environment variables verified' },
      { type: 'success', text: 'Required services reachable' },
      { type: 'success', text: 'Dependencies healthy' },
      { type: 'success', text: 'No issues detected' },
    ],
  },
  'derivo doctor': {
    name: 'derivo doctor',
    icon: Activity,
    desc: 'Diagnose machine health',
    output: [
      { type: 'progress', text: 'Running diagnostics...' },
      { type: 'success', text: 'Node.js version supported' },
      { type: 'success', text: 'Docker running' },
      { type: 'success', text: 'Database connection healthy' },
      { type: 'success', text: 'Git repository configured' },
      { type: 'success', text: 'Plugin compatibility verified' },
      { type: 'success', text: 'No problems found' },
    ],
  },
};

type CommandName = 'derivo setup' | 'derivo inspect' | 'derivo validate' | 'derivo doctor';

export function TrustedBy() {
  const [activeCmd, setActiveCmd] = useState<CommandName>('derivo setup');
  const [typedCommand, setTypedCommand] = useState('');
  const [visibleLines, setVisibleLines] = useState<
    Array<{ id: number; type: 'progress' | 'success'; text: string }>
  >([]);
  const [isTyping, setIsTyping] = useState(false);

  const sectionRef = useRef<HTMLDivElement>(null);
  const terminalContentRef = useRef<HTMLDivElement>(null);
  const [hasEnteredViewport, setHasEnteredViewport] = useState(false);

  // Intersection observer to trigger animation once on enter viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting && !hasEnteredViewport) {
          setHasEnteredViewport(true);
        }
      },
      { threshold: 0.15 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasEnteredViewport]);

  // Terminal Typing & Output simulation loop
  useEffect(() => {
    if (!hasEnteredViewport) return;

    let isCancelled = false;

    const runAnimation = async () => {
      setTypedCommand('');
      setVisibleLines([]);
      setIsTyping(true);

      // 1. Type the command char by char
      const commandText = activeCmd;
      for (let i = 1; i <= commandText.length; i++) {
        if (isCancelled) return;
        setTypedCommand(commandText.substring(0, i));
        await new Promise((resolve) => setTimeout(resolve, 40));
      }
      setIsTyping(false);

      if (isCancelled) return;
      await new Promise((resolve) => setTimeout(resolve, 250));

      // 2. Output lines appear step by step
      const lines = commandsData[activeCmd].output;
      for (let idx = 0; idx < lines.length; idx++) {
        if (isCancelled) return;
        const line = lines[idx];
        if (line) {
          setVisibleLines((prev) => [...prev, { id: idx, type: line.type, text: line.text }]);
        }

        // Auto scroll terminal window to bottom as lines appear
        if (terminalContentRef.current) {
          terminalContentRef.current.scrollTop = terminalContentRef.current.scrollHeight;
        }

        const delay = line.type === 'progress' ? 450 : 150;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    };

    runAnimation();

    return () => {
      isCancelled = true;
    };
  }, [activeCmd, hasEnteredViewport]);

  return (
    <section
      ref={sectionRef}
      className="w-full max-w-6xl mx-auto px-6 mt-32 md:mt-40 relative z-10 text-left"
    >
      <div className="border-t border-white/[0.08] pt-16">
        <div className="mb-12">
          <span className="text-[11px] font-mono tracking-widest text-white/30 uppercase">
            Interactive Showcase
          </span>
          <h2 className="text-3xl md:text-4xl font-semibold text-white tracking-tight mt-3 block leading-tight">
            Boot, sync, and inspect in seconds.
          </h2>
          <p className="mt-3 text-sm md:text-base text-white/50 max-w-xl font-light">
            Take control of your dev stack. See how Derivo validates systems and synchronizes
            dependencies dynamically.
          </p>
        </div>

        {/* Outer Split Layout */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-stretch">
          {/* Sidebar / Horizontally scrollable on mobile */}
          <div className="w-full lg:w-72 shrink-0 flex flex-col gap-3">
            <div className="flex flex-row overflow-x-auto gap-2 pb-2 lg:pb-0 scrollbar-none lg:flex-col lg:overflow-visible lg:gap-2">
              {(Object.keys(commandsData) as CommandName[]).map((cmdKey) => {
                const cmd = commandsData[cmdKey];
                const Icon = cmd.icon;
                const isActive = activeCmd === cmdKey;

                return (
                  <button
                    key={cmdKey}
                    onClick={() => setActiveCmd(cmdKey)}
                    className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 text-left min-w-[155px] lg:w-full group cursor-pointer ${
                      isActive
                        ? 'border-white/10 bg-white/[0.02]'
                        : 'border-transparent bg-transparent hover:bg-white/[0.01]'
                    }`}
                  >
                    {/* Sliding Active Indicator Tab */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute inset-0 rounded-xl bg-white/[0.03] border border-white/5"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}

                    <div
                      className={`relative z-10 p-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-white/5 text-white'
                          : 'bg-transparent text-white/40 group-hover:text-white/70'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="relative z-10 flex flex-col">
                      <span
                        className={`text-[13px] font-mono tracking-tight transition-colors ${
                          isActive
                            ? 'text-white font-medium'
                            : 'text-white/50 group-hover:text-white/80'
                        }`}
                      >
                        {cmd.name}
                      </span>
                      <span className="hidden lg:block text-[10px] text-white/30 tracking-wide mt-0.5">
                        {cmd.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Premium Terminal Simulator */}
          <div className="flex-1 min-w-0 relative">
            {/* Ambient Behind-Glow */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] rounded-3xl blur-[100px] pointer-events-none opacity-30 transition-all duration-700"
              style={{
                background:
                  activeCmd === 'derivo setup'
                    ? 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, rgba(6,182,212,0.06) 50%, transparent 100%)'
                    : activeCmd === 'derivo inspect'
                      ? 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, rgba(236,72,153,0.06) 50%, transparent 100%)'
                      : activeCmd === 'derivo validate'
                        ? 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, rgba(99,102,241,0.06) 50%, transparent 100%)'
                        : 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, rgba(239,68,68,0.06) 50%, transparent 100%)',
              }}
            />

            {/* Terminal Card Frame */}
            <div
              className="relative rounded-2xl bg-[#0a0a0b]/85 border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-2xl flex flex-col h-[350px] overflow-hidden"
              style={{ fontFamily: 'Geist Mono, JetBrains Mono, Fira Code, monospace' }}
            >
              {/* Header / OS Buttons */}
              <div className="h-11 border-b border-white/5 bg-white/[0.02] px-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]/80 hover:bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]/80 hover:bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]/80 hover:bg-[#27c93f]" />
                </div>

                <span className="text-[11px] text-white/30 tracking-wide font-sans pl-10 select-none">
                  derivo — {activeCmd}
                </span>

                <div className="flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5 text-white/20" />
                </div>
              </div>

              {/* Terminal Body */}
              <div
                ref={terminalContentRef}
                className="flex-1 p-6 overflow-y-auto text-[13px] leading-relaxed text-white/80 scroll-smooth"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCmd}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-1.5"
                  >
                    {/* Typed Input Line */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-white/40 select-none font-bold">❯</span>
                      <span className="text-white font-medium">{typedCommand}</span>
                      {isTyping && (
                        <motion.span
                          animate={{ opacity: [1, 0, 1] }}
                          transition={{ repeat: Infinity, duration: 0.8 }}
                          className="w-1.5 h-4 bg-white/60 inline-block align-middle"
                        />
                      )}
                    </div>

                    {/* Simulation Output Lines */}
                    {visibleLines.map((line) => {
                      const isProgress = line.type === 'progress';

                      return (
                        <motion.div
                          key={line.id}
                          initial={{ opacity: 0, x: -3 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.18 }}
                          className="flex items-center gap-2.5 min-h-[22px]"
                        >
                          {isProgress ? (
                            <CircleDot className="w-3.5 h-3.5 text-white/30 animate-pulse shrink-0" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          <span className={isProgress ? 'text-white/40' : 'text-white/70'}>
                            {isProgress ? '> ' : '✓ '}
                            {line.text}
                          </span>
                        </motion.div>
                      );
                    })}

                    {/* Post-execution flashing cursor */}
                    {!isTyping && visibleLines.length === commandsData[activeCmd].output.length && (
                      <div className="flex items-center gap-2 mt-3 pl-6">
                        <motion.span
                          animate={{ opacity: [1, 0, 1] }}
                          transition={{ repeat: Infinity, duration: 0.9 }}
                          className="w-1.5 h-4 bg-white/40 inline-block"
                        />
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
