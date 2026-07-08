import { Zap, Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Btn, IconTile } from '../ui/kit';

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
    <Modal
      open={isOpen}
      title={title}
      onClose={onClose}
      icon={<Zap className="w-4 h-4 text-accent" />}
    >
      <div className="p-6 relative">
        <div className="relative flex flex-col items-center text-center mb-6">
          <IconTile tone="accent" size="lg" className="mb-4">
            <Zap className="w-6 h-6" />
          </IconTile>
          <p className="text-sm text-muted-foreground px-2 leading-relaxed max-w-sm">
            {description}
          </p>
        </div>

        <div className="relative flex flex-col gap-2.5">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Included
          </span>
          <div className="grid grid-cols-1 gap-2 rounded-2xl border border-border bg-secondary/50 p-4">
            {premiumFeatures.map((feature) => (
              <div key={feature} className="flex items-center gap-2.5 text-sm text-foreground/80">
                <Check className="w-4 h-4 text-accent shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex flex-col gap-2.5 mt-6">
          <Btn variant="accent" onClick={handleUpgradeClick} className="w-full h-11">
            Upgrade to Pro <ArrowRight className="w-4 h-4" />
          </Btn>
          <Btn variant="ghost" onClick={onClose} className="w-full">
            Maybe later
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
