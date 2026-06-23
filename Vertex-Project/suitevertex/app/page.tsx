import { CtaProvider } from "@/components/landing/cta-modal";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { Hero } from "@/components/landing/hero";

export default function LandingPage() {
  return (
    <CtaProvider>
      <div className="min-h-screen bg-ink-950">
        <SiteHeader />
        <main>
          <Hero />
        </main>
        <SiteFooter />
      </div>
    </CtaProvider>
  );
}
