"use client";

import { useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // PALITAN MO ITO NG N8N WEBHOOK URL MO, BOSS
  const N8N_WEBHOOK_URL = "https://n8n.srv1356414.hstgr.cloud/webhook-test/vertex-leads";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message"),
      source: "Vertex Landing Page",
    };

    try {
      await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      setSubmitted(true);
    } catch (error) {
      alert("Error sending data, Master. Check your n8n connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-black font-sans selection:bg-sky-100">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-xl font-black tracking-tighter">VERTEX</div>
          <button className="bg-black text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-800 transition">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest uppercase bg-sky-50 text-sky-600 rounded-full">
            The Future of Business Systems
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
            Reach the Peak of <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-indigo-600">
              Automated Growth
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-500 mb-10 leading-relaxed">
            Architecting enterprise-grade AI systems, performance UGC, and n8n workflows for businesses ready to scale without the manual grind.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#audit" className="w-full sm:w-auto bg-black text-white px-10 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl hover:scale-[1.02] transition-all text-center">
              Claim Strategy Audit
            </a>
          </div>
        </div>
      </section>

      {/* Lead Capture Section */}
      <section id="audit" className="py-24 px-6 bg-white">
        <div className="max-w-xl mx-auto border border-gray-100 p-10 rounded-[40px] shadow-2xl shadow-sky-100">
          {submitted ? (
            <div className="text-center py-10">
              <h2 className="text-3xl font-black text-sky-600 mb-4">Mission Success! 🏔️</h2>
              <p className="text-gray-500">The n8n engine has received your data. Standby for the Master's audit.</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-10">
                <h2 className="text-3xl font-black mb-3">Claim Your Strategy Audit</h2>
                <p className="text-gray-500">Master, fill this up and our n8n engine will handle the rest.</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <input name="name" type="text" placeholder="Your Name" className="w-full p-5 bg-gray-50 rounded-2xl border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-sky-600 outline-none transition" required />
                <input name="email" type="email" placeholder="Business Email" className="w-full p-5 bg-gray-50 rounded-2xl border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-sky-600 outline-none transition" required />
                <textarea name="message" placeholder="Tell us about your manual grind..." className="w-full p-5 bg-gray-50 rounded-2xl border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-sky-600 outline-none transition h-32" required></textarea>
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-black text-white p-5 rounded-2xl font-black text-lg hover:bg-sky-600 hover:shadow-xl transition-all active:scale-95 disabled:bg-gray-400"
                >
                  {loading ? "Sending to Engine..." : "Ignite Growth 🚀"}
                </button>
              </form>
            </>
          )}
        </div>
      </section>

      <footer className="py-10 text-center text-gray-400 text-sm border-t border-gray-50">
        © 2026 Vertex AI Marketing. Built by the Master.
      </footer>
    </main>
  );
}