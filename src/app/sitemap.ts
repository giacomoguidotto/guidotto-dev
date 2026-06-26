import type { MetadataRoute } from "next";
import { content } from "~/content";

const { site } = content;

// One public, indexable surface in v1: the apex home page. Subdomains own their
// own per-project SEO, so they are not listed here.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: site.url,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
