import { Head } from "vite-react-ssg";

const SITE = "https://angelo-franco-portfolio.vercel.app";

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy — Angelo B. Franco</title>
        <meta name="description" content="Privacy policy for angelofranco.dev, including cookies and third-party advertising (Google AdSense)." />
        <link rel="canonical" href={`${SITE}/privacy`} />
        <meta name="robots" content="index,follow" />
      </Head>

      <article className="article-body max-w-3xl mx-auto px-6 lg:px-8 pt-32 pb-24">
        <h1>Privacy Policy</h1>
        <p className="text-mist">Last updated: July 2, 2026</p>

        <p>This Privacy Policy describes how this website (the “Site”), operated by Angelo B. Franco, collects, uses, and protects information when you visit.</p>

        <h2>Information we collect</h2>
        <p>The Site does not require you to create an account. We may collect non-identifying analytics data (such as pages visited, browser type, and approximate location) to understand how the Site is used. If you contact us by email, we receive the information you choose to send.</p>

        <h2>Cookies</h2>
        <p>The Site uses cookies and similar technologies to operate and to measure traffic. You can disable cookies in your browser settings; some features may not work as intended.</p>

        <h2>Third-party advertising (Google AdSense)</h2>
        <p>This Site may display ads served by Google, a third-party vendor. Google uses cookies (including the DoubleClick DART cookie) to serve ads based on your prior visits to this and other websites. Google’s use of advertising cookies enables it and its partners to serve ads to you based on your visit to this Site and/or other sites on the Internet.</p>
        <ul>
          <li>You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.</li>
          <li>You can also opt out of third-party vendors’ use of cookies for personalized advertising at <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">aboutads.info/choices</a>.</li>
        </ul>

        <h2>Third-party services</h2>
        <p>The Site may link to third-party sites (e.g. LinkedIn). We are not responsible for the privacy practices of those sites.</p>

        <h2>Your rights</h2>
        <p>You may request access to, correction of, or deletion of any personal information you have shared with us by emailing the address below.</p>

        <h2>Contact</h2>
        <p>Questions about this policy? Email <a href="mailto:angelo.franco2168@gmail.com">angelo.franco2168@gmail.com</a>.</p>
      </article>
    </>
  );
}
