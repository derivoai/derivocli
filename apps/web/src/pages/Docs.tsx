import { useEffect } from 'react';
import { useParams, Navigate, NavLink } from 'react-router-dom';
import { Navbar } from '../components/landing/Navbar';
import { Footer } from '../components/landing/Footer';
import { Background } from '../components/landing/Background';
import { Markdown } from '../components/Markdown';

// Eagerly import the real markdown docs from the monorepo root.
const files = import.meta.glob('../../../../docs/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** Build a slug -> raw-markdown map from the imported files. */
const docsBySlug: Record<string, string> = {};
for (const [filepath, content] of Object.entries(files)) {
  const slug = filepath.split('/').pop()!.replace(/\.md$/, '');
  docsBySlug[slug] = content;
}

// Curated, ordered list of user-facing docs (internal/maintainer docs omitted).
const NAV: { slug: string; label: string }[] = [
  { slug: 'quickstart', label: 'Quick start' },
  { slug: 'installation', label: 'Installation' },
  { slug: 'cli-reference', label: 'CLI reference' },
  { slug: 'configuration', label: 'Configuration' },
  { slug: 'plugin-authoring', label: 'Plugin authoring' },
  { slug: 'security', label: 'Security' },
  { slug: 'troubleshooting', label: 'Troubleshooting' },
].filter((item) => docsBySlug[item.slug]);

const DEFAULT_SLUG = NAV[0]?.slug ?? 'quickstart';

export function Docs() {
  const { slug } = useParams<{ slug?: string }>();
  const active = slug ?? DEFAULT_SLUG;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [active]);

  // Unknown slug → redirect to the first doc.
  if (slug && !docsBySlug[slug]) {
    return <Navigate to={`/docs/${DEFAULT_SLUG}`} replace />;
  }

  const content = docsBySlug[active];

  return (
    <div className="lightui relative min-h-screen bg-background overflow-x-hidden font-sans text-foreground selection:bg-accent/20">
      <Background />
      <Navbar />

      <main className="relative z-10 pt-32 md:pt-36 pb-24">
        <div className="max-w-5xl mx-auto px-6 flex flex-col lg:flex-row gap-12">
          {/* Sidebar */}
          <aside className="lg:w-52 shrink-0">
            <nav className="lg:sticky lg:top-28 flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 px-3">
                Documentation
              </span>
              {NAV.map((item) => (
                <NavLink
                  key={item.slug}
                  to={`/docs/${item.slug}`}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      isActive || item.slug === active
                        ? 'bg-secondary text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <article className="flex-1 min-w-0">
            {content ? (
              <Markdown content={content} />
            ) : (
              <p className="text-sm text-muted-foreground">Documentation is being prepared.</p>
            )}
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
