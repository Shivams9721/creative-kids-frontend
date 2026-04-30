export const metadata = {
  title: "About Us",
  description:
    "Creative Kid's crafts considered, premium clothing for babies and children — softness, durability, and design that grows with them.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <section className="max-w-[900px] mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-black/50 mb-4">About Creative Kid's</p>
        <h1 className="text-3xl sm:text-5xl font-light leading-tight mb-8">
          Considered clothing for the smallest, most curious humans.
        </h1>
        <p className="text-[15px] sm:text-base text-black/70 leading-relaxed mb-6">
          Creative Kid's was started with a simple belief: children deserve the same thoughtfulness in their wardrobe
          that adults expect in theirs. Every piece we make is shaped by how a child actually moves — running, climbing,
          spilling, sleeping — and is built to keep up without compromise.
        </p>
        <p className="text-[15px] sm:text-base text-black/70 leading-relaxed mb-12">
          We work with skilled Indian manufacturers, source soft natural-fibre fabrics, and finish each garment with
          details usually reserved for grown-up tailoring — flat seams that don't itch, reinforced stitching at stress
          points, and timeless silhouettes that move from playground to portrait day.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10 border-t border-black/10 pt-12">
          <div>
            <h3 className="text-[11px] font-bold tracking-widest uppercase mb-3">Made with care</h3>
            <p className="text-[14px] text-black/70 leading-relaxed">
              Soft, breathable fabrics — chosen for sensitive skin and a long second life in hand-me-down boxes.
            </p>
          </div>
          <div>
            <h3 className="text-[11px] font-bold tracking-widest uppercase mb-3">Built to last</h3>
            <p className="text-[14px] text-black/70 leading-relaxed">
              Reinforced seams, gentle elastics, and finishes tested through real wash cycles — not just photo shoots.
            </p>
          </div>
          <div>
            <h3 className="text-[11px] font-bold tracking-widest uppercase mb-3">Designed in India</h3>
            <p className="text-[14px] text-black/70 leading-relaxed">
              Quietly modern silhouettes drawn here, made here, and shipped from here — with the people who make them
              paid fairly for the craft.
            </p>
          </div>
        </div>

        <div className="mt-16 border-t border-black/10 pt-12">
          <p className="text-[14px] text-black/70 leading-relaxed italic">
            "We don't dress kids the way we think they should look — we dress them the way they actually live."
          </p>
        </div>
      </section>
    </main>
  );
}
