import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, CornerDownLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { allNav } from '../layout/nav';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const commands = allNav.map((n) => ({ id: n.href, name: n.name, icon: n.icon, path: n.href }));
  const filteredCommands =
    query === ''
      ? commands
      : commands.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => setSelectedIndex(0), [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands.length > 0) {
          navigate(filteredCommands[selectedIndex].path);
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, navigate, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-xl rounded-2xl surface-card shadow-[0_50px_140px_-24px_rgba(0,0,0,0.9)] overflow-hidden pointer-events-auto flex flex-col max-h-[60vh]"
              role="dialog"
              aria-modal="true"
              aria-label="Command palette"
            >
              <div className="flex items-center gap-3 px-4 h-14 border-b border-white/[0.06]">
                <Search className="w-4 h-4 text-white/40 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search pages and actions..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/30 text-sm"
                />
                <kbd className="hidden sm:block font-mono text-[10px] text-white/40 bg-white/[0.06] px-2 py-1 rounded-md">
                  ESC
                </kbd>
              </div>

              <div className="overflow-y-auto thin-scroll p-2">
                {filteredCommands.length === 0 ? (
                  <div className="py-14 text-center text-sm text-white/40">
                    No results for "{query}"
                  </div>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    <div className="px-3 pt-2 pb-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/30">
                      Navigate
                    </div>
                    {filteredCommands.map((cmd, idx) => {
                      const Icon = cmd.icon;
                      const isActive = idx === selectedIndex;
                      return (
                        <button
                          key={cmd.id}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          onClick={() => {
                            navigate(cmd.path);
                            onClose();
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                            isActive
                              ? 'bg-white/[0.06] text-white'
                              : 'text-white/60 hover:bg-white/[0.03]'
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 ${isActive ? 'text-accent-bright' : 'text-white/40'}`}
                          />
                          <span className="flex-1 text-sm font-medium">{cmd.name}</span>
                          {isActive && <CornerDownLeft className="w-3.5 h-3.5 text-white/30" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
