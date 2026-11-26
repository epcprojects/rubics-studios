import { cx } from "@/components/ui";

export interface BarDatum {
  label: string;
  /** stacked segments, bottom to top */
  parts: Array<{ value: number; className: string; name: string }>;
}

export function BarChart({ data, format = String, height = 150 }: { data: BarDatum[]; format?: (n: number) => string; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.parts.reduce((s, p) => s + p.value, 0)));
  const summary = data.map((d) => `${d.label}: ${format(d.parts.reduce((s, p) => s + p.value, 0))}`).join(", ");
  return (
    <div role="img" aria-label={summary}>
      <div className="flex items-end gap-2 sm:gap-3" style={{ height }}>
        {data.map((d) => {
          const total = d.parts.reduce((s, p) => s + p.value, 0);
          return (
            <div key={d.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[11px] font-semibold text-ink-2">{total ? format(total) : ""}</span>
              <div className="flex w-full max-w-10 flex-col-reverse overflow-hidden rounded-t-md" style={{ height: `${(total / max) * (height - 22)}px`, minHeight: total ? 3 : 0 }}>
                {d.parts.map((p) =>
                  p.value > 0 ? <div key={p.name} title={`${p.name}: ${format(p.value)}`} className={p.className} style={{ flexGrow: p.value, flexBasis: 0 }} /> : null,
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2 sm:gap-3">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center text-[11px] text-ink-3">{d.label}</span>
        ))}
      </div>
    </div>
  );
}

export function Legend({ items }: { items: Array<{ label: string; className: string }> }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className={cx("size-2.5 rounded-sm", i.className)} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}
