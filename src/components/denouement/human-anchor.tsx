// HumanAnchor — the warm human moment just below the mission: a portrait slot,
// the one personal line, and the animated signature beneath it.
//
// This is the high note of the human escalation (a signature-scale avatar in the
// masthead pays off here as a full, warm presence). The personal line is read
// verbatim from the canonical content surface and server-rendered, so it is in
// the initial HTML and indexable.
//
// The portrait slot is placeholder-tolerant: until Giacomo's portrait is dropped
// in (passed as `portraitSrc`), it shows a quiet warm silhouette behind the same
// vitrine glass the rest of the gallery uses, so the section reads as deliberate
// with no asset present. Supplying a `portraitSrc` swaps the silhouette for the
// real image in the identical frame, with no layout change. The real image stands
// alone as the warm face this section pays off into, so its alt text defaults to
// the canonical name (no invented copy) and can be overridden via `portraitAlt`.

import Image from "next/image";
import { content } from "~/content";
import styles from "./denouement.module.css";
import { Signature } from "./signature";

export function HumanAnchor({
  portraitSrc,
  portraitAlt = content.site.name,
}: {
  portraitSrc?: string;
  portraitAlt?: string;
}) {
  const { personalLine } = content.human;
  return (
    <section className={styles.human}>
      <div className={styles.portrait}>
        <span className={styles.portraitFill} />
        {portraitSrc ? (
          <Image
            alt={portraitAlt}
            className={styles.portraitImage}
            fill
            sizes="13rem"
            src={portraitSrc}
          />
        ) : (
          <svg
            aria-hidden="true"
            className={styles.portraitSilhouette}
            fill="currentColor"
            viewBox="0 0 100 125"
          >
            <title>Portrait placeholder</title>
            <circle cx="50" cy="44" r="20" />
            <path d="M 14 125 C 14 96 30 82 50 82 C 70 82 86 96 86 125 Z" />
          </svg>
        )}
        <span className={styles.portraitGlass} />
      </div>

      <div className={styles.humanText}>
        <p className={styles.personalLine}>{personalLine}</p>
        <Signature />
      </div>
    </section>
  );
}
