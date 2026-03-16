export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white pt-[64px] md:pt-[72px] pb-24">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-light tracking-widest uppercase text-black mb-2">Privacy Policy</h1>
        <p className="text-[11px] text-black/40 tracking-widest uppercase mb-12">Last updated: March 2026</p>

        <div className="space-y-10 text-[14px] text-black/70 leading-relaxed">
          <section>
            <h2 className="text-[12px] font-bold tracking-widest uppercase text-black mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly: name, email address, phone number, and shipping address when you create an account or place an order. We also collect browsing data such as pages visited and items viewed to improve your experience.</p>
          </section>
          <section>
            <h2 className="text-[12px] font-bold tracking-widest uppercase text-black mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To process and fulfil your orders</li>
              <li>To send order confirmation and shipping updates</li>
              <li>To respond to customer service requests</li>
              <li>To improve our website and product offerings</li>
              <li>To send promotional communications (only with your consent)</li>
            </ul>
          </section>
          <section>
            <h2 className="text-[12px] font-bold tracking-widest uppercase text-black mb-3">3. Data Sharing</h2>
            <p>We do not sell your personal data. We share your information only with trusted third parties necessary to operate our business: payment processors (Razorpay), shipping partners (Delhivery/Shiprocket), and cloud infrastructure (AWS). All partners are bound by confidentiality agreements.</p>
          </section>
          <section>
            <h2 className="text-[12px] font-bold tracking-widest uppercase text-black mb-3">4. Data Security</h2>
            <p>We implement industry-standard security measures including encrypted passwords, HTTPS, and secure cloud storage. However, no method of transmission over the internet is 100% secure.</p>
          </section>
          <section>
            <h2 className="text-[12px] font-bold tracking-widest uppercase text-black mb-3">5. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data at any time. To exercise these rights, contact us at <a href="mailto:support@creativekids.co.in" className="text-black underline">support@creativekids.co.in</a>.</p>
          </section>
          <section>
            <h2 className="text-[12px] font-bold tracking-widest uppercase text-black mb-3">6. Cookies</h2>
            <p>We use cookies to maintain your session and remember your cart. You can disable cookies in your browser settings, but this may affect website functionality.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
