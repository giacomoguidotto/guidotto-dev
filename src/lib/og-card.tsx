import { ImageResponse } from "next/og";
import { content } from "~/content";

// The shared social share card, rendered by both the OpenGraph and Twitter image
// routes. The cards declare `summary_large_image`, so they need a real 1200x630
// image or the preview renders blank. Built from the locked content surface (no
// invented copy, no new brand mark) so the card can never drift from the page.

export const ogAlt = `${content.site.name}, ${content.site.jobTitle}`;
export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

// Hex restatements of the locked oklch stage tokens (globals.css). Satori cannot
// parse oklch, so the brand field is approximated here in sRGB.
const STAGE_DEEP = "#06070c";
const STAGE = "#0b0d15";
const IVORY = "#f1ebdd";
const ACCENT = "#9b99f0"; // showpiece periwinkle — the one earned accent

export function renderOgCard(): ImageResponse {
  const { site, hero } = content;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "80px",
        backgroundColor: STAGE_DEEP,
        backgroundImage: `radial-gradient(120% 120% at 100% 0%, ${STAGE} 0%, ${STAGE_DEEP} 60%)`,
        color: IVORY,
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: "26px",
          letterSpacing: "0.32em",
          color: ACCENT,
        }}
      >
        {hero.eyebrow}
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            fontSize: "104px",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.04,
          }}
        >
          {site.name}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "20px",
            fontSize: "40px",
            color: `${IVORY}cc`,
          }}
        >
          {site.jobTitle}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: "30px",
            color: `${IVORY}b3`,
            maxWidth: "780px",
            lineHeight: 1.3,
          }}
        >
          {hero.subline}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: "26px",
            letterSpacing: "0.06em",
            color: `${IVORY}99`,
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: ACCENT,
            }}
          />
          {new URL(site.url).host}
        </div>
      </div>
    </div>,
    ogSize
  );
}
