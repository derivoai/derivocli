import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Copy } from 'lucide-react';
import { Logo } from './Logo';

export function Hero() {
  return (
    <section className="relative pt-32 pb-16 px-6 w-full flex flex-col items-center justify-center min-h-[70vh]">
      {/* Background glow specifically centered for the Hero text to create depth */}
      <div
        className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[30rem] rounded-full opacity-70 pointer-events-none select-none z-0"
        style={{
          background:
            'radial-gradient(circle, rgba(37,99,235,0.18) 0%, rgba(99,102,241,0.08) 50%, transparent 80%)',
          filter: 'blur(90px)',
        }}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          // Keep the signature 1.2s slide-up, but let opacity resolve quickly
          // so the LCP text paints early instead of waiting out the full fade.
          y: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
          opacity: { duration: 0.4, ease: 'easeOut' },
        }}
        className="text-center max-w-5xl mx-auto z-10"
      >
        {/* Logo mark */}
        <div className="flex justify-center mb-6">
          <Logo className="w-12 h-12 text-white animate-bounce-slow" />
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-[6rem] font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-400 mb-8 leading-[1.08] drop-shadow-2xl">
          Stop configuring.
          <br />
          Think clearer.
        </h1>
        <p className="text-lg md:text-2xl text-neutral-300 font-light max-w-3xl mx-auto mb-12 tracking-wide leading-relaxed">
          The pro-grade workspace for the 10x developer. Manage, parse, and synchronize your
          environments instantly.
        </p>

        <InstallPill />
      </motion.div>
    </section>
  );
}

function InstallPill() {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText('npm install -g derivo');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex justify-center mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="group relative"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/30 to-indigo-600/20 rounded-full blur opacity-30 group-hover:opacity-75 transition duration-500"></div>
        <div
          className="relative flex items-center bg-[#0c0c0c]/85 backdrop-blur-md border border-white/10 rounded-full px-5 py-2.5 space-x-4 cursor-pointer hover:bg-neutral-900 transition-colors shadow-2xl"
          onClick={handleCopy}
        >
          <span className="text-neutral-500 font-mono text-sm">$</span>
          <span className="text-neutral-200 font-mono text-sm tracking-wide">
            npm install -g derivo
          </span>
          <div className="w-px h-4 bg-white/20"></div>
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Check className="w-4 h-4 text-green-400" />
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Copy className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
