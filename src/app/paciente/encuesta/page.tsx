"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/context";
import { CheckCircle2, Star } from "lucide-react";

const SCORE_COLORS: Record<number, string> = {
  0: "bg-red-500",
  1: "bg-red-500",
  2: "bg-red-400",
  3: "bg-red-400",
  4: "bg-orange-400",
  5: "bg-orange-400",
  6: "bg-orange-500",
  7: "bg-amber-400",
  8: "bg-amber-400",
  9: "bg-green-500",
  10: "bg-green-500",
};

export default function NPSSurveyPage() {
  const { t } = useLocale();
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [alreadyAnswered, setAlreadyAnswered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (score === null) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/surveys/nps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: "00000000-0000-0000-0000-000000000000", // demo
          score,
          feedback: feedback.trim() || undefined,
        }),
      });
      if (res.status === 409) {
        setAlreadyAnswered(true);
      } else {
        setSubmitted(true);
      }
    } catch {
      setSubmitted(true); // Optimistic for demo
    }
    setIsSubmitting(false);
  };

  if (alreadyAnswered) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <CheckCircle2 className="w-12 h-12 text-celeste mx-auto mb-4" />
          <h1 className="text-xl font-bold text-ink mb-2">{t("nps.alreadyAnswered")}</h1>
          <p className="text-sm text-ink-muted">{t("nps.alreadyAnsweredDesc")}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-ink mb-2">{t("nps.thankYou")}</h1>
          <p className="text-sm text-ink-muted">{t("nps.thankYouDesc")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl border border-border-light shadow-sm max-w-md w-full p-8">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-ink mb-1">{t("nps.question")}</h1>
          <p className="text-sm text-ink-muted">{t("nps.questionSubtitle")}</p>
        </div>

        {/* Score buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {Array.from({ length: 11 }, (_, i) => (
            <button
              key={i}
              onClick={() => setScore(i)}
              className={`w-11 h-11 rounded-xl text-sm font-bold transition-all ${
                score === i
                  ? `${SCORE_COLORS[i]} text-white scale-110 shadow-lg`
                  : "bg-ink-50 text-ink-400 hover:bg-ink-100"
              }`}
              aria-label={`${i} ${t("nps.outOf10")}`}
            >
              {i}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-ink-muted mb-6 px-1">
          <span>{t("nps.notLikely")}</span>
          <span>{t("nps.veryLikely")}</span>
        </div>

        {/* Feedback */}
        <div className="mb-6">
          <label className="text-xs font-medium text-ink-muted block mb-1">
            {t("nps.feedbackLabel")}
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder={t("nps.feedbackPlaceholder")}
            className="w-full border border-border-light rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-celeste-200 focus:border-celeste-dark resize-none"
          />
        </div>

        <button
          disabled={score === null || isSubmitting}
          onClick={handleSubmit}
          className="w-full bg-celeste-dark hover:bg-celeste-700 text-white text-sm font-semibold py-3 rounded-[4px] transition disabled:opacity-50"
        >
          {isSubmitting ? t("nps.submitting") : t("nps.submit")}
        </button>
      </div>
    </div>
  );
}
