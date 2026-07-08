import type { ReactNode } from 'react';
import { Navbar } from '../landing/Navbar';
import { Footer } from '../landing/Footer';
import { Background } from '../landing/Background';

interface LegalLayoutProps {
  title: string;
  effectiveDate: string;
  children: ReactNode;
}

/**
 * Shared shell for legal/policy pages (Privacy Policy, Terms of Service).
 * Matches the Docs page's dark, monochrome prose treatment so legal content
 * feels native to the site rather than a bolted-on template.
 */
export function LegalLayout({ title, effectiveDate, children }: LegalLayoutProps) {
  return (
    <div className="lightui relative min-h-screen bg-background overflow-x-hidden font-sans text-foreground selection:bg-accent/20">
      <Background />
      <Navbar />

      <main className="relative z-10 pt-32 md:pt-36 pb-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="mb-12 border-b border-border pb-8">
            <span className="text-[11px] font-mono tracking-widest text-muted-foreground uppercase">
              Legal
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mt-3 leading-[1.1]">
              {title}
            </h1>
            <p className="mt-4 text-sm text-muted-foreground font-mono">
              Effective {effectiveDate}
            </p>
          </div>

          <article
            className="
              prose-legal
              [&>section]:mb-10
              [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:tracking-tight [&_h2]:mb-3 [&_h2]:mt-0
              [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mb-2 [&_h3]:mt-6
              [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_p]:mb-4
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_ul]:mb-4
              [&_li]:text-sm [&_li]:leading-relaxed [&_li]:text-muted-foreground
              [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-accent
              [&_strong]:text-foreground [&_strong]:font-medium
              [&_code]:font-mono [&_code]:text-[13px] [&_code]:text-foreground [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded
            "
          >
            {children}
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
