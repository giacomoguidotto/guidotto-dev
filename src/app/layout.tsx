import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { content } from "~/content";
import { fraunces, jetbrainsMono } from "./fonts";
import "./globals.css";

const { site } = content;
const logoUrl = new URL("/logo.svg", site.url).toString();
const portraitUrl = new URL("/portrait/giacomo.jpg", site.url).toString();
const personId = `${site.url}/#person`;
const webPageId = `${site.url}/#webpage`;
// Structured name parts (single name, no middle name) for entity matching.
const [givenName, ...familyNameParts] = site.name.split(" ");
const familyName = familyNameParts.join(" ");

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  applicationName: site.name,
  title: site.title,
  description: site.description,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  category: "technology",
  // Meta keywords are largely ignored by Google (minor weight elsewhere), but
  // they are honest descriptors composed from on-page facts. Deduplicated.
  keywords: Array.from(
    new Set([
      site.name,
      site.jobTitle,
      content.showpiece.label,
      "PINNs",
      "physics-informed neural networks",
      ...content.projects.map((project) => project.label),
      ...site.knowsAbout,
      "portfolio",
    ])
  ),
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
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
  "@id": personId,
  name: site.name,
  givenName,
  familyName,
  // The site narrates in first person as "Jack" (human.signature).
  alternateName: content.human.signature,
  jobTitle: site.jobTitle,
  hasOccupation: {
    "@type": "Occupation",
    name: site.jobTitle,
    // O*NET-SOC 15-1252.00 (Software Developers): pins the role to a standard
    // taxonomy so "Software Engineer" is unambiguous.
    occupationalCategory: "15-1252.00",
  },
  url: site.url,
  mainEntityOfPage: { "@id": webPageId },
  description: site.description,
  // ORCID as a typed identifier (in addition to its sameAs URL), the canonical
  // disambiguator for the research identity behind AnyPINN.
  identifier: {
    "@type": "PropertyValue",
    propertyID: "ORCID",
    value: site.orcid,
    url: `https://orcid.org/${site.orcid}`,
  },
  image: [portraitUrl, logoUrl],
  logo: logoUrl,
  worksFor: {
    "@type": "Organization",
    name: site.employer.name,
    url: site.employer.url,
  },
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: site.education.name,
    url: site.education.url,
  },
  nationality: {
    "@type": "Country",
    name: site.nationality,
  },
  knowsLanguage: site.languages.map((language) => ({
    "@type": "Language",
    name: language.name,
    alternateName: language.code,
  })),
  knowsAbout: site.knowsAbout,
  sameAs: site.sameAs,
};

// Declares the homepage as a profile page about the person (Google's
// ProfilePage pattern), so the page resolves to one unambiguous entity.
const profilePageJsonLd = {
  "@type": "ProfilePage",
  "@id": webPageId,
  url: site.url,
  name: site.title,
  isPartOf: { "@id": `${site.url}/#website` },
  about: { "@id": personId },
  mainEntity: { "@id": personId },
  inLanguage: site.locale,
};

const websiteJsonLd = {
  "@type": "WebSite",
  "@id": `${site.url}/#website`,
  url: site.url,
  name: site.title,
  description: site.description,
  inLanguage: site.locale,
  image: logoUrl,
  logo: logoUrl,
  author: { "@id": personId },
};

// One node per shipped project so each is an indexable entity in its own right,
// linked back to the person as author. Built from the same content surface the
// page renders, so nothing here is invented.
const projectJsonLd = content.projects.map((project) => ({
  "@type": "SoftwareSourceCode",
  "@id": `${site.url}/#project-${project.key}`,
  name: project.label,
  abstract: project.atRestLine,
  description: project.onFocus,
  codeRepository: project.repoUrl,
  // The on-page `domain · stack` tag, split into discrete discovery terms.
  keywords: project.tag.split("·").map((term) => term.trim()),
  author: { "@id": personId },
}));

// AnyPINN is the showpiece: same entity shape, plus the keywords that make it
// discoverable by domain ("PINNs", "physics-informed neural networks").
const showpieceJsonLd = {
  "@type": "SoftwareSourceCode",
  "@id": `${site.url}/#project-${content.showpiece.key}`,
  name: content.showpiece.label,
  abstract: content.showpiece.caption,
  description: content.showpiece.footer,
  codeRepository: content.showpiece.repoUrl,
  isAccessibleForFree: true,
  keywords: [
    "physics-informed neural networks",
    "PINNs",
    "machine learning",
    "scientific machine learning",
  ],
  author: { "@id": personId },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    profilePageJsonLd,
    personJsonLd,
    websiteJsonLd,
    ...projectJsonLd,
    showpieceJsonLd,
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={site.locale}>
      <body className={`${fraunces.variable} ${jetbrainsMono.variable}`}>
        {children}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
