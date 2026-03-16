export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-white pt-[64px] md:pt-[72px] pb-24">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-light tracking-widest uppercase text-black mb-2">Cancellation & Refund Policy</h1>
        <p className="text-[11px] text-black/40 tracking-widest uppercase mb-12">Last updated: March 2026</p>

        <div className="space-y-10 text-[14px] text-black/70 leading-relaxed">
          <section>
            <h2 className="text-[12px] font-bold tracking-widest uppercase text-black mb-3">Order Cancellation</h2>
            <p>You may cancel your order within <strong className="text-black">12 hours</strong> of placing it, provided it has not yet been dispatched. To cancel, contact us immediately at <a href="mailto:support@creativekids.co.in" className="text-black underline">support@creativekids.co.in</a> with your order number.</p>
            <p className="mt-3">Once an order has been dispatched, it cannot be cancelled. You may initiate a return after delivery.</p>
          </section>
          <section>
            <h2 className="text-[12px] font-bold tracking-widest uppercase text-black mb-3">Return Eligibility</h2>
            <p>We accept returns within <strong className="text-black">7 days</strong> of delivery for the following reasons:</p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li>Item received is damaged or defective</li>
              <li>Wrong item or size delivered</li>
              <li>Item significantly different from the product description</li>
            </ul>
            <p className="mt-3">Items must be unused, unwashed, and in original packaging with all tags intact.</p>
          </section>
          <section>
            <h2 className="text-[12px] font-bold tracking-widest uppercase text-black mb-3">Non-Returnable Items</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Items purchased during sale or with discount codes</li>
              <li>Items that have been washed, worn, or altered</li>
              <li>Items without original tags or packaging</li>
            </ul>
          </section>
          <section>
            <h2 className="text-[12px] font-bold tracking-widest uppercase text-black mb-3">Refund Process</h2>
            <p>Once we receive and inspect the returned item, we will notify you of the approval or rejection of your refund within 2 business days.</p>
            <p className="mt-3">Approved refunds will be processed within <strong className="text-black">5–7 business days</strong> to your original payment method. For COD orders, refunds will be issued via bank transfer.</p>
          </section>
          <section>
            <h2 className="text-[12px] font-bold tracking-widest uppercase text-black mb-3">How to Initiate a Return</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Email us at <a href="mailto:support@creativekids.co.in" className="text-black underline">support@creativekids.co.in</a> with your order number and reason for return</li>
              <li>Attach photos of the item and packaging</li>
              <li>We will arrange a pickup or provide a return address within 24 hours</li>
            </ol>
          </section>
        </div>
      </div>
    </main>
  );
}
