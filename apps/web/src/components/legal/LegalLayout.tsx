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
    <div className="relative min-h-screen bg-[#080808] overflow-x-hidden font-sans text-white selection:bg-white/20">
      <Background />
      <Navbar />

      <main className="relative z-10 pt-32 md:pt-36 pb-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="mb-12 border-b border-white/[0.08] pb-8">
            <span className="text-[11px] font-mono tracking-widest text-white/30 uppercase">
              Legal
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mt-3 leading-[1.1]">
              {title}
            </h1>
            <p className="mt-4 text-sm text-white/40 font-mono">Effective {effectiveDate}</p>
          </div>

          <article
            className="
              prose-legal
              [&>section]:mb-10
              [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_h2]:tracking-tight [&_h2]:mb-3 [&_h2]:mt-0
              [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-white/90 [&_h3]:mb-2 [&_h3]:mt-6
              [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-white/55 [&_p]:mb-4
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_ul]:mb-4
              [&_li]:text-sm [&_li]:leading-relaxed [&_li]:text-white/55
              [&_a]:text-white/80 [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-white
              [&_strong]:text-white/80 [&_strong]:font-medium
              [&_code]:font-mono [&_code]:text-[13px] [&_code]:text-white/70 [&_code]:bg-white/[0.06] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded
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
