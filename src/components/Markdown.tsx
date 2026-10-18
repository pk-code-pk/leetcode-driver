/**
 * Renders markdown without pulling in a dependency: the lesson generator is told
 * exactly which shapes to emit (## headings, - lists, fenced code, **bold**,
 * `code`), and custom problem statements are written in the same subset.
 */
export function Markdown({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  const lines = text.split("\n");
  let code: string[] | null = null;
  let list: string[] = [];

  const flushList = (k: string) => {
    if (!list.length) return;
    blocks.push(
      <ul key={k} className="mt-2 space-y-1.5 text-neutral-300">
        {list.map((li, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-neutral-600">·</span>
            <span dangerouslySetInnerHTML={{ __html: inline(li) }} />
          </li>
        ))}
      </ul>,
    );
    list = [];
  };

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    if (line.startsWith("```")) {
      if (code) {
        blocks.push(
          <pre key={`c${i}`} className="mt-3 overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs leading-relaxed text-emerald-200">
            <code>{code.join("\n")}</code>
          </pre>,
        );
        code = null;
      } else {
        flushList(`l${i}`);
        code = [];
      }
      return;
    }
    if (code) return void code.push(raw);
    if (line.startsWith("## ")) {
      flushList(`l${i}`);
      blocks.push(
        <h2 key={`h${i}`} className="mt-7 text-sm font-medium tracking-wide text-emerald-400">
          {line.slice(3)}
        </h2>,
      );
      return;
    }
    if (line.startsWith("- ")) return void list.push(line.slice(2));
    if (!line.trim()) return void flushList(`l${i}`);
    flushList(`l${i}`);
    blocks.push(
      <p key={`p${i}`} className="mt-2 text-neutral-300" dangerouslySetInnerHTML={{ __html: inline(line) }} />,
    );
  });
  flushList("last");
  return <div className="text-sm leading-relaxed">{blocks}</div>;
}

/** Bold and inline code only — everything else is left as written. */
function inline(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-medium text-neutral-100">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="rounded bg-neutral-800 px-1 py-0.5 text-[12px] text-emerald-200">$1</code>');
}
