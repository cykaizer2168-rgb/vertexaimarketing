import { Head } from "vite-react-ssg";
import { Mail, Linkedin, MapPin } from "lucide-react";

const SITE = "https://buildwithfranco.com";

export default function Contact() {
  return (
    <>
      <Head>
        <title>Contact — Angelo B. Franco</title>
        <meta name="description" content="Get in touch with Angelo B. Franco — NetSuite ERP consultant and AI automation architect." />
        <link rel="canonical" href={`${SITE}/contact`} />
      </Head>

      <section className="max-w-2xl mx-auto px-6 lg:px-8 pt-32 pb-24">
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-cyan">Get in touch</span>
        <h1 className="font-display font-bold text-4xl mt-3">Contact</h1>
        <p className="text-mist mt-4 leading-relaxed">
          Have a NetSuite, AI automation, or systems project in mind — or just want to talk shop?
          The fastest way to reach me is by email or LinkedIn.
        </p>

        <div className="mt-8 space-y-3">
          <a href="mailto:angelo.franco@buildwithfranco.com" className="flex items-center gap-3 bg-panel border border-line rounded-xl px-5 py-4 hover:border-cyan/45 transition-colors">
            <Mail className="text-cyan" size={20} />
            <div>
              <div className="text-sm font-medium">Email</div>
              <div className="text-sm text-mist">angelo.franco@buildwithfranco.com</div>
            </div>
          </a>
          <a href="https://linkedin.com/in/kaizer2168" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-panel border border-line rounded-xl px-5 py-4 hover:border-cyan/45 transition-colors">
            <Linkedin className="text-cyan" size={20} />
            <div>
              <div className="text-sm font-medium">LinkedIn</div>
              <div className="text-sm text-mist">linkedin.com/in/kaizer2168</div>
            </div>
          </a>
          <div className="flex items-center gap-3 bg-panel border border-line rounded-xl px-5 py-4">
            <MapPin className="text-cyan" size={20} />
            <div>
              <div className="text-sm font-medium">Location</div>
              <div className="text-sm text-mist">Bulacan, Philippines</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
