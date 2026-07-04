import { Link } from 'react-router-dom';
import { Logo } from './Logo';

// Sticky, always-visible navbar. No scroll listeners or motion values — a plain
// fixed bar composites for free and never does per-frame work, so it can't
// contribute to scroll jank.
export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 w-full z-50 bg-black/60 backdrop-blur-2xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2.5">
          <Logo className="w-7 h-7 text-white" />
          <span className="text-xl font-medium tracking-tight text-white">Derivo</span>
        </Link>
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-neutral-400">
          <a href="#features" className="hover:text-white transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-white transition-colors">
            Workflow
          </a>
          <a href="#pricing" className="hover:text-white transition-colors">
            Pricing
          </a>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            to="/login"
            className="text-sm font-medium text-neutral-400 hover:text-white transition-colors hidden sm:block"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="px-4 py-1.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
