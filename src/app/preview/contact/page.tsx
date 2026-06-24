import { ContactDoor } from "~/components/contact/contact-door";
import styles from "~/components/contact/contact-door.module.css";

// Standalone preview of the contact door so the section is independently
// verifiable by eye at /preview/contact: open the door, watch the form reveal in
// place, tab to the first field, submit, and read the warm confirmation. The
// quiet rail sits below. Integration into the home page itself is the later
// capstone slice, which is why this lives behind a thin preview route rather
// than touching src/app/page.tsx.

export default function ContactPreview() {
  return (
    <main className={styles.stage}>
      <ContactDoor />
    </main>
  );
}
