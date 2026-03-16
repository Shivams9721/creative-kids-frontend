export default function ShippingPolicyPage() {
  return (
    <main className="min-h-screen bg-white pt-[64px] md:pt-[72px] pb-24">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-light tracking-widest uppercase text-black mb-2">Shipping Policy</h1>
        <p className="text-[11px] text-black/40 tracking-widest uppercase mb-12">Last updated: March 2026</p>

        <div className="space-y-10 text-[14px] text-black/70 leading-relaxed">
          <section>
            <h2 className="text-[12px] font-bold tracking-widest uppercase text-black mb-3">Processing Time</h2>
            <p>All orders are processed within 1–2 business days after payment confirmation. Orders placed on weekends or public holidays will be processed on the next business day.</p>
          </section>
          <section>
            <h2 className="text-[12px] font-bold tracking-widest uppercase text-black mb-3">Delivery Timeframes</h2>
            <div className="border border-black/10 rounded-xl overflow-hidden">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#fafafa]">
                  <tr>
                    <th className="p-4 font-bold text-black">Location</th>
                    <th className="p-4 font-bold text-black">Estimated Delivery</th>
                    <th className="p-4 font-bold text-black">Charges</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-black/5">
                    <td className="p-4">Metro Cities</td>
                    <td className="p-4">2–4 Business Days</td>
                    <td className="p-4 font-medium text-green-600">Free</td>
                  </tr>
                  <tr className="border-t border-black/5 bg-[#fafafa]">
                    <td className="p-4">Tier 2 & 3 Cities</td>
                    <td className="p-4">4–6 Business Days</td>
                    <td className="p-4 font-medium text-green-600">Free</td>
                  </tr>
                  <tr className="border-t border-black/5">
                    <td className="p-4">Remote Areas</td>
                    <td className="p-4">6–10 Business Days</td>
                    <td className="p-4 font-medium text-green-600">Free</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          <section>
            <h2 className="text-[12px] font-bold tracking-widest uppercase text-black mb-3">Order Tracking</h2>
            <p>Once your order is shipped, you will receive an AWB (tracking) number via your order history in your account. You can use this number on the courier's website to track your package in real time.</p>
          </section>
          <section>
            <h2 className="text-[12px] font-bold tracking-widest uppercase text-black mb-3">Failed Delivery</h2>
            <p>If a delivery attempt fails due to an incorrect address or unavailability, the courier will attempt delivery up to 2 more times. After that, the package will be returned to us and a re-shipping fee may apply.</p>
          </section>
          <section>
            <h2 className="text-[12px] font-bold tracking-widest uppercase text-black mb-3">Damaged in Transit</h2>
            <p>If your order arrives damaged, please photograph the package and product immediately and contact us within 48 hours at <a href="mailto:support@creativekids.co.in" className="text-black underline">support@creativekids.co.in</a>.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
