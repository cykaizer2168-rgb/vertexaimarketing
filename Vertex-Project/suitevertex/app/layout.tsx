import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "SuiteVertex — NetSuite work, on a monthly plan", template: "%s | SuiteVertex" },
  description: "Managed NetSuite development and implementation for US mid-market teams. Flat monthly plans, senior engineers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org", "@type": "Organization",
            name: "SuiteVertex", url: "https://suitevertex.com",
            description: "Managed NetSuite development and implementation for US mid-market teams.",
          }) }}
        />
        {children}
      </body>
    </html>
  );
}
