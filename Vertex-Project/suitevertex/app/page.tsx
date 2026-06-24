import { MotionConfig } from "framer-motion";
import { CtaProvider } from "@/components/landing/cta-modal";
import { TemplateNavbar } from "@/components/landing/template/navbar";
import { TemplateHero } from "@/components/landing/template/hero";
import { TemplateWhyDifferent } from "@/components/landing/template/why-different";
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
      <MotionConfig reducedMotion="user">
      <main className="bg-white">
        <TemplateNavbar />
        <TemplateHero />
        <TemplateWhyDifferent />
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
      </MotionConfig>
    </CtaProvider>
  );
}
