import { Head } from "vite-react-ssg";
import { useLoaderData } from "react-router-dom";
import Hero from "../components/Hero";
import TechMarquee from "../components/TechMarquee";
import About from "../components/About";
import Services from "../components/Services";
import Journey from "../components/Journey";
import SelectedWork from "../components/SelectedWork";
import TechSkills from "../components/TechSkills";
import { ProofStrip, CTA } from "../components/Bottom";

export default function Home() {
  const { caseStudies } = useLoaderData();
  return (
    <>
      <Head>
        <title>Angelo B. Franco — Senior NetSuite ERP Consultant & AI Automation Architect</title>
        <meta name="description" content="Senior NetSuite ERP Consultant & AI Automation Architect with 7+ years (Oracle ACS). I help companies build smarter ERP systems with end-to-end NetSuite implementations, eCommerce integrations, and AI automation." />
        <meta name="author" content="Angelo B. Franco" />
        <meta name="keywords" content="NetSuite Consultant, ERP, SuiteScript, Oracle ACS, AI Automation, n8n, eCommerce Integration, Shopify, WooCommerce" />
        <link rel="canonical" href="https://buildwithfranco.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Angelo B. Franco" />
        <meta property="og:title" content="Angelo B. Franco — Senior NetSuite ERP Consultant & AI Automation Architect" />
        <meta property="og:description" content="7+ years (Oracle ACS) delivering end-to-end NetSuite ERP solutions, eCommerce integrations, and AI automation that drive efficiency, scalability, and business growth." />
        <meta property="og:url" content="https://buildwithfranco.com/" />
        <meta property="og:image" content="https://buildwithfranco.com/og-image.png" />
        <meta property="og:image:secure_url" content="https://buildwithfranco.com/og-image.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Angelo B. Franco — Senior NetSuite ERP Consultant & AI Automation Architect" />
        <meta property="og:locale" content="en_US" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Angelo B. Franco — Senior NetSuite ERP Consultant & AI Automation Architect" />
        <meta name="twitter:description" content="7+ years (Oracle ACS) delivering end-to-end NetSuite ERP solutions, eCommerce integrations, and AI automation." />
        <meta name="twitter:image" content="https://buildwithfranco.com/og-image.png" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: "Angelo B. Franco",
            jobTitle: "Senior NetSuite ERP Consultant & AI Automation Architect",
            url: "https://buildwithfranco.com/",
            image: "https://buildwithfranco.com/og-image.png",
            knowsAbout: ["NetSuite ERP", "SuiteScript 2.1", "Oracle ACS", "AI Automation", "n8n", "eCommerce Integration", "Shopify", "WooCommerce", "REST API"],
          })}
        </script>
      </Head>
      <Hero />
      <TechMarquee />
      <About />
      <Services />
      <Journey />
      <SelectedWork caseStudies={caseStudies} />
      <TechSkills />
      <ProofStrip />
      <CTA />
    </>
  );
}
