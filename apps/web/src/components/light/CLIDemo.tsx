import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check, TriangleAlert, Loader2 } from 'lucide-react';

const ease = [0.16, 1, 0.3, 1] as const;
const ACCENT = 'hsl(239 84% 67%)';
const COMMAND = 'derivo setup';

type Step = { text: string; meta: string; tone: 'ok' | 'warn'; progress: number };

const SCRIPT: Step[] = [
  { text: 'Node.js updated to v22.3.0', meta: 'nvm', tone: 'ok', progress: 20 },
  { text: 'Docker engine active and ready', meta: 'daemon', tone: 'ok', progress: 45 },
  { text: 'Redis not responding — provisioning', meta: 'docker', tone: 'warn', progress: 60 },
  { text: 'Redis bound to port 6379', meta: 'docker', tone: 'ok', progress: 80 },
  { text: 'Environment verified', meta: 'derivo.json', tone: 'ok', progress: 100 },
];

export function CLIDemo() {
  const reduce = useReducedMotion();
  const [typed, setTyped] = useState('');
  const [completed, setCompleted] = useState(0); // steps finished
  const [running, setRunning] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const progress = completed > 0 ? SCRIPT[completed - 1].progress : 0;
  const done = completed >= SCRIPT.length;

  useEffect(() => {
    if (reduce) {
      setTyped(COMMAND);
      setCompleted(SCRIPT.length);
      setRunning(false);
      return;
    }

    const at = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

    const run = () => {
      setTyped('');
      setCompleted(0);
      setRunning(false);

      let i = 0;
      const type = () => {
        i += 1;
        setTyped(COMMAND.slice(0, i));
        if (i < COMMAND.length) at(type, 65);
        else {
          at(() => setRunning(true), 400);
          at(finish(0), 900);
        }
      };
      at(type, 350);

      const finish = (idx: number) => () => {
        setCompleted(idx + 1);
        if (idx + 1 < SCRIPT.length) at(finish(idx + 1), 850);
        else {
          setRunning(false);
          at(run, 3800); // loop
        }
      };
    };

    run();
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [reduce]);

  const typingDone = typed.length === COMMAND.length;

  return (
    <section className="w-full bg-background py-28 md:py-32">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <span className="text-xs font-medium tracking-wide text-accent uppercase">Live demo</span>
          <h2 className="mt-3 font-display text-4xl md:text-5xl leading-[1.0] tracking-tight text-foreground">
            One command. <span className="italic">Fully verified.</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Derivo detects issues, fixes them, and confirms your environment is ready — while you
            watch.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease }}
          className="rounded-2xl overflow-hidden bg-background border border-border shadow-[0_30px_80px_-32px_rgba(0,0,0,0.25)]"
        >
          {/* Window bar */}
          <div className="flex items-center gap-2 px-5 h-11 border-b border-border bg-secondary/50">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-border" />
              <span className="h-3 w-3 rounded-full bg-border" />
              <span className="h-3 w-3 rounded-full bg-border" />
            </div>
            <div className="flex-1 text-center text-muted-foreground font-mono tracking-widest uppercase text-[10px]">
              derivo — zsh
            </div>
            <div className="w-10" />
          </div>

          {/* Body */}
          <div className="px-6 py-6 md:px-8 font-mono text-sm">
            {/* Prompt */}
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <span className="text-accent">$</span>
              <span>{typed}</span>
              {!typingDone && (
                <span className="inline-block w-[8px] h-[16px] bg-accent/70 animate-cursor-blink" />
              )}
            </div>

            {/* All steps — always visible; pending → active → done */}
            <div className="mt-5 flex flex-col divide-y divide-border/60">
              {SCRIPT.map((step, i) => {
                const isDone = i < completed;
                const isActive = running && i === completed && typingDone;
                const isPending = !isDone && !isActive;
                return (
                  <div
                    key={step.text}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Status glyph */}
                      {isDone ? (
                        <motion.span
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.3, ease }}
                          className="h-4 w-4 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor:
                              step.tone === 'ok'
                                ? 'rgba(16,185,129,0.12)'
                                : 'rgba(245,158,11,0.14)',
                          }}
                        >
                          {step.tone === 'ok' ? (
                            <Check className="h-2.5 w-2.5 text-emerald-600" />
                          ) : (
                            <TriangleAlert className="h-2.5 w-2.5 text-amber-600" />
                          )}
                        </motion.span>
                      ) : isActive ? (
                        <span className="h-4 w-4 flex items-center justify-center shrink-0">
                          <Loader2 className="h-3.5 w-3.5 text-accent animate-spin" />
                        </span>
                      ) : (
                        <span className="h-4 w-4 flex items-center justify-center shrink-0">
                          <span className="h-3 w-3 rounded-full border border-border" />
                        </span>
                      )}

                      {/* Text */}
                      <span
                        className={`truncate transition-colors duration-300 ${
                          isPending
                            ? 'text-muted-foreground/40'
                            : step.tone === 'warn' && isDone
                              ? 'text-amber-700'
                              : isActive
                                ? 'text-foreground'
                                : 'text-foreground'
                        }`}
                      >
                        {step.text}
                      </span>
                    </div>

                    {/* Meta tag (dimmed until the step resolves) */}
                    <span
                      className={`shrink-0 text-[10px] uppercase tracking-widest transition-colors duration-300 ${
                        isDone ? 'text-muted-foreground' : 'text-muted-foreground/30'
                      }`}
                    >
                      {step.meta}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Completion line */}
            <div className="mt-5 h-5 flex items-center gap-2 text-emerald-600 text-xs">
              {done && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease }}
                  className="flex items-center gap-2"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span className="font-medium">Ready in 28s — happy coding.</span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Readiness bar */}
          <div className="px-6 md:px-8 py-4 border-t border-border bg-secondary/40">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
              <span>Environment Readiness</span>
              <span className="text-foreground tabular-nums">{progress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: ACCENT }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
