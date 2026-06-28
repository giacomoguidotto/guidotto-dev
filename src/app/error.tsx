"use client";

import { Masthead } from "~/components/masthead";
import { content } from "~/content";
import styles from "./status.module.css";

// The route error boundary (App Router error.tsx). It catches an uncaught error
// thrown while rendering a route segment (here: the interactive WebGL attractor
// or the contact form) and replaces that segment with a styled status surface,
// still inside the root layout. It must be a Client Component because it receives
// the `reset` callback that re-renders the failed segment.
//
// We deliberately do not log the error: the repo forbids `console`, and Vercel
// already captures runtime errors. The user gets a way forward (try again) and a
// way out (back home).

export default function RouteError({ reset }: { reset: () => void }) {
  const { eyebrow, title, subline, retry, cta } = content.error;

  return (
    <main className="page">
      <Masthead />
      <section className={styles.stage}>
        <div aria-hidden="true" className={styles.vignette} />
        <div className={styles.copy}>
          <p className={styles.code}>{eyebrow}</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subline}>{subline}</p>
          <div className={styles.actions}>
            <button
              className={styles.retry}
              onClick={() => reset()}
              type="button"
            >
              {retry}
            </button>
            <a className={styles.home} href="/">
              <span aria-hidden="true" className={styles.homeArrow}>
                ←
              </span>
              {cta}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
