import React from 'react';
import { X, Zap, Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function UpgradeModal({
  isOpen,
  onClose,
  title = 'Upgrade to Pro',
  description = 'Your premium trial has expired. Upgrade to Pro to continue creating projects, managing environments, and generating keys.',
}: UpgradeModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleUpgradeClick = () => {
    onClose();
    navigate('/dashboard/billing');
  };

  const premiumFeatures = [
    'Unlimited projects and environments',
    'Unlimited CLI authenticated devices',
    'Unlimited API key generation',
    'Priority Slack & email support',
    'Real-time dependency auditing',
    'Advanced security diagnostics',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b0b0b] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow effect */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.05] transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mt-2 mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
          <p className="text-xs text-white/50 mt-2 px-2 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Premium Features List */}
        <div className="flex flex-col gap-2.5 mb-8">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider ml-1">
            What is included:
          </span>
          <div className="grid grid-cols-1 gap-2 bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl">
            {premiumFeatures.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-white/70">
                <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleUpgradeClick}
            className="w-full py-2.5 rounded-lg bg-white text-black hover:bg-white/90 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-[0_2px_8px_rgba(255,255,255,0.15)]"
          >
            Upgrade to Pro <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] text-white/70 hover:text-white font-medium text-xs transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
