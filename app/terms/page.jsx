export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white pt-[64px] md:pt-[72px] pb-24">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-light tracking-widest uppercase text-black mb-2">Terms & Conditions</h1>
        <p className="text-[11px] text-black/40 tracking-widest uppercase mb-12">Last updated: January 2025</p>

        <div className="space-y-10 text-[14px] text-black/70 leading-relaxed">
          <section>
            <h2 className="text-[12px] font-bold tracking-widest uppercase text-black mb-3">1. Acceptance of Terms</h2>
            <p>By accessing and using creativekids.co.in, you accept and agree to be bound by these Terms and Conditions. If you do not agree, please do not use our website.</p>
          </section>
          <section>
            <h2 className="text-[12px] font-bold tracking-widest uppercase text-black mb-3">2. Products & Pricing</h2>
            <p>All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes. We reserve the right to modify prices at any time without prior notice. Product images are for illustrative purposes; actual product colour may vary slightly due to screen settings.</p>
          </section>
          <section>
            <h2 className="text-[12px] font-bold tracking-widest uppercase text-black mb-3">3. Orders & Payment</h2>
            <p>Placing an order constitutes an offer to purchase. We reserve the right to cancel any order due to stock unavailability, pricing errors, or suspected fraud. Payment must be completed before dispatch for prepaid orders.</p>
          </section>
          <section>
            <h2 className="text-[12px] font-bold tracking-widest uppercase text-black mb-3">4. Intellectual Property</h2>
            <p>All content on this website including text, graphics, logos, and images is the property of Creative Kids and is protected under Indian copyright law. Unauthorised use is strictly prohibited.</p>
          </section>
          <section>
            <h2 className="text-[12px] font-bold tracking-widest uppercase text-black mb-3">5. Limitation of Liability</h2>
            <p>Creative Kids shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or website. Our maximum liability shall not exceed the value of the order placed.</p>
          </section>
          <section>
            <h2 className="text-[12px] font-bold tracking-widest uppercase text-black mb-3">6. Governing Law</h2>
            <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in India.</p>
          </section>
          <section>
            <h2 className="text-[12px] font-bold tracking-widest uppercase text-black mb-3">7. Contact</h2>
            <p>For any queries regarding these terms, please contact us at <a href="mailto:support@creativekids.co.in" className="text-black underline">support@creativekids.co.in</a>.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
