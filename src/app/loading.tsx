import { Masthead } from "~/components/masthead";
import styles from "./status.module.css";

// The navigation/Suspense fallback (App Router loading.tsx). The site is largely
// prerendered, so this rarely shows; when it does it is a SILENT hold — the
// persistent masthead over the same cool stage backdrop, with no label. Both the
// masthead and the gradient are exactly what the resolved page already paints, so
// the only thing that changes when it resolves is the page content fading in over
// an unchanged background: a seamless hand-off, not a "LOADING" flash that vanishes.

export default function Loading() {
  return (
    <main className="page">
      <Masthead />
      <section className={styles.stage}>
        <div aria-hidden="true" className={styles.vignette} />
      </section>
    </main>
  );
}
