import { Link } from 'react-router-dom';
import { Logo } from '../landing/Logo';

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Features', to: '/#features' },
      { label: 'Pricing', to: '/#pricing' },
      { label: 'Docs', to: '/docs' },
      { label: 'CLI', to: '/docs/cli-reference' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '#' },
      { label: 'Blog', to: '#' },
      { label: 'Contact', to: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms of Service', to: '/terms' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="w-full bg-background border-t border-border">
      <div className="max-w-5xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <span className="flex items-center gap-2 text-foreground">
            <Logo className="w-6 h-6" />
            <span className="text-lg font-semibold tracking-tight">Derivo</span>
          </span>
          <p className="mt-3 text-sm text-muted-foreground max-w-xs leading-relaxed">
            Pristine local development environments, automated in seconds.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-semibold text-foreground mb-3">{col.title}</h4>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Derivo Inc. All rights reserved.
        </p>
        <p className="text-xs text-muted-foreground font-mono">npm install -g derivo</p>
      </div>
    </footer>
  );
}
