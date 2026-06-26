import type { MetadataRoute } from "next";
import { content } from "~/content";

const { site } = content;

// robots.txt: let crawlers index the public home page, keep the internal slice
// previews and the contact API out of the index, and point at the sitemap so
// discovery is explicit rather than inferred.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/preview/", "/api/"],
    },
    sitemap: new URL("/sitemap.xml", site.url).toString(),
    host: site.url,
  };
}
