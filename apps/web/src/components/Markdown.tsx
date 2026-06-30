import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';

/**
 * Renders markdown into the Derivo dark theme. Internal links like
 * "./cli-reference.md" are rewritten to in-app docs routes (/docs/cli-reference).
 */
export function Markdown({ content }: { content: string }) {
  return (
    <div className="flex flex-col">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold text-white tracking-tight mb-4 mt-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-white tracking-tight mt-12 mb-3 pb-2 border-b border-white/[0.08]">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-white mt-8 mb-2">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-sm text-white/60 leading-relaxed font-light my-4">{children}</p>
          ),
          a: ({ href, children }) => {
            const target = href ?? '';
            // Rewrite relative doc links (./cli-reference.md) to /docs/<slug>.
            if (/^\.?\/?[\w-]+\.md$/.test(target)) {
              const slug = target.replace(/^\.?\//, '').replace(/\.md$/, '');
              return (
                <Link to={`/docs/${slug}`} className="text-white underline underline-offset-2 hover:text-white/70 transition-colors">
                  {children}
                </Link>
              );
            }
            const external = /^https?:\/\//.test(target);
            return (
              <a
                href={target}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                className="text-white underline underline-offset-2 hover:text-white/70 transition-colors"
              >
                {children}
              </a>
            );
          },
          ul: ({ children }) => (
            <ul className="my-4 flex flex-col gap-2 text-sm text-white/60 font-light">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-4 flex flex-col gap-2 text-sm text-white/60 font-light list-decimal pl-5">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed marker:text-white/30 [&>p]:my-0">{children}</li>
          ),
          code: ({ className, children }) => {
            const isBlock = (className ?? '').includes('language-');
            if (isBlock) {
              return <code className="font-mono text-[13px] text-white/85">{children}</code>;
            }
            return (
              <code className="font-mono text-[12px] text-white/85 bg-white/[0.06] border border-white/[0.08] rounded px-1.5 py-0.5">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="my-4 p-4 rounded-xl bg-[#0a0a0a] border border-white/[0.08] overflow-x-auto thin-scroll">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="my-5 rounded-xl border border-white/[0.08] overflow-hidden overflow-x-auto thin-scroll">
              <table className="w-full text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-white/[0.03]">{children}</thead>,
          th: ({ children }) => (
            <th className="text-left font-medium text-white/80 px-4 py-2.5 border-b border-white/[0.08]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="text-white/55 font-light px-4 py-2.5 border-b border-white/[0.05] align-top">
              {children}
            </td>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-4 pl-4 border-l-2 border-white/[0.14] text-white/50 italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-8 border-white/[0.08]" />,
          strong: ({ children }) => <strong className="text-white/90 font-semibold">{children}</strong>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
