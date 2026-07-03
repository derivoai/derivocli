import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { Logo } from './Logo';
import { Clipboard, Check, Play, Pause } from 'lucide-react';

interface TerminalLine {
  type: 'input' | 'spinner' | 'info' | 'success' | 'warning' | 'error';
  text: string;
  meta?: string;
}

export function CLIDemo() {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [copied, setCopied] = useState(false);
  const [currentInput, setCurrentInput] = useState('');

  const containerRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setIsInView(!!entry?.isIntersecting), {
      threshold: 0.1,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [15, 0, -15]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 0.5, 1], [100, 0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  // Clean timeouts
  const clearAllTimeouts = () => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText('derivo setup');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, currentInput]);

  useEffect(() => {
    if (!isPlaying || !isInView) {
      clearAllTimeouts();
      return;
    }

    clearAllTimeouts();
    setLines([]);
    setProgress(0);
    setCurrentInput('');

    // Simulated typing of 'derivo setup'
    const commandStr = 'derivo setup';
    let typed = '';
    let charIdx = 0;

    const typeCommand = () => {
      if (charIdx < commandStr.length) {
        typed += commandStr[charIdx];
        setCurrentInput(typed);
        charIdx++;
        const t = setTimeout(typeCommand, 60);
        timeoutRefs.current.push(t);
      } else {
        // Commits input and runs script
        const t = setTimeout(() => {
          setLines([{ type: 'input', text: commandStr }]);
          setCurrentInput('');
          runSteps();
        }, 300);
        timeoutRefs.current.push(t);
      }
    };

    const runSteps = () => {
      const steps: { delay: number; action: () => void }[] = [
        {
          delay: 500,
          action: () =>
            setLines((prev) => [...prev, { type: 'spinner', text: 'Checking Node.js version...' }]),
        },
        {
          delay: 1700,
          action: () =>
            setLines((prev) => {
              const next = prev.filter((l) => !l.text.includes('Checking Node.js'));
              return [
                ...next,
                {
                  type: 'error',
                  text: 'Wrong Node.js version detected: v16.14.0 (v22.0.0+ required)',
                },
              ];
            }),
        },
        {
          delay: 2800,
          action: () =>
            setLines((prev) => [
              ...prev,
              { type: 'spinner', text: 'Installing Node.js v22.3.0 via nvm...' },
            ]),
        },
        {
          delay: 4800,
          action: () => {
            setLines((prev) => {
              const next = prev.filter((l) => !l.text.includes('Installing Node.js'));
              return [
                ...next,
                { type: 'success', text: 'Node.js updated to v22.3.0', meta: 'nvm' },
              ];
            });
            setProgress(25);
          },
        },
        {
          delay: 5800,
          action: () =>
            setLines((prev) => [
              ...prev,
              { type: 'spinner', text: 'Verifying Docker engine daemon...' },
            ]),
        },
        {
          delay: 7000,
          action: () =>
            setLines((prev) => {
              const next = prev.filter((l) => !l.text.includes('Verifying Docker'));
              return [...next, { type: 'warning', text: 'Docker engine is currently stopped.' }];
            }),
        },
        {
          delay: 8000,
          action: () =>
            setLines((prev) => [
              ...prev,
              { type: 'spinner', text: 'Booting Docker background service...' },
            ]),
        },
        {
          delay: 10000,
          action: () => {
            setLines((prev) => {
              const next = prev.filter((l) => !l.text.includes('Booting Docker'));
              return [
                ...next,
                { type: 'success', text: 'Docker engine active and ready', meta: 'daemon' },
              ];
            });
            setProgress(60);
          },
        },
        {
          delay: 11000,
          action: () =>
            setLines((prev) => [...prev, { type: 'spinner', text: 'Checking Redis service...' }]),
        },
        {
          delay: 12200,
          action: () =>
            setLines((prev) => {
              const next = prev.filter((l) => !l.text.includes('Checking Redis'));
              return [
                ...next,
                { type: 'warning', text: 'Redis container not responding on port 6379.' },
              ];
            }),
        },
        {
          delay: 13500,
          action: () =>
            setLines((prev) => [
              ...prev,
              { type: 'spinner', text: 'Provisioning Redis container via docker-compose...' },
            ]),
        },
        {
          delay: 16000,
          action: () => {
            setLines((prev) => {
              const next = prev.filter((l) => !l.text.includes('Provisioning Redis'));
              return [
                ...next,
                { type: 'success', text: 'Redis active and bounded to port 6379', meta: 'docker' },
              ];
            });
            setProgress(90);
          },
        },
        {
          delay: 17000,
          action: () =>
            setLines((prev) => [
              ...prev,
              { type: 'spinner', text: 'Validating project environment and schemas...' },
            ]),
        },
        {
          delay: 18500,
          action: () => {
            setLines((prev) => {
              const next = prev.filter((l) => !l.text.includes('Validating project'));
              return [
                ...next,
                {
                  type: 'success',
                  text: 'All local environments successfully verified.',
                  meta: 'derivo.json',
                },
              ];
            });
            setProgress(100);
          },
        },
        {
          delay: 19500,
          action: () =>
            setLines((prev) => [...prev, { type: 'info', text: 'Ready. Happy coding!' }]),
        },
        {
          delay: 24000,
          action: () => {
            setLines([]);
            setProgress(0);
            setCurrentInput('');
            // Trigger loop restart
            charIdx = 0;
            typed = '';
            typeCommand();
          },
        },
      ];

      steps.forEach((step) => {
        const t = setTimeout(step.action, step.delay);
        timeoutRefs.current.push(t);
      });
    };

    // Begin typing
    const initTimeout = setTimeout(typeCommand, 300);
    timeoutRefs.current.push(initTimeout);

    return () => clearAllTimeouts();
  }, [isPlaying, isInView]);

  return (
    <motion.section
      ref={containerRef}
      style={{ opacity, scale, y, rotateX, transformPerspective: 1000 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-4xl mx-auto px-6 mt-12 md:mt-20 relative z-10"
    >
      <div className="relative rounded-2xl bg-[#0a0a0a] border border-white/[0.08] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col h-[480px] md:h-[520px]">
        {/* Terminal Top Window Bar */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0c0c0c]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-white/[0.12]" />
            <div className="w-3 h-3 rounded-full bg-white/[0.12]" />
            <div className="w-3 h-3 rounded-full bg-white/[0.12]" />
          </div>
          <div className="text-[11px] font-mono tracking-widest text-white/30 flex items-center gap-2 uppercase">
            <Logo className="w-3.5 h-3.5 text-white/40" />
            derivo terminal
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={copyToClipboard}
              className="text-[10px] font-mono text-white/30 hover:text-white/80 transition-colors border border-white/10 rounded px-2 py-0.5 bg-white/[0.02] flex items-center gap-1"
              aria-label="Copy setup command"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Clipboard className="w-3 h-3" />
              )}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-[10px] font-mono text-white/30 hover:text-white/80 transition-colors border border-white/10 rounded px-2 py-0.5 bg-white/[0.02] flex items-center gap-1"
              aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
            >
              {isPlaying ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
          </div>
        </div>

        {/* Terminal Screen Body */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto thin-scroll p-8 md:p-10 font-mono text-xs md:text-sm text-white/70 flex flex-col gap-3.5 bg-[#070707] select-text scroll-smooth"
        >
          <AnimatePresence mode="popLayout">
            {lines.map((line, idx) => {
              if (line.type === 'input') {
                return (
                  <motion.div
                    key={`line-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2.5 text-white font-medium"
                  >
                    <span className="text-white/40 select-none">&gt;</span>
                    <span>{line.text}</span>
                  </motion.div>
                );
              }

              if (line.type === 'spinner') {
                return (
                  <motion.div
                    key={`line-${idx}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 text-white/50"
                  >
                    <span className="inline-block animate-spin text-white/40">⠋</span>
                    <span>{line.text}</span>
                  </motion.div>
                );
              }

              if (line.type === 'error') {
                return (
                  <motion.div
                    key={`line-${idx}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-start gap-3 text-red-400/90"
                  >
                    <span className="text-red-400/80 select-none">✗</span>
                    <span className="flex-1">{line.text}</span>
                  </motion.div>
                );
              }

              if (line.type === 'warning') {
                return (
                  <motion.div
                    key={`line-${idx}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-start gap-3 text-amber-300/85"
                  >
                    <span className="text-amber-300/70 select-none">!</span>
                    <span className="flex-1">{line.text}</span>
                  </motion.div>
                );
              }

              if (line.type === 'success') {
                return (
                  <motion.div
                    key={`line-${idx}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between text-emerald-300/90"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-300/80 select-none">✓</span>
                      <span>{line.text}</span>
                    </div>
                    {line.meta && (
                      <span className="text-[10px] text-white/25 uppercase tracking-widest">
                        {line.meta}
                      </span>
                    )}
                  </motion.div>
                );
              }

              if (line.type === 'info') {
                return (
                  <motion.div
                    key={`line-${idx}`}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 text-white font-semibold border-t border-white/[0.06] pt-6 mt-4"
                  >
                    <span className="text-emerald-300/80 text-base">●</span>
                    <span className="tracking-tight">{line.text}</span>
                  </motion.div>
                );
              }

              return null;
            })}
          </AnimatePresence>

          {/* Typing simulation cursor */}
          {currentInput && (
            <div className="flex items-center gap-2.5 text-white font-medium">
              <span className="text-white/40 select-none">&gt;</span>
              <span>{currentInput}</span>
              <span className="w-1.5 h-4 bg-white/80 inline-block animate-[pulse_1s_infinite] select-none" />
            </div>
          )}

          {/* Blink cursor when idle/waiting */}
          {!currentInput && lines.length === 0 && (
            <div className="flex items-center gap-2.5 text-white font-medium">
              <span className="text-white/40 select-none">&gt;</span>
              <span className="w-1.5 h-4 bg-white/80 inline-block animate-[pulse_1s_infinite] select-none" />
            </div>
          )}
        </div>

        {/* Progress Bar Container */}
        <div className="shrink-0 border-t border-white/[0.06] px-8 py-5 bg-[#080808] flex items-center justify-between gap-6">
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="flex justify-between text-[11px] font-mono text-white/40 uppercase tracking-wider">
              <span>Environment Readiness</span>
              <span className="w-10 text-right">{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
              <div
                style={{ width: `${progress}%` }}
                className="h-full bg-white rounded-full transition-all duration-700 ease-out"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
