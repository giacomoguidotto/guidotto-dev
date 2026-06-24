// Denouement — the lower-page close, composed: the Mission beat, then the Human
// anchor (warm portrait slot, the personal line, the animated signature).
//
// Deep module: <Denouement /> is the whole interface for the lower page; the
// mission narration, the human anchor, the placeholder-tolerant portrait, and
// the scroll-into-view signature draw are all hidden inside. The CTA door and
// the quiet social rail are a separate slice (#7); composing this section into
// the real home page is the later capstone slice (#10), which is why this lives
// behind a thin preview route rather than touching src/app/page.tsx.

import styles from "./denouement.module.css";
import { HumanAnchor } from "./human-anchor";
import { Mission } from "./mission";

export function Denouement() {
  return (
    <div className={styles.section}>
      <Mission />
      <HumanAnchor />
    </div>
  );
}
