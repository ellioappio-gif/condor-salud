"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, MessageCircle } from "lucide-react";

interface NPSData {
  score: number;
  total: number;
  promoters: number;
  passives: number;
  detractors: number;
  recentComments: { patient: string; score: number; feedback: string; date: string }[];
}

export function NPSWidget() {
  const [data, setData] = useState<NPSData | null>(null);

  useEffect(() => {
    fetch("/api/surveys/nps")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="bg-white border border-border rounded-xl p-5 animate-pulse">
        <div className="h-4 bg-ink-50 rounded w-32 mb-4" />
        <div className="h-16 bg-ink-50 rounded" />
      </div>
    );
  }

  const ScoreIcon = data.score >= 50 ? TrendingUp : data.score >= 0 ? Minus : TrendingDown;
  const scoreColor =
    data.score >= 50 ? "text-success-600" : data.score >= 0 ? "text-amber-600" : "text-red-600";

  return (
    <div className="bg-white border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink uppercase tracking-wider">NPS</h3>
        <span className="text-[10px] text-ink-muted">{data.total} respuestas</span>
      </div>

      {/* Score */}
      <div className="flex items-center gap-3">
        <span className={`text-4xl font-bold ${scoreColor}`}>{data.score}</span>
        <ScoreIcon className={`w-5 h-5 ${scoreColor}`} />
      </div>

      {/* Breakdown bar */}
      <div className="space-y-1.5">
        <div className="flex h-3 rounded-full overflow-hidden">
          {data.promoters > 0 && (
            <div
              className="bg-success-500"
              style={{ width: `${(data.promoters / data.total) * 100}%` }}
            />
          )}
          {data.passives > 0 && (
            <div
              className="bg-amber-400"
              style={{ width: `${(data.passives / data.total) * 100}%` }}
            />
          )}
          {data.detractors > 0 && (
            <div
              className="bg-red-400"
              style={{ width: `${(data.detractors / data.total) * 100}%` }}
            />
          )}
        </div>
        <div className="flex justify-between text-[10px] text-ink-muted">
          <span className="text-success-600">Promotores {data.promoters}</span>
          <span className="text-amber-600">Pasivos {data.passives}</span>
          <span className="text-red-500">Detractores {data.detractors}</span>
        </div>
      </div>

      {/* Recent comments */}
      {data.recentComments.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1">
            <MessageCircle className="w-3 h-3" /> Comentarios recientes
          </p>
          {data.recentComments.slice(0, 3).map((c, i) => (
            <div key={i} className="text-xs text-ink-muted">
              <span className="font-semibold text-ink">{c.patient}</span>{" "}
              <span
                className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${c.score >= 9 ? "bg-success-50 text-success-700" : c.score >= 7 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"}`}
              >
                {c.score}
              </span>{" "}
              — {c.feedback}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
