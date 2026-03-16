"use client";

import { useLocale } from "@/lib/i18n/context";
import Stats from "@/components/Stats";
import Problem from "@/components/Problem";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Integrations from "@/components/Integrations";
import Security from "@/components/Security";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import Waitlist from "@/components/Waitlist";
import FinalCTA from "@/components/FinalCTA";
import PatientStats from "@/components/PatientStats";

/**
 * Segment-aware landing page body.
 *
 * Provider / Default → full SaaS pitch:
 *   Stats → Problem → Features → HowItWorks → Integrations → Security → Pricing → FAQ → Waitlist → FinalCTA
 *
 * Patient / Tourist → healthcare consumer flow:
 *   PatientStats → Problem(@tourist) → Features(@tourist) → HowItWorks(@tourist) → Security → FAQ(@tourist) → FinalCTA(@tourist)
 *
 * Translation keys with @tourist suffix are resolved automatically by the i18n context.
 */
export default function LandingContent() {
  const { segment } = useLocale();

  const isTourist = segment === "tourist";

  if (isTourist) {
    return (
      <div key="tourist" className="animate-segmentFade">
        <PatientStats />
        <Problem />
        <Features />
        <HowItWorks />
        <Security />
        <FAQ />
        <FinalCTA />
      </div>
    );
  }

  return (
    <div key="provider" className="animate-segmentFade">
      <Stats />
      <Problem />
      <Features />
      <HowItWorks />
      <Integrations />
      <Security />
      <Testimonials />
      <Pricing />
      <FAQ />
      <Waitlist />
      <FinalCTA />
    </div>
  );
}
