import { Denouement } from "~/components/denouement/denouement";
import styles from "~/components/denouement/denouement.module.css";

// Standalone preview of the lower-page denouement (Mission + Human anchor +
// Signature) so the section is independently verifiable by eye at
// /preview/denouement. It renders on the cool stage so the warm type and the
// signature read exactly as they will in the real page. Integration into the
// home page itself is the later capstone slice (#10), which is why this lives
// behind a thin preview route rather than touching src/app/page.tsx.

export default function DenouementPreview() {
  return (
    <main className="page">
      <div className={styles.stage}>
        <Denouement />
      </div>
    </main>
  );
}
