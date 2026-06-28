// ProjectMedia — the per-project media primitive inside a vessel.
//
// Today it renders the project's own logo (a real, recognizable mark rather than
// stand-in art) inside the glass. It is the single swap point for when the real
// per-project screen recordings land: replace the logo with an optimized looping
// `<video>` + poster here and every vessel upgrades. The logo sits on the
// vessel's accent-tinted backdrop and is fitted (never cropped), so square app
// icons and the wide thesis vessel both read cleanly.

import Image from "next/image";
import type { Motif } from "~/content";

interface Logo {
  /** Public path to the web-ready logo (resized in public/work/<slug>/). */
  readonly src: string;
}

// Each motif key maps 1:1 to a project, so it doubles as the logo selector. The
// art-style names are kept as opaque discriminators to avoid churning the
// canonical content surface.
const LOGOS: Record<Motif, Logo> = {
  neural: { src: "/work/anypinn/logo.png" },
  topology: { src: "/work/orray/logo.png" },
  mobile: { src: "/work/tempo/logo.png" },
  macwindow: { src: "/work/scry/logo.png" },
  gallery: { src: "/work/ginevra/logo.png" },
};

export function ProjectMedia({
  motif,
  priority = false,
}: {
  motif: Motif;
  /**
   * Eager-load + preload this logo (next/image `priority`). The hero's
   * above-the-fold vessels set this so the LCP card image is discovered at
   * HTML-parse time instead of after hydration — otherwise the portrait hero
   * card (the mobile LCP element) is lazy-loaded and lands seconds late. The
   * below-the-fold proof grid and attractor leave it false so they stay lazy.
   */
  priority?: boolean;
}) {
  const logo = LOGOS[motif];
  return (
    <span className="vessel__media">
      {/* Decorative: the vessel/card already names the project for assistive
          tech, so the logo is alt="" to avoid a redundant announcement. */}
      <Image
        alt=""
        className="vessel__logo"
        fill
        priority={priority}
        sizes="(max-width: 40rem) 45vw, 17rem"
        src={logo.src}
      />
    </span>
  );
}
