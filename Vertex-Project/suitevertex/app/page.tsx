import { MotionConfig } from "framer-motion";
import { CtaProvider } from "@/components/landing/cta-modal";
import { TemplateNavbar } from "@/components/landing/template/navbar";
import { TemplateHero } from "@/components/landing/template/hero";
import { TemplateWhyDifferent } from "@/components/landing/template/why-different";
import { TemplateServices } from "@/components/landing/template/services";
import { TemplateCopilot } from "@/components/landing/template/copilot";
import { TemplateSecurity } from "@/components/landing/template/security";
import { TemplateHowItWorks } from "@/components/landing/template/how-it-works";
import { TemplateSuccessCenter } from "@/components/landing/template/success-center";
import { TemplateAudience } from "@/components/landing/template/audience";
import { TemplatePricing } from "@/components/landing/template/pricing";
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
        <TemplateCopilot />
        <TemplateSecurity />
        <TemplateHowItWorks />
        <TemplateSuccessCenter />
        <TemplateAudience />
        <TemplatePricing />
        <TemplateFaq />
        <TemplateFinalCta />
        <TemplateFooter />
        <TemplateStickyCta />
      </main>
      </MotionConfig>
    </CtaProvider>
  );
}
