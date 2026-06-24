// Mission — the forward-slope mission beat that opens the denouement.
//
// A server component: the mono `MISSION` label, the Fraunces lead, and the
// locked three-paragraph body are all read straight from the canonical content
// surface and server-rendered, so every word is in the initial HTML and fully
// indexable. There is no interactivity and no autonomous motion here; this beat
// is narration, the quiet resolve after the page has spent its two tentpoles.

import { content } from "~/content";
import styles from "./denouement.module.css";

export function Mission() {
  const { label, lead, body } = content.mission;
  return (
    <section className={styles.mission}>
      <p className={styles.missionLabel}>{label}</p>
      <h2 className={styles.missionLead}>{lead}</h2>
      <div className={styles.missionBody}>
        {body.map((paragraph) => (
          <p className={styles.missionParagraph} key={paragraph}>
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}
