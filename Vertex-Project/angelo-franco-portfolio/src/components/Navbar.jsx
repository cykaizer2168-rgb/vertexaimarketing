import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, X, CalendarCheck } from "lucide-react";

const LINKS = ["Home", "About", "Expertise", "Projects", "Blog", "Experience", "Contact"];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-ink/90 backdrop-blur-md border-b border-line" : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center" aria-label="buildwithfranco — home">
          <img src="/logo-mark.png" alt="buildwithfranco" className="h-8 w-auto" />
        </a>

        <ul className="hidden lg:flex items-center gap-8 text-sm text-mist">
          {LINKS.map((l, i) => (
            <li key={l}>
              <a
                href={l === "Home" ? "/" : l === "Blog" ? "/blog" : `/#${l.toLowerCase()}`}
                className={`relative pb-1 hover:text-white transition-colors ${
                  i === 0 ? "text-white" : ""
                }`}
              >
                {l}
                {i === 0 && (
                  <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-cyan rounded-full" />
                )}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="/#contact"
          className="hidden lg:inline-flex items-center gap-2 bg-cyan hover:bg-cyan/90 text-ink font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          <CalendarCheck size={16} /> Get in Touch
        </a>

        <button onClick={() => setOpen(!open)} className="lg:hidden text-white">
          {open ? <X /> : <Menu />}
        </button>
      </nav>

      {open && (
        <div className="lg:hidden bg-panel border-t border-line px-6 py-4 flex flex-col gap-4">
          {LINKS.map((l) => (
            <a key={l} href={l === "Home" ? "/" : l === "Blog" ? "/blog" : `/#${l.toLowerCase()}`} className="text-mist text-sm" onClick={() => setOpen(false)}>
              {l}
            </a>
          ))}
          <a href="/#contact" className="bg-cyan text-ink text-center font-semibold text-sm px-4 py-2.5 rounded-lg">
            Get in Touch
          </a>
        </div>
      )}
    </motion.header>
  );
}
