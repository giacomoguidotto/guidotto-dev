import { Masthead } from "~/components/masthead";
import { Stage } from "~/components/stage/stage";

// Standalone preview of the scroll handoff (Stage) so the choreography is
// independently verifiable by eye at /preview/stage. The Stage owns the whole
// hero -> grid story: it server-renders the plain sectioned fallback and upgrades
// to the FLIP morph on motion-welcome fine pointers. Composing the handoff into
// the real home page (and wiring the finale's set-aside return) is the later
// capstone slice (#10), which is why this lives behind a thin preview route
// rather than touching src/app/page.tsx.

export default function StagePreview() {
  return (
    <main className="page">
      <Masthead />
      <Stage />
    </main>
  );
}
