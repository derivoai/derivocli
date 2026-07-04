import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LogIn,
  Wrench,
  ScanSearch,
  ShieldCheck,
  Stethoscope,
  Blocks,
  Check,
  CircleDot,
  Terminal,
} from 'lucide-react';

interface CLILine {
  type: 'progress' | 'success';
  text: string;
}

interface CommandItem {
  cmd: string;
  icon: any;
  desc: string;
  output: CLILine[];
}

const commands: CommandItem[] = [
  {
    cmd: 'derivo login',
    icon: LogIn,
    desc: 'Authenticate this machine with your Derivo account in a single browser step.',
    output: [
      { type: 'progress', text: 'Checking machine signature...' },
      { type: 'success', text: 'Found local security credentials' },
      { type: 'progress', text: 'Opening login session in browser...' },
      { type: 'success', text: 'Authenticated as dev@derivo.dev' },
    ],
  },
  {
    cmd: 'derivo setup',
    icon: Wrench,
    desc: 'Detect your stack, fix runtime and service issues, and prepare the project to run.',
    output: [
      { type: 'progress', text: 'Scanning project configuration...' },
      { type: 'success', text: 'Detected React workspace' },
      { type: 'success', text: 'pnpm lockfile parsed' },
      { type: 'success', text: 'Setup completed in 1.4s' },
    ],
  },
  {
    cmd: 'derivo inspect',
    icon: ScanSearch,
    desc: 'Analyze project structure, surface risks, and get actionable recommendations.',
    output: [
      { type: 'progress', text: 'Mapping abstract syntax tree...' },
      { type: 'success', text: '124 source files analyzed' },
      { type: 'success', text: 'Dependencies verified' },
      { type: 'success', text: 'No circular refs detected' },
    ],
  },
  {
    cmd: 'derivo validate',
    icon: ShieldCheck,
    desc: 'Check the project against best-practice rules and apply safe, confirmed fixes.',
    output: [
      { type: 'progress', text: 'Running validation rules...' },
      { type: 'success', text: 'package.json schema valid' },
      { type: 'success', text: 'Docker orchestration correct' },
      { type: 'success', text: 'All environment variables present' },
    ],
  },
  {
    cmd: 'derivo doctor',
    icon: Stethoscope,
    desc: 'Run full diagnostics on your machine and project. Add --fix to auto-repair.',
    output: [
      { type: 'progress', text: 'Performing deep diagnostic run...' },
      { type: 'success', text: 'Docker engine status: Online' },
      { type: 'success', text: 'Database credentials valid' },
      { type: 'success', text: 'Everything checks out. Healthy.' },
    ],
  },
  {
    cmd: 'derivo plugin',
    icon: Blocks,
    desc: 'Extend Derivo with framework-aware plugins for your team’s exact workflow.',
    output: [
      { type: 'progress', text: 'Scanning local plugin registry...' },
      { type: 'success', text: 'Active plugin: tailwind-plugin' },
      { type: 'success', text: 'Active plugin: eslint-plugin' },
      { type: 'success', text: 'All plugins initialized' },
    ],
  },
];

export function Commands() {
  const [activeCmd, setActiveCmd] = useState('derivo login');
  const [typedText, setTypedText] = useState('');
  const [cliLines, setCliLines] = useState<
    Array<{ id: number; type: 'progress' | 'success'; text: string }>
  >([]);
  const [isTyping, setIsTyping] = useState(false);
  const terminalContentRef = useRef<HTMLDivElement>(null);

  const sectionRef = useRef<HTMLDivElement>(null);
  const [hasEnteredViewport, setHasEnteredViewport] = useState(false);

  // Trigger once on view
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

  // Handle typing & output loop
  useEffect(() => {
    if (!hasEnteredViewport) return;

    let isCancelled = false;
    setTypedText('');
    setCliLines([]);
    setIsTyping(true);

    const runSimulation = async () => {
      const activeObj = commands.find((c) => c.cmd === activeCmd) || commands[0];
      const commandString = activeObj.cmd;

      // Type command char by char
      for (let i = 1; i <= commandString.length; i++) {
        if (isCancelled) return;
        setTypedText(commandString.substring(0, i));
        await new Promise((r) => setTimeout(r, 45));
      }
      setIsTyping(false);

      if (isCancelled) return;
      await new Promise((r) => setTimeout(r, 200));

      // Print lines with realistic delays
      const outputs = activeObj.output;
      for (let idx = 0; idx < outputs.length; idx++) {
        if (isCancelled) return;
        const line = outputs[idx];
        if (line) {
          setCliLines((prev) => [...prev, { id: idx, type: line.type, text: line.text }]);
        }

        if (terminalContentRef.current) {
          terminalContentRef.current.scrollTop = terminalContentRef.current.scrollHeight;
        }

        const delay = line.type === 'progress' ? 400 : 150;
        await new Promise((r) => setTimeout(r, delay));
      }
    };

    runSimulation();

    return () => {
      isCancelled = true;
    };
  }, [activeCmd, hasEnteredViewport]);

  return (
    <section
      ref={sectionRef}
      className="w-full max-w-6xl mx-auto px-6 mt-32 md:mt-48 relative z-10 text-left"
    >
      <div className="border-t border-white/[0.08] pt-16 mb-16">
        <span className="text-[11px] font-mono tracking-widest text-white/30 uppercase">
          Command Reference
        </span>
        <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mt-3">
          One CLI for the whole environment.
        </h2>
        <p className="mt-4 text-sm md:text-base text-white/50 max-w-xl font-light">
          Every command is local-first, high performance, and scriptable. Learn one tool instead of
          a dozen configuration docs.
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
        {/* Left Column: Command Palette list */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/30 pl-1">
            Commands Palette
          </span>
          <div className="flex flex-row overflow-x-auto gap-2 pb-2 lg:pb-0 scrollbar-none lg:flex-col lg:overflow-visible lg:gap-2">
            {commands.map((c) => {
              const Icon = c.icon;
              const isActive = activeCmd === c.cmd;

              return (
                <button
                  key={c.cmd}
                  onClick={() => setActiveCmd(c.cmd)}
                  className={`relative flex items-center gap-3.5 px-4 py-3 rounded-2xl border transition-all duration-300 text-left min-w-[155px] lg:w-full group cursor-pointer hover:-translate-y-0.5 ${
                    isActive
                      ? 'border-white/10 bg-white/[0.02] shadow-sm'
                      : 'border-transparent bg-transparent hover:bg-white/[0.015] hover:border-white/5'
                  }`}
                >
                  {/* Sliding active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeCmdIndicator"
                      className="absolute inset-0 rounded-2xl bg-white/[0.03] border border-white/5"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}

                  <div
                    className={`relative z-10 p-2.5 rounded-xl border transition-colors ${
                      isActive
                        ? 'bg-white/5 border-white/10 text-white'
                        : 'bg-white/[0.02] border-white/[0.08] text-white/40 group-hover:text-white/70'
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
                      {c.cmd}
                    </span>
                    <span className="hidden lg:block text-[10px] text-white/30 tracking-wide mt-0.5 max-w-[280px] line-clamp-1">
                      {c.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Premium Terminal Simulator */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div className="flex flex-col gap-3 h-full justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/30 pl-1">
              Terminal Output
            </span>

            <div
              className="relative rounded-3xl bg-[#0c0c0e]/80 border border-white/10 p-6 md:p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(59,130,246,0.12),0_30px_60px_-15px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.05)] flex-1 min-h-[350px] flex flex-col justify-between"
              style={{ fontFamily: 'Geist Mono, JetBrains Mono, monospace' }}
            >
              {/* Terminal header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 select-none">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]/80" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]/80" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]/80" />
                </div>
                <span className="text-[10px] font-sans text-white/30 tracking-wider">
                  ~/workspace/derivo
                </span>
                <Terminal className="w-3.5 h-3.5 text-white/20" />
              </div>

              {/* Console log area */}
              <div
                ref={terminalContentRef}
                className="flex-1 overflow-y-auto scrollbar-none text-[13px] leading-relaxed text-white/80"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCmd}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-1.5"
                  >
                    {/* Prompt line */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-white/40 font-bold select-none">❯</span>
                      <span className="text-white font-medium">{typedText}</span>
                      {isTyping && (
                        <motion.span
                          animate={{ opacity: [1, 0, 1] }}
                          transition={{ repeat: Infinity, duration: 0.8 }}
                          className="w-1.5 h-4 bg-white/60 inline-block align-middle"
                        />
                      )}
                    </div>

                    {/* Simulation lines */}
                    {cliLines.map((line) => {
                      const isProgress = line.type === 'progress';
                      return (
                        <motion.div
                          key={line.id}
                          initial={{ opacity: 0, x: -3 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-2.5 min-h-[22px]"
                        >
                          {isProgress ? (
                            <CircleDot className="w-3.5 h-3.5 text-white/30 animate-pulse shrink-0" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          <span
                            className={isProgress ? 'text-white/40 font-light' : 'text-white/70'}
                          >
                            {isProgress ? '> ' : '✓ '}
                            {line.text}
                          </span>
                        </motion.div>
                      );
                    })}

                    {/* Flashing cursor at completion */}
                    {!isTyping &&
                      cliLines.length ===
                        (commands.find((c) => c.cmd === activeCmd)?.output.length ?? 0) && (
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
