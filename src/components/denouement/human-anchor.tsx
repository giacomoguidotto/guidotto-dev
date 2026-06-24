// HumanAnchor — the warm human moment just below the mission: a generous
// portrait, the personal line, and the animated signature beneath it.
//
// This is the high note of the human escalation (a signature-scale avatar in the
// masthead pays off here as a full, warm presence). The personal line is read
// verbatim from the canonical content surface and server-rendered, so it is in
// the initial HTML and indexable.
//
// The line is one sentence of greeting ("I'm Jack.") followed by an elaboration,
// and the section reads in that rhythm: the greeting lands big and breathes, then
// the quieter elaboration follows in a different, secondary voice. Splitting on
// the first sentence boundary is purely typographic — both halves are the exact
// content string, in order, with nothing invented; if the boundary is ever
// absent the whole line simply renders as the greeting.
//
// The portrait slot is placeholder-tolerant: without a `portraitSrc` it shows a
// quiet warm silhouette behind the same vitrine glass the rest of the gallery
// uses, so the section reads as deliberate with no asset present. Supplying a
// `portraitSrc` swaps the silhouette for the real image in the identical frame,
// with no layout change. The real image stands alone as the warm face this
// section pays off into, so its alt text defaults to the canonical name (no
// invented copy) and can be overridden via `portraitAlt`.

import Image from "next/image";
import { Fragment } from "react";
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
  const sentenceBreak = personalLine.indexOf(". ");
  const greeting =
    sentenceBreak === -1
      ? personalLine
      : personalLine.slice(0, sentenceBreak + 1);
  const elaboration =
    sentenceBreak === -1 ? "" : personalLine.slice(sentenceBreak + 2).trim();

  // Break the elaboration onto its own display lines along its comma clauses,
  // keeping the first two together: "Forever curious, always improving," /
  // "never quite comfortable," / "and building something that matters." This is
  // line-breaking only — every clause is the exact content string, in order, with
  // the consumed comma re-added at each break. Counts drive the grouping, and any
  // clauses the copy might grow beyond them ride on the last line so nothing is
  // dropped.
  const clauses = elaboration ? elaboration.split(", ") : [];
  const lineClauseCounts = [2, 1, 1];
  const elaborationLines: string[] = [];
  let clauseIndex = 0;
  for (const count of lineClauseCounts) {
    const lineClauses = clauses.slice(clauseIndex, clauseIndex + count);
    clauseIndex += count;
    if (lineClauses.length > 0) {
      elaborationLines.push(lineClauses.join(", "));
    }
  }
  if (clauseIndex < clauses.length) {
    elaborationLines[elaborationLines.length - 1] +=
      `, ${clauses.slice(clauseIndex).join(", ")}`;
  }
  const renderedLines = elaborationLines.map((line, i) =>
    i < elaborationLines.length - 1 ? `${line},` : line
  );

  return (
    <section className={styles.human}>
      <div className={styles.portrait}>
        <span className={styles.portraitFill} />
        {portraitSrc ? (
          <Image
            alt={portraitAlt}
            className={styles.portraitImage}
            fill
            sizes="(max-width: 40rem) 13rem, 18rem"
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
        <p className={styles.greeting}>{greeting}</p>
        {renderedLines.length > 0 ? (
          <p className={styles.elaboration}>
            {renderedLines.map((line, i) => (
              <Fragment key={line}>
                {i > 0 ? <br /> : null}
                {line}
              </Fragment>
            ))}
          </p>
        ) : null}
        <Signature />
      </div>
    </section>
  );
}
