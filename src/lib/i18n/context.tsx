"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import translations, { type Locale } from "./translations";
import {
  type Segment,
  getSegmentFromCookie,
  setSegmentCookie,
  detectSegmentFromEmail,
  SEGMENT_LABELS,
} from "@/lib/segments";

// ─── Context ─────────────────────────────────────────────────

interface LanguageCtx {
  locale: Locale;
  isEn: boolean;
  toggleLocale: () => void;
  /** Current visitor segment */
  segment: Segment;
  /** Manually change the segment */
  setSegment: (s: Segment) => void;
  /** Detect + set segment from an email address */
  detectFromEmail: (email: string) => Segment;
  /** Segment display label in current locale */
  segmentLabel: string;
  /** Look up a key — returns segment-specific variant if available */
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageCtx>({
  locale: "es",
  isEn: false,
  toggleLocale: () => {},
  segment: "default",
  setSegment: () => {},
  detectFromEmail: () => "default",
  segmentLabel: "",
  t: (key) => key,
});

// ─── Provider ────────────────────────────────────────────────

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("es");
  const [segment, _setSegment] = useState<Segment>("default");

  // Hydrate segment from cookie on mount
  useEffect(() => {
    const stored = getSegmentFromCookie();
    if (stored !== "default") _setSegment(stored);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale((prev) => (prev === "es" ? "en" : "es"));
  }, []);

  const setSegment = useCallback((s: Segment) => {
    _setSegment(s);
    setSegmentCookie(s);
  }, []);

  const detectFromEmail = useCallback(
    (email: string): Segment => {
      const detected = detectSegmentFromEmail(email);
      setSegment(detected);
      return detected;
    },
    [setSegment],
  );

  /**
   * Look up a translation key.
   *
   * Resolution order:
   * 1. "{key}@{segment}"  — segment-specific override
   * 2. "{key}"            — default translation
   * 3. raw key string     — fallback
   *
   * This lets us add targeted overrides like "hero.title1@tourist"
   * without touching existing translations.
   */
  const t = useCallback(
    (key: string): string => {
      // Try segment-specific key first
      if (segment !== "default") {
        const segKey = `${key}@${segment}`;
        const segEntry = translations[segKey];
        if (segEntry) return segEntry[locale];
      }
      // Fall back to default key
      const entry = translations[key];
      if (!entry) return key;
      return entry[locale];
    },
    [locale, segment],
  );

  const segmentLabel = useMemo(() => SEGMENT_LABELS[segment][locale], [segment, locale]);

  const value = useMemo<LanguageCtx>(
    () => ({
      locale,
      isEn: locale === "en",
      toggleLocale,
      segment,
      setSegment,
      detectFromEmail,
      segmentLabel,
      t,
    }),
    [locale, toggleLocale, segment, setSegment, detectFromEmail, segmentLabel, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────

export function useLocale() {
  return useContext(LanguageContext);
}
