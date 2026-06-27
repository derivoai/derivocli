import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, FolderGit2, MonitorSmartphone, KeyRound, Settings, CreditCard, Activity, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const commands = [
    { id: 'home', name: 'Go to Overview', icon: Activity, path: '/dashboard' },
    { id: 'projects', name: 'Manage Projects', icon: FolderGit2, path: '/dashboard/projects' },
    { id: 'devices', name: 'Manage Devices', icon: MonitorSmartphone, path: '/dashboard/devices' },
    { id: 'keys', name: 'API Keys', icon: KeyRound, path: '/dashboard/keys' },
    { id: 'settings', name: 'Settings', icon: Settings, path: '/dashboard/settings' },
    { id: 'billing', name: 'Billing', icon: CreditCard, path: '/dashboard/billing' },
  ];

  const filteredCommands = query === '' 
    ? commands 
    : commands.filter(cmd => cmd.name.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + filteredCommands.length) % filteredCommands.length);
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[#000000]/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-2xl bg-[#0a0a0a] border border-white/[0.08] rounded-2xl shadow-[0_30px_100px_-20px_rgba(0,0,0,1)] overflow-hidden pointer-events-auto flex flex-col max-h-[60vh]"
            >
              <div className="flex items-center gap-3 px-4 py-4 border-b border-white/[0.06]">
                <Search className="w-5 h-5 text-white/40 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a command or search..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/30 text-base"
                />
                <kbd className="hidden sm:block font-mono text-[10px] text-white/30 bg-white/[0.05] px-2 py-1 rounded">
                  ESC
                </kbd>
              </div>

              <div className="overflow-y-auto p-2">
                {filteredCommands.length === 0 ? (
                  <div className="py-14 text-center text-sm text-white/40">
                    No results found for "{query}"
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <div className="px-3 text-[10px] font-mono text-white/30 uppercase tracking-wider mb-2 mt-2">
                      Navigation
                    </div>
                    {filteredCommands.map((cmd, idx) => {
                      const Icon = cmd.icon;
                      const isActive = idx === selectedIndex;
                      return (
                        <div
                          key={cmd.id}
                          className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors
                            ${isActive ? 'bg-white/[0.06] text-white' : 'text-white/60 hover:bg-white/[0.02]'}
                          `}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          onClick={() => {
                            navigate(cmd.path);
                            onClose();
                          }}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-white/40'}`} />
                          <span className="flex-1 text-sm font-medium">{cmd.name}</span>
                          {isActive && (
                            <ArrowRight className="w-4 h-4 text-white/30" />
                          )}
                        </div>
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
