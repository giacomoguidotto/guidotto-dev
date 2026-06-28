"use client";

import { Masthead } from "~/components/masthead";
import { content } from "~/content";
import { fraunces, jetbrainsMono } from "./fonts";
import "./globals.css";
import styles from "./status.module.css";

// The last-resort error boundary (App Router global-error.tsx). It only fires
// when the root layout itself throws, so it REPLACES the layout and must render
// its own <html> and <body> — the masthead, fonts and globals.css are wired here
// rather than inherited. It mirrors error.tsx otherwise: try again, or back home.
//
// As with error.tsx we do not log (the repo forbids `console`; Vercel captures
// runtime errors).

export default function GlobalError({ reset }: { reset: () => void }) {
  const { eyebrow, title, subline, retry, cta } = content.error;

  return (
    <html lang={content.site.locale}>
      <body className={`${fraunces.variable} ${jetbrainsMono.variable}`}>
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
      </body>
    </html>
  );
}
