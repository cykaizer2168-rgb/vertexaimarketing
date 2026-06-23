import { CtaProvider } from "@/components/landing/cta-modal";
import { TemplateNavbar } from "@/components/landing/template/navbar";
import { TemplateHero } from "@/components/landing/template/hero";
import { TemplateStatsStrip } from "@/components/landing/template/stats-strip";
import { TemplateSolution } from "@/components/landing/template/solution";
import { TemplateServices } from "@/components/landing/template/services";
import { TemplateHowItWorks } from "@/components/landing/template/how-it-works";
import { TemplateAudience } from "@/components/landing/template/audience";
import { TemplatePricing } from "@/components/landing/template/pricing";
import { TemplateProof } from "@/components/landing/template/proof";
import { TemplateFaq } from "@/components/landing/template/faq";
import { TemplateFinalCta } from "@/components/landing/template/final-cta";
import { TemplateFooter } from "@/components/landing/template/footer";
import { TemplateStickyCta } from "@/components/landing/template/sticky-cta";

export default function LandingPage() {
  return (
    <CtaProvider>
      <main className="bg-white">
        <TemplateNavbar />
        <TemplateHero />
        <TemplateStatsStrip />
        <TemplateSolution />
        <TemplateServices />
        <TemplateHowItWorks />
        <TemplateAudience />
        <TemplatePricing />
        <TemplateProof />
        <TemplateFaq />
        <TemplateFinalCta />
        <TemplateFooter />
        <TemplateStickyCta />
      </main>
    </CtaProvider>
  );
}
