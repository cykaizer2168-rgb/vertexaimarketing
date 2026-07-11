'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Products', href: '#products' },
  { label: 'App', href: '#app' },
  { label: 'FAQ', href: '#faq' },
  { label: 'CRM', href: '/crm', highlight: true },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-sm'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center cursor-pointer">
          <div className="bg-white rounded-xl px-2 py-1 shadow-sm">
            <img
              src="/images/logo.png"
              alt="Vertex AI Marketing"
              className="h-8 w-auto object-contain"
            />
          </div>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={cn(
                'text-sm font-medium transition-colors duration-200 cursor-pointer',
                'highlight' in l && l.highlight
                  ? 'text-green-500 hover:text-green-400 font-semibold'
                  : scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white/80 hover:text-white'
              )}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <a
          href="#cta"
          className="hidden md:inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-green-400 text-black text-sm font-semibold hover:opacity-90 hover:scale-105 transition-all duration-200 cursor-pointer"
        >
          Get Free Quote
        </a>

        <button
          onClick={() => setOpen(!open)}
          className={cn('md:hidden p-2 cursor-pointer', scrolled ? 'text-gray-700' : 'text-white')}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 pb-4 shadow-md">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={cn(
                'block py-3 text-sm border-b border-gray-100 last:border-0 cursor-pointer',
                'highlight' in l && l.highlight
                  ? 'text-green-600 font-semibold hover:text-green-700'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {l.label}
            </a>
          ))}
          <a
            href="#cta"
            onClick={() => setOpen(false)}
            className="mt-4 block text-center px-5 py-2.5 rounded-full bg-gradient-to-r from-yellow-400 to-green-400 text-black text-sm font-semibold cursor-pointer"
          >
            Get Free Quote
          </a>
        </div>
      )}
    </header>
  );
}
