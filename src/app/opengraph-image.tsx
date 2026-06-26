import { ogAlt, ogContentType, ogSize, renderOgCard } from "~/lib/og-card";

export const alt = ogAlt;
export const size = ogSize;
export const contentType = ogContentType;

export default function OpengraphImage() {
  return renderOgCard();
}
