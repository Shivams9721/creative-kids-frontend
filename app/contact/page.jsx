"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Opens default mail client with pre-filled content
    window.location.href = `mailto:support@creativekids.co.in?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`;
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-white pt-[64px] md:pt-[72px] pb-24">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-light tracking-widest uppercase text-black mb-2">Contact Us</h1>
        <p className="text-[13px] text-black/50 mb-16">We're here to help. Reach out and we'll respond within 24 hours.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* LEFT: CONTACT INFO */}
          <div className="space-y-10">
            <div className="flex gap-5 items-start">
              <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail size={18} className="text-black" />
              </div>
              <div>
                <h3 className="text-[11px] font-bold tracking-widest uppercase text-black mb-1">Email</h3>
                <a href="mailto:support@creativekids.co.in" className="text-[14px] text-black/70 hover:text-black transition-colors">support@creativekids.co.in</a>
              </div>
            </div>

            <div className="flex gap-5 items-start">
              <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center flex-shrink-0">
                <Phone size={18} className="text-black" />
              </div>
              <div>
                <h3 className="text-[11px] font-bold tracking-widest uppercase text-black mb-1">Phone / WhatsApp</h3>
                <a href="tel:+919999999999" className="text-[14px] text-black/70 hover:text-black transition-colors">+91 99999 99999</a>
                <p className="text-[11px] text-black/40 mt-1">Mon–Sat, 10am–6pm IST</p>
              </div>
            </div>

            <div className="flex gap-5 items-start">
              <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-black" />
              </div>
              <div>
                <h3 className="text-[11px] font-bold tracking-widest uppercase text-black mb-1">Registered Address</h3>
                <p className="text-[14px] text-black/70 leading-relaxed">
                  Creative Kids<br />
                  123, Business Park, Sector 5<br />
                  Mumbai, Maharashtra – 400001<br />
                  India
                </p>
              </div>
            </div>

            <div className="flex gap-5 items-start">
              <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock size={18} className="text-black" />
              </div>
              <div>
                <h3 className="text-[11px] font-bold tracking-widest uppercase text-black mb-1">Support Hours</h3>
                <p className="text-[14px] text-black/70">Monday – Saturday</p>
                <p className="text-[14px] text-black/70">10:00 AM – 6:00 PM IST</p>
              </div>
            </div>
          </div>

          {/* RIGHT: CONTACT FORM */}
          <div>
            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
                <h3 className="text-xl font-light text-green-800 mb-2">Message Sent!</h3>
                <p className="text-[13px] text-green-700">Your email client should have opened. We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-black/60">Your Name</label>
                    <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                      className="border border-black/20 p-3.5 rounded-xl text-[14px] outline-none focus:border-black transition-colors" placeholder="Jane Doe" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-black/60">Email Address</label>
                    <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                      className="border border-black/20 p-3.5 rounded-xl text-[14px] outline-none focus:border-black transition-colors" placeholder="jane@example.com" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-black/60">Subject</label>
                  <input required type="text" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}
                    className="border border-black/20 p-3.5 rounded-xl text-[14px] outline-none focus:border-black transition-colors" placeholder="Order issue, return request, etc." />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-black/60">Message</label>
                  <textarea required rows={5} value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                    className="border border-black/20 p-3.5 rounded-xl text-[14px] outline-none focus:border-black transition-colors resize-none" placeholder="Describe your issue or question..." />
                </div>
                <button type="submit" className="w-full bg-black text-white py-4 rounded-full text-[12px] font-bold tracking-widest uppercase hover:bg-black/80 transition-colors">
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
