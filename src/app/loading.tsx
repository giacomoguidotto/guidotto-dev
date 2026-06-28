import { Masthead } from "~/components/masthead";
import { content } from "~/content";
import styles from "./status.module.css";

// The navigation/Suspense fallback (App Router loading.tsx). The site is largely
// prerendered, so this rarely shows, but when it does it stays on-brand: the same
// cool stage and chrome, with a single quiet pulsing mono label instead of a bare
// white flash.

export default function Loading() {
  const { label } = content.loading;

  return (
    <main className="page">
      <Masthead />
      <section className={styles.stage}>
        <div aria-hidden="true" className={styles.vignette} />
        <div className={styles.copy}>
          <p className={`${styles.code} ${styles.pulse}`}>{label}</p>
        </div>
      </section>
    </main>
  );
}
