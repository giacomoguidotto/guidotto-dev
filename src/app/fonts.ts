import { Fraunces, JetBrains_Mono } from "next/font/google";

// The two site voices, declared once and shared. The root layout wires them onto
// <body> for every normal route; global-error.tsx (which replaces the root
// layout when the layout itself throws) imports the same instances so the
// last-resort document keeps the same type, rather than re-declaring the loaders.

// Warm, optical, characterful serif — the display thesis voice (analog warmth in
// its forms, regardless of color).
export const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  axes: ["SOFT", "WONK", "opsz"],
});

// The engineering register — small labels, eyebrows, CTA.
export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});
