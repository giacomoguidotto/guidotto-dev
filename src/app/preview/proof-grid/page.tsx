import { ProofGrid } from "~/components/proof-grid/proof-grid";
import styles from "~/components/proof-grid/proof-grid.module.css";
import { ShowcaseRoot } from "~/components/showcase/showcase-root";

// Standalone preview of the proof grid so the section is independently
// verifiable by eye at /preview/proof-grid. It is wrapped in a ShowcaseRoot on
// the cool stage so the earned-accent mechanic (one card loud at a time) works
// exactly as it will in the real page. Integration into the home page itself is
// the later capstone slice (#10), which is why this lives behind a thin preview
// route rather than touching src/app/page.tsx.

export default function ProofGridPreview() {
  return (
    <main className="page">
      <ShowcaseRoot className={styles.stage}>
        <div className={styles.tint} />
        <ProofGrid />
      </ShowcaseRoot>
    </main>
  );
}
