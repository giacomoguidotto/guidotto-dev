import type { Metadata, Viewport } from "next";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import { content } from "~/content";
import "./globals.css";

// Warm, optical, characterful serif — the display thesis voice (analog warmth in
// its forms, regardless of color). Loaded globally.
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  axes: ["SOFT", "WONK", "opsz"],
});

// The engineering register — small labels, eyebrows, CTA.
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

const { site } = content;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  applicationName: site.name,
  title: site.title,
  description: site.description,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  category: "technology",
  alternates: { canonical: "/" },
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: site.title,
    description: site.description,
    url: site.url,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
  // The deep stage field (globals.css `--stage-deep`, restated in sRGB) so the
  // browser chrome matches the page on mobile and in PWA shells.
  themeColor: "#06070c",
};

const personJsonLd = {
  "@type": "Person",
  "@id": `${site.url}/#person`,
  name: site.name,
  jobTitle: site.jobTitle,
  url: site.url,
  description: site.description,
  image: new URL("/portrait/giacomo.jpg", site.url).toString(),
  sameAs: site.sameAs,
};

const websiteJsonLd = {
  "@type": "WebSite",
  "@id": `${site.url}/#website`,
  url: site.url,
  name: site.title,
  description: site.description,
  inLanguage: site.locale,
  author: { "@id": `${site.url}/#person` },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [personJsonLd, websiteJsonLd],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={site.locale}>
      <body className={`${fraunces.variable} ${jetbrainsMono.variable}`}>
        {children}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </body>
    </html>
  );
}
