"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Menu, X, ChevronDown, Star, Check, ArrowRight,
  Phone, Mail, MessageCircle, Globe,
  BarChart3, Bot, ShoppingCart, Database, Users, Headphones,
  Search, PenLine, Rocket, TrendingUp,
  Briefcase, Shield,
} from "lucide-react"
import ShimmerButton from "@/components/ui/shimmer-button"

const PHONE = "639272978534"
const WHATSAPP = `https://wa.me/${PHONE}`
const SCRIPT_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"

const CLIENTS = [
  "Kambal Burger","StayPH","Northlight Energy","BurgerBoss",
  "SolarTech PH","CourtSide","Bocaue Eats","SmartParking",
  "Vertex Labs","Apex Retail","Summit Foods","NetSuite PH",
]

const SERVICES = [
  { icon: Database, title: "NetSuite ERP Implementation", desc: "Full NetSuite setup, SuiteScript & SuiteFlow customization, and seamless data migration for Philippine SMEs." },
  { icon: Bot, title: "AI Workflow Automation", desc: "n8n-powered automations, AI agents, and intelligent process orchestration that eliminate manual work." },
  { icon: ShoppingCart, title: "POS & Inventory Systems", desc: "Real-time point-of-sale dashboards with live stock tracking, branch sync, and sales analytics." },
  { icon: BarChart3, title: "Business Intelligence", desc: "Custom dashboards, automated reports, and data visualizations built on your actual business data." },
  { icon: Users, title: "CRM & Lead Management", desc: "Automated pipeline tracking, AI follow-ups, and lead scoring so your team closes more deals." },
  { icon: Headphones, title: "Training & Ongoing Support", desc: "Dedicated account manager, team onboarding, and continuous optimization — we stay with you." },
]

const STEPS = [
  { num: "01", icon: Search, title: "Discovery Call", desc: "We deep-dive into your operations, pain points, and goals to understand exactly what you need." },
  { num: "02", icon: PenLine, title: "System Design", desc: "Custom architecture mapped to your exact workflows — no cookie-cutter templates." },
  { num: "03", icon: Rocket, title: "Build & Deploy", desc: "Rapid implementation with rigorous testing, live training, and full go-live support." },
  { num: "04", icon: TrendingUp, title: "Train & Scale", desc: "Team onboarding, documentation, and ongoing optimization as your business grows." },
]

const TESTIMONIALS = [
  { quote: "Vertex CP transformed our entire operations. Manual reconciliation that took 3 days now runs automatically every night. ROI in under 4 months.", name: "Maria Santos", role: "Operations Manager", company: "Kambal Burger", av: "MS" },
  { quote: "Our booking platform went from Excel chaos to a fully automated system. Revenue increased 40% in the first quarter alone. Absolutely game-changing.", name: "Carlo Reyes", role: "Founder", company: "StayPH", av: "CR" },
  { quote: "The AI lead management they built for us is incredible. Follow-up is fully automated. We now close 3x more deals with the exact same team.", name: "Dennis Lim", role: "CEO", company: "Northlight Energy", av: "DL" },
]

const STATS = [
  { icon: Briefcase, value: "50+", label: "Businesses Served" },
  { icon: TrendingUp, value: "₱2B+", label: "Revenue Managed" },
  { icon: BarChart3, value: "4x", label: "Average ROI" },
  { icon: Shield, value: "98%", label: "Client Retention" },
]

const PLANS = [
  { name: "Starter", price: "₱15,000", badge: "Save 20%", best: false, features: ["1 Core System","AI Chatbot Integration","Basic Analytics Dashboard","Email Support","Monthly Check-in","Up to 5 Users"], bonus: "Free system audit (worth ₱5,000)", cta: "Get Started" },
  { name: "Growth", price: "₱35,000", badge: "Save 35%", best: true,  features: ["ERP + AI Full Stack","Advanced Automations","Real-time Dashboard","Priority Support","Weekly Reviews","Up to 20 Users"], bonus: "Free team training (worth ₱15,000)", cta: "Book a Call" },
  { name: "Enterprise", price: "₱75,000", badge: "Save 40%", best: false, features: ["Full Enterprise Suite","Custom Development","Dedicated Account Team","24/7 Support","Daily Syncs","Unlimited Users"], bonus: "Free data migration (worth ₱30,000)", cta: "Talk to Us" },
]

const FAQS = [
  { q: "How long does ERP implementation take?", a: "Most implementations are completed within 4–8 weeks depending on scope. Simple automations can go live in as little as 1 week." },
  { q: "Do you support NetSuite customization?", a: "Yes — we specialize in SuiteScript, SuiteFlow, SuiteTalk, and custom module development tailored to Philippine business workflows." },
  { q: "What types of businesses do you serve?", a: "We work with F&B, retail, hospitality, energy, professional services, and e-commerce businesses across the Philippines and Southeast Asia." },
  { q: "Can you automate our existing processes?", a: "Absolutely. We audit your current workflows, identify automation opportunities, and build custom n8n or AI-powered solutions that connect your existing tools." },
  { q: "What is the minimum contract length?", a: "We offer month-to-month plans with no lock-in. Most clients stay 12+ months because the results speak for themselves." },
  { q: "Do you train our team after implementation?", a: "Yes — every plan includes structured team training, documentation, and recorded walkthroughs so your team can operate the system independently." },
  { q: "What happens if we need changes after launch?", a: "All plans include ongoing support and optimization. We treat your system as a living product — not a one-time delivery." },
]

const PORTFOLIO = [
  { title: "Kambal Burger POS", cat: "POS & Inventory", desc: "Real-time sales dashboard with multi-branch inventory tracking.", color: "from-orange-600 to-red-700" },
  { title: "StayPH Booking Platform", cat: "SaaS & Automation", desc: "Full booking engine with automated guest comms and analytics.", color: "from-blue-600 to-indigo-700" },
  { title: "Smart Parking System", cat: "Operations", desc: "Live slot availability, QR entry, and automated billing.", color: "from-teal-600 to-cyan-700" },
  { title: "AI Lead Bot", cat: "AI Automation", desc: "Conversational AI that qualifies leads and books meetings 24/7.", color: "from-purple-600 to-pink-700" },
  { title: "Solar Quote Tool", cat: "Client Portal", desc: "Interactive solar estimation with PDF export and CRM sync.", color: "from-yellow-500 to-orange-600" },
  { title: "Vertex CRM Dashboard", cat: "CRM & Analytics", desc: "Unified pipeline with AI-powered follow-up and reporting.", color: "from-green-600 to-teal-600" },
  { title: "CourtSide Stats App", cat: "Sports Analytics", desc: "Live game scoring with player stats and tournament brackets.", color: "from-slate-600 to-blue-700" },
  { title: "NetSuite ERP Suite", cat: "Enterprise ERP", desc: "Full NetSuite deployment with custom Filipino payroll module.", color: "from-red-700 to-rose-700" },
]

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function Label({ text }: { text: string }) {
  return (
    <div className="flex justify-center mb-4">
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#0A84FF]/30 bg-[#0A84FF]/10 text-[#0A84FF] text-xs font-semibold tracking-widest uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF] animate-pulse" />{text}
      </span>
    </div>
  )
}

type FormData = { name: string; phone: string; email: string; business: string; plan: string; date: string }

export default function PartnerPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const [stickyVisible, setStickyVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<FormData>({ name: "", phone: "", email: "", business: "", plan: "Growth", date: "" })
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => {
      const h = heroRef.current?.offsetHeight ?? 600
      setStickyVisible(window.scrollY > h && !dismissed)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [dismissed])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setModalOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try { await fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify(form) }) } catch (_) {}
    setSubmitting(false)
    setSubmitted(true)
  }

  const openModal = () => { setModalOpen(true); setSubmitted(false) }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="bg-[#020617] text-white overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06] bg-[#020617]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between gap-6">
          <a href="#" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#0A84FF] flex items-center justify-center font-black text-sm">V</div>
            <div className="leading-none">
              <p className="text-sm font-bold tracking-tight">Vertex CP</p>
              <p className="text-[10px] text-white/40">Consulting Partner</p>
            </div>
          </a>
          <div className="hidden md:flex items-center gap-1">
            {["Services","How It Works","Portfolio","Pricing","FAQ"].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g,"-")}`}
                className="px-3.5 py-2 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/5 transition-all font-medium">{l}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <a href={`tel:+${PHONE}`} className="text-sm text-white/50 hover:text-white transition-colors flex items-center gap-1.5">
              <Phone size={13} />+63 927 297 8534
            </a>
            <ShimmerButton onClick={openModal} className="px-5 py-2.5 text-sm font-semibold">Book a Call</ShimmerButton>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-white/60 hover:text-white p-1">
            {mobileOpen ? <X size={22}/> : <Menu size={22}/>}
          </button>
        </div>
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
              className="md:hidden absolute top-16 inset-x-0 bg-[#020617]/95 backdrop-blur-xl border-b border-white/[0.06] p-5 flex flex-col gap-1">
              {["Services","How It Works","Portfolio","Pricing","FAQ"].map(l => (
                <a key={l} href={`#${l.toLowerCase().replace(/ /g,"-")}`} onClick={() => setMobileOpen(false)}
                  className="py-3 px-4 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-xl font-medium">{l}</a>
              ))}
              <button onClick={() => { openModal(); setMobileOpen(false) }}
                className="mt-3 w-full py-3 bg-[#0A84FF] rounded-xl text-sm font-bold">Book a Free Call</button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* HERO */}
      <section ref={heroRef} className="relative min-h-screen pt-16 flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-[#020617]" />
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#0A84FF]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#0A84FF]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-5 md:px-8 py-24 grid md:grid-cols-2 gap-16 items-center w-full">
          <div>
            <motion.span initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#0A84FF]/30 bg-[#0A84FF]/10 text-[#0A84FF] text-xs font-semibold tracking-widest uppercase mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF] animate-pulse" />NetSuite ERP + AI Automation
            </motion.span>
            <motion.h1 initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.1 }}
              className="text-5xl md:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight mb-6">
              Stop Managing.<br /><span className="text-[#0A84FF]">Start Scaling.</span>
            </motion.h1>
            <motion.p initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.2 }}
              className="text-lg text-white/55 leading-relaxed mb-8 max-w-md">
              Vertex CP automates your operations with NetSuite ERP and AI — so you can focus on growth, not spreadsheets. Built for Philippine SMEs.
            </motion.p>
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.3 }}
              className="flex flex-wrap gap-3 mb-12">
              <ShimmerButton onClick={openModal} className="px-7 py-3.5 text-base font-bold">Book a Free Discovery Call →</ShimmerButton>
              <a href="#portfolio" className="px-7 py-3.5 text-base font-semibold border border-white/10 rounded-full hover:bg-white/5 hover:border-white/20 transition-all">See Our Work</a>
            </motion.div>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.8, delay:0.5 }}
              className="flex flex-wrap gap-10">
              {[["50+","Businesses Served"],["₱2B+","Revenue Managed"],["4x","Average ROI"]].map(([v,l]) => (
                <div key={l}>
                  <p className="text-3xl font-black">{v}</p>
                  <p className="text-sm text-white/40 font-medium mt-0.5">{l}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div initial={{ opacity:0, x:40 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.8, delay:0.3 }}>
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/50">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                {["bg-red-500","bg-yellow-500","bg-green-500"].map(c => <div key={c} className={`w-2.5 h-2.5 rounded-full ${c} opacity-70`} />)}
                <div className="ml-2 flex-1 bg-white/5 rounded-md px-3 py-1 text-[11px] text-white/30 font-mono">dashboard.vertexcp.ph</div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[["₱2.4M","Revenue","+18%"],["1,284","Orders","+24%"],["98.2%","Uptime","↑ 0.3%"]].map(([v,l,b]) => (
                    <div key={l} className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-3">
                      <p className="text-lg font-black">{v}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">{l}</p>
                      <p className="text-[10px] text-emerald-400 font-semibold mt-1">{b}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold">Revenue This Month</p>
                    <span className="text-xs text-emerald-400 font-semibold">+18.4%</span>
                  </div>
                  <div className="flex items-end gap-1 h-16">
                    {[40,60,45,75,55,85,70,90,65,100,80,110].map((h,i) => (
                      <motion.div key={i} initial={{ scaleY:0 }} animate={{ scaleY:1 }}
                        transition={{ delay:0.6+i*0.05, duration:0.4 }}
                        style={{ height:`${h}%` }}
                        className={`flex-1 rounded-sm origin-bottom ${i===11?"bg-[#0A84FF]":"bg-[#0A84FF]/25"}`} />
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  {[["Inventory Sync","Running","emerald"],["AI Lead Bot","23 leads today","emerald"],["ERP Reconciliation","Done 2m ago","blue"]].map(([n,s,c]) => (
                    <div key={n} className="flex items-center justify-between py-2 px-3 bg-white/[0.02] rounded-lg border border-white/[0.05]">
                      <span className="text-xs text-white/60 font-medium">{n}</span>
                      <span className={`text-[10px] font-semibold text-${c}-400 flex items-center gap-1`}>
                        <span className={`w-1.5 h-1.5 rounded-full bg-${c}-400 animate-pulse`}/>{s}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TRUST BAR */}
      <div className="border-y border-white/[0.06] bg-white/[0.01] py-6 overflow-hidden">
        <p className="text-center text-[10px] text-white/30 font-semibold tracking-widest uppercase mb-4">Trusted by 50+ businesses across the Philippines</p>
        <div className="relative">
          <div className="absolute left-0 inset-y-0 w-24 bg-gradient-to-r from-[#020617] to-transparent z-10" />
          <div className="absolute right-0 inset-y-0 w-24 bg-gradient-to-l from-[#020617] to-transparent z-10" />
          <div className="flex gap-14 items-center" style={{ animation:"marquee 28s linear infinite", width:"max-content" }}>
            {[...CLIENTS,...CLIENTS].map((c,i) => (
              <span key={i} className="text-sm font-bold text-white/20 whitespace-nowrap tracking-widest uppercase">{c}</span>
            ))}
          </div>
        </div>
      </div>

      {/* SERVICES */}
      <section id="services" className="py-28 max-w-7xl mx-auto px-5 md:px-8">
        <FadeUp className="text-center mb-16">
          <Label text="What We Do" />
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">Systems That Actually Work</h2>
          <p className="text-white/50 mt-4 max-w-xl mx-auto text-lg">End-to-end technology built for the way Philippine businesses operate.</p>
        </FadeUp>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICES.map(({ icon:Icon, title, desc }, i) => (
            <FadeUp key={title} delay={i*0.07}>
              <div className="group h-full p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-[#0A84FF]/30 hover:bg-white/[0.05] transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-[#0A84FF]/10 border border-[#0A84FF]/20 flex items-center justify-center mb-5 group-hover:bg-[#0A84FF]/20 transition-colors">
                  <Icon size={18} className="text-[#0A84FF]" />
                </div>
                <h3 className="font-bold text-sm mb-2">{title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{desc}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-28 bg-white/[0.015] border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <FadeUp className="text-center mb-16">
            <Label text="How It Works" />
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">From Zero to Automated</h2>
            <p className="text-white/50 mt-4 max-w-lg mx-auto text-lg">A proven 4-step process to get your business running on autopilot.</p>
          </FadeUp>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            <div className="hidden lg:block absolute top-10 left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] h-px bg-gradient-to-r from-transparent via-[#0A84FF]/25 to-transparent" />
            {STEPS.map(({ num, icon:Icon, title, desc }, i) => (
              <FadeUp key={title} delay={i*0.1}>
                <div className="text-center p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-[#0A84FF]/20 transition-all">
                  <div className="relative inline-flex mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-[#0A84FF]/10 border border-[#0A84FF]/20 flex items-center justify-center">
                      <Icon size={22} className="text-[#0A84FF]" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#0A84FF] text-[10px] font-black flex items-center justify-center">{num.slice(1)}</span>
                  </div>
                  <h3 className="font-bold text-sm mb-2">{title}</h3>
                  <p className="text-xs text-white/45 leading-relaxed">{desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-28 max-w-7xl mx-auto px-5 md:px-8">
        <FadeUp className="text-center mb-16">
          <Label text="Testimonials" />
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">What Our Clients Say</h2>
        </FadeUp>
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map(({ quote, name, role, company, av }, i) => (
            <FadeUp key={name} delay={i*0.1}>
              <div className={`h-full p-7 rounded-2xl border flex flex-col gap-5 ${i===1?"border-[#0A84FF]/40 bg-[#0A84FF]/[0.06]":"border-white/[0.07] bg-white/[0.03]"}`}>
                <div className="flex gap-0.5">
                  {Array(5).fill(0).map((_,j) => <Star key={j} size={13} className="fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm text-white/65 leading-relaxed flex-1">"{quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#0A84FF]/20 border border-[#0A84FF]/30 flex items-center justify-center text-[10px] font-black text-[#0A84FF]">{av}</div>
                  <div>
                    <p className="text-sm font-bold">{name}</p>
                    <p className="text-xs text-white/35">{role} · {company}</p>
                  </div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="py-24 bg-gradient-to-br from-[#0A84FF]/[0.08] to-[#020617] border-y border-[#0A84FF]/10">
        <div className="max-w-7xl mx-auto px-5 md:px-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STATS.map(({ icon:Icon, value, label }, i) => (
            <FadeUp key={label} delay={i*0.08}>
              <div className="text-center p-8 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                <div className="w-12 h-12 rounded-2xl bg-[#0A84FF]/15 border border-[#0A84FF]/25 flex items-center justify-center mx-auto mb-4">
                  <Icon size={22} className="text-[#0A84FF]" />
                </div>
                <p className="text-5xl font-black mb-1">{value}</p>
                <p className="text-sm text-white/45 font-medium">{label}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-28 max-w-7xl mx-auto px-5 md:px-8">
        <FadeUp className="text-center mb-16">
          <Label text="Pricing" />
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">Simple, Transparent Pricing</h2>
          <p className="text-white/50 mt-4 max-w-lg mx-auto text-lg">No hidden fees. Cancel anytime. ROI guaranteed or we work for free.</p>
        </FadeUp>
        <div className="grid md:grid-cols-3 gap-5 items-start">
          {PLANS.map(({ name, price, badge, best, features, bonus, cta }, i) => (
            <FadeUp key={name} delay={i*0.1}>
              <div className={`relative p-7 rounded-2xl border flex flex-col gap-6 ${best?"border-[#0A84FF]/50 bg-gradient-to-b from-[#0A84FF]/[0.08] to-transparent":"border-white/[0.07] bg-white/[0.03]"}`}>
                {best && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#0A84FF] rounded-full text-[10px] font-black tracking-widest">BEST VALUE</div>}
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-black">{name}</h3>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">{badge}</span>
                  </div>
                  <p className="text-4xl font-black">{price}<span className="text-base font-medium text-white/35">/mo</span></p>
                </div>
                <ul className="space-y-2.5">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-white/65">
                      <Check size={13} className="text-[#0A84FF] mt-0.5 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <div className="p-3 rounded-xl bg-emerald-400/[0.05] border border-emerald-400/15 text-xs text-emerald-400 font-semibold">🎁 {bonus}</div>
                {best
                  ? <ShimmerButton onClick={openModal} className="w-full py-3.5 font-bold text-sm">{cta}</ShimmerButton>
                  : <button onClick={openModal} className="w-full py-3.5 rounded-full border border-white/10 hover:bg-white/5 text-sm font-semibold transition-all">{cta}</button>
                }
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-28 bg-white/[0.015] border-y border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-5 md:px-8">
          <FadeUp className="text-center mb-16">
            <Label text="FAQ" />
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">Common Questions</h2>
          </FadeUp>
          <div className="space-y-3">
            {FAQS.map(({ q, a }, i) => (
              <FadeUp key={i} delay={i*0.05}>
                <div className="border border-white/[0.07] rounded-2xl overflow-hidden bg-white/[0.02]">
                  <button onClick={() => setActiveFaq(activeFaq===i?null:i)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-white/[0.02] transition-colors gap-4">
                    <span className="font-semibold text-sm">{q}</span>
                    <motion.div animate={{ rotate:activeFaq===i?180:0 }} transition={{ duration:0.2 }}>
                      <ChevronDown size={16} className="text-white/35 flex-shrink-0" />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {activeFaq===i && (
                      <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }}
                        transition={{ duration:0.25 }} className="overflow-hidden">
                        <p className="px-6 pb-5 text-sm text-white/50 leading-relaxed">{a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* PORTFOLIO */}
      <section id="portfolio" className="py-28">
        <div className="max-w-7xl mx-auto px-5 md:px-8 mb-12">
          <FadeUp className="text-center">
            <Label text="Portfolio" />
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">What We've Built</h2>
            <p className="text-white/50 mt-4 max-w-lg mx-auto text-lg">Real systems running real businesses across the Philippines.</p>
          </FadeUp>
        </div>
        <div className="relative overflow-hidden">
          <div className="absolute left-0 inset-y-0 w-24 bg-gradient-to-r from-[#020617] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 inset-y-0 w-24 bg-gradient-to-l from-[#020617] to-transparent z-10 pointer-events-none" />
          <div className="flex gap-5"
            style={{ animation:"marquee 40s linear infinite", width:"max-content" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.animationPlayState="paused"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.animationPlayState="running"}>
            {[...PORTFOLIO,...PORTFOLIO].map(({ title, cat, desc, color }, i) => (
              <div key={i} className="w-72 flex-shrink-0 rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden hover:border-[#0A84FF]/30 transition-all duration-300">
                <div className={`h-40 bg-gradient-to-br ${color} relative`}>
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute bottom-3 left-3">
                    <span className="text-[10px] font-semibold bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">{cat}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-sm mb-1">{title}</h3>
                  <p className="text-xs text-white/45 leading-relaxed mb-3">{desc}</p>
                  <span className="text-xs text-[#0A84FF] font-semibold flex items-center gap-1">View Project <ArrowRight size={11}/></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 max-w-7xl mx-auto px-5 md:px-8">
        <FadeUp>
          <div className="relative rounded-3xl border border-[#0A84FF]/20 bg-gradient-to-br from-[#0A84FF]/[0.08] via-white/[0.02] to-transparent p-10 md:p-14 overflow-hidden grid md:grid-cols-2 gap-10 items-center">
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-[#0A84FF]/10 rounded-full blur-[80px] pointer-events-none" />
            <div>
              <Label text="Ready to Scale?" />
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4 mt-2">Let's Build Your System Together</h2>
              <p className="text-white/50 leading-relaxed mb-7 text-sm">Book a free 30-minute discovery call. We'll audit your current processes and show you exactly what automation can do for your bottom line.</p>
              <ShimmerButton onClick={openModal} className="px-8 py-4 text-base font-bold">Book Your Free Call →</ShimmerButton>
              <div className="flex items-center gap-2 mt-5">
                {["DL","MS","CR"].map(av => (
                  <div key={av} className="w-8 h-8 rounded-full bg-[#0A84FF]/20 border-2 border-[#020617] -ml-2 first:ml-0 flex items-center justify-center text-[9px] font-black text-[#0A84FF]">{av}</div>
                ))}
                <p className="text-xs text-white/35 ml-2">50+ happy clients and counting</p>
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <div className="w-52 h-64 rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                <img src="/myphoto.png" alt="Founder" className="w-full h-full object-cover object-top" />
              </div>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.06] py-16 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#0A84FF] flex items-center justify-center font-black text-sm">V</div>
                <div>
                  <p className="text-sm font-bold">Vertex Consulting Partner</p>
                  <p className="text-[10px] text-white/35">ERP + AI Automation</p>
                </div>
              </div>
              <p className="text-sm text-white/35 leading-relaxed max-w-xs mb-5">Systems that scale. Operations that run themselves. Built for Philippine SMEs.</p>
              <div className="flex gap-2">
                {[Globe, MessageCircle, Mail].map((Icon,i) => (
                  <a key={i} href="#" className="w-8 h-8 rounded-lg bg-white/5 border border-white/[0.07] flex items-center justify-center hover:bg-white/10 transition-colors">
                    <Icon size={13} className="text-white/40" />
                  </a>
                ))}
              </div>
            </div>
            {([
              ["Company",["About Us","Our Team","Careers","Blog"]],
              ["Services",["NetSuite ERP","AI Automation","POS Systems","CRM Setup"]],
              ["Contact",["+63 927 297 8534","hello@vertexcp.ph","Manila, Philippines"]],
            ] as [string, string[]][]).map(([heading, links]) => (
              <div key={heading}>
                <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-4">{heading}</p>
                <ul className="space-y-2.5">
                  {links.map(l => <li key={l}><a href="#" className="text-sm text-white/40 hover:text-white transition-colors">{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-6 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-white/20">© 2026 Vertex Consulting Partner. All rights reserved.</p>
            <div className="flex gap-5">
              {["Privacy Policy","Terms of Service"].map(l => <a key={l} href="#" className="text-xs text-white/20 hover:text-white/50 transition-colors">{l}</a>)}
            </div>
          </div>
        </div>
      </footer>

      {/* LEAD MODAL */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={e => { if (e.target===e.currentTarget) setModalOpen(false) }}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95, y:20 }}
              transition={{ duration:0.25 }}
              className="w-full max-w-md bg-[#0b1120] border border-white/[0.09] rounded-3xl p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setModalOpen(false)} className="absolute top-5 right-5 text-white/30 hover:text-white transition-colors"><X size={18}/></button>
              {submitted ? (
                <div className="text-center py-8">
                  <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:"spring", stiffness:300 }}
                    className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-5">
                    <Check size={28} className="text-emerald-400" />
                  </motion.div>
                  <h3 className="text-xl font-black mb-2">You're all set!</h3>
                  <p className="text-white/50 text-sm">We'll reach out within 24 hours to confirm your discovery call.</p>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-black mb-1">Book a Free Discovery Call</h3>
                  <p className="text-sm text-white/45 mb-6">30 minutes. No pitch. Just clarity on what automation can do for your business.</p>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    {([
                      ["Full Name","name","text","Juan dela Cruz"],
                      ["Mobile Number","phone","tel","+63 9XX XXX XXXX"],
                      ["Email Address","email","email","juan@company.ph"],
                      ["Business Name","business","text","Your Company Inc."],
                    ] as [string,keyof FormData,string,string][]).map(([label,key,type,ph]) => (
                      <div key={key}>
                        <label className="text-xs font-semibold text-white/45 mb-1.5 block">{label}</label>
                        <input type={type} placeholder={ph} required value={form[key]}
                          onChange={e => setForm(p => ({ ...p, [key]:e.target.value }))}
                          className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#0A84FF]/50 transition-colors" />
                      </div>
                    ))}
                    <div>
                      <label className="text-xs font-semibold text-white/45 mb-1.5 block">Preferred Plan</label>
                      <select value={form.plan} onChange={e => setForm(p => ({ ...p, plan:e.target.value }))}
                        className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#0A84FF]/50 transition-colors">
                        {["Starter","Growth","Enterprise"].map(p => <option key={p} value={p} className="bg-[#0b1120]">{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-white/45 mb-1.5 block">Preferred Date</label>
                      <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date:e.target.value }))}
                        className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#0A84FF]/50 transition-colors" />
                    </div>
                    <ShimmerButton type="submit" disabled={submitting} className="w-full py-3.5 font-bold text-sm mt-1">
                      {submitting?"Submitting...":"Confirm My Free Call →"}
                    </ShimmerButton>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STICKY CTA */}
      <AnimatePresence>
        {stickyVisible && !dismissed && (
          <motion.div initial={{ y:100, opacity:0 }} animate={{ y:0, opacity:1 }} exit={{ y:100, opacity:0 }}
            transition={{ duration:0.3 }}
            className="fixed bottom-0 inset-x-0 z-40 bg-[#020617]/95 backdrop-blur-xl border-t border-white/[0.08] px-5 py-4 flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-white/70 hidden sm:block">Ready to automate your business?</p>
            <div className="flex items-center gap-3 ml-auto">
              <ShimmerButton onClick={openModal} className="px-5 py-2.5 text-sm font-bold">Book a Free Call</ShimmerButton>
              <button onClick={() => { setDismissed(true); setStickyVisible(false) }} className="text-white/30 hover:text-white transition-colors"><X size={16}/></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WHATSAPP */}
      <motion.a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
        initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:1, type:"spring" }}
        whileHover={{ scale:1.1 }} whileTap={{ scale:0.95 }}
        style={{ bottom: stickyVisible && !dismissed ? 76 : 24, transition:"bottom 0.3s" }}
        className="fixed right-6 z-40 w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg shadow-[#25D366]/25">
        <MessageCircle size={24} className="text-white" fill="white" />
      </motion.a>
    </div>
  )
}
