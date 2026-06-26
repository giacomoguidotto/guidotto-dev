import { ogAlt, ogContentType, ogSize, renderOgCard } from "~/lib/og-card";

// Reuses the shared OpenGraph card so the `summary_large_image` Twitter card is
// never blank and never drifts from the OpenGraph one.
export const alt = ogAlt;
export const size = ogSize;
export const contentType = ogContentType;

export default function TwitterImage() {
  return renderOgCard();
}
