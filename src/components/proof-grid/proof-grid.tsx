// ProofGrid — the 2x2 grid of the four peer proof cards (Orray, Tempo, Scry,
// Ginevra), rendered straight from the canonical content surface. This is the
// plain standalone section; the scroll-morph that delivers these cards out of
// the hero contact sheet is a later slice and is deliberately not built here.
//
// Render it inside a ShowcaseRoot so each card can write the earned accent onto
// the single-root --live-accent and only one card is loud at a time. Deep
// module: <ProofGrid /> is the entire interface; the cards, the glass, the
// media seam, and the accent wiring are all hidden inside.

import { content } from "~/content";
import { ProofCard } from "./proof-card";
import styles from "./proof-grid.module.css";

export function ProofGrid() {
  return (
    <section className={styles.section}>
      <ul className={styles.grid}>
        {content.projects.map((project) => (
          <li className={styles.item} key={project.key}>
            <ProofCard project={project} />
          </li>
        ))}
      </ul>
    </section>
  );
}
