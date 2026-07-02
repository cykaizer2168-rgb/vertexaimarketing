import { Outlet } from "react-router-dom";
import { Head } from "vite-react-ssg";
import Navbar from "./Navbar";
import { Footer } from "./Bottom";

const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT;

export default function Layout() {
  return (
    <div className="relative min-h-screen bg-ink text-white">
      {/* Google AdSense loader — only injected once the publisher id is configured */}
      {ADSENSE_CLIENT && (
        <Head>
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
          />
        </Head>
      )}
      {/* Global fixed background image (subtle ambient backdrop) */}
      <div
        aria-hidden
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/bg-dark.jpg')" }}
      />
      <div aria-hidden className="fixed inset-0 z-0 bg-ink/80" />

      <div className="relative z-10">
        <Navbar />
        <Outlet />
        <Footer />
      </div>
    </div>
  );
}
