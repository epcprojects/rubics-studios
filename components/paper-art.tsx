/** The tilted graded-paper illustration from the client's design. Decorative only. */
export function PaperArt({ ring = "#eaf0e4" }: { ring?: string }) {
  return (
    <div aria-hidden className="relative h-full min-h-56 w-full">
      <div className="absolute top-8 right-4 h-56 w-44 rotate-[20deg] rounded-[5px] border border-[#d7decd] bg-[#d0ddbf]" />
      <div className="absolute top-4 right-16 h-56 w-48 rotate-[10deg] rounded-[5px] border border-[#d7decd] bg-[#fffef8] p-5 shadow-[0_7px_15px_rgb(41_75_52/0.08)]">
        <p className="text-[11px] font-medium uppercase tracking-[1.6px] text-ink-3">Persuasive essay</p>
        <p className="mt-1 font-display text-2xl leading-tight">A clear point of view.</p>
        <div className="mt-3 h-20 bg-[repeating-linear-gradient(0deg,transparent_0_21px,#e3e8dc_21px_22px)]" />
        <p className="font-display text-3xl text-sage">A− ✓</p>
      </div>
      <div
        className="absolute top-8 right-12 grid size-12 -rotate-[10deg] place-items-center rounded-full border-[5px] bg-[#efb18d] text-xl text-[#5b5439]"
        style={{ borderColor: ring }}
      >
        ✓
      </div>
    </div>
  );
}
