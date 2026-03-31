"use client";

import { useState, useCallback } from "react";
import type { OTCDeliveryItem } from "@/lib/cora/otc-delivery";
import {
  rappiSearchUrl,
  pedidosYaSearchUrl,
  rappiSearchAllUrl,
  pedidosYaSearchAllUrl,
} from "@/lib/cora/otc-delivery";
import { useLocale } from "@/lib/i18n/context";

// ─── Types ───────────────────────────────────────────────────

type Platform = "rappi" | "pedidosya";

interface OTCDeliveryCardProps {
  items: OTCDeliveryItem[];
  reason?: string;
  coords?: { lat: number; lng: number } | null;
}

// ─── Platform Config ─────────────────────────────────────────

const PLATFORMS: Record<
  Platform,
  { label: string; color: string; textColor: string; icon: string }
> = {
  rappi: {
    label: "Rappi",
    color: "bg-[#FF441F]",
    textColor: "text-white",
    icon: "🛵",
  },
  pedidosya: {
    label: "PedidosYa",
    color: "bg-[#D7282F]",
    textColor: "text-white",
    icon: "🏍️",
  },
};

// ─── Component ───────────────────────────────────────────────

export default function OTCDeliveryCard({ items, reason, coords }: OTCDeliveryCardProps) {
  const { t } = useLocale();
  const [activePlatform, setActivePlatform] = useState<Platform>("rappi");
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const text = items
      .map(
        (item) => `${item.name} (${item.genericName})${item.quantity ? ` — ${item.quantity}` : ""}`,
      )
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  }, [items]);

  const allUrl =
    activePlatform === "rappi" ? rappiSearchAllUrl(items, coords) : pedidosYaSearchAllUrl(items);

  const platform = PLATFORMS[activePlatform];

  return (
    <div className="pl-9 animate-chatMsg">
      <div className="border border-border rounded-xl overflow-hidden bg-white">
        {/* Header */}
        <div className="px-3 py-2.5 bg-surface/60 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-[13px]">💊</span>
            <span className="text-[12px] font-semibold text-ink">
              {t("chatbot.otcDeliveryTitle")}
            </span>
          </div>
          {reason && <p className="text-[11px] text-ink-muted mt-0.5 ml-5">{reason}</p>}
        </div>

        {/* Platform Tabs */}
        <div className="flex border-b border-border">
          {(Object.keys(PLATFORMS) as Platform[]).map((key) => {
            const p = PLATFORMS[key];
            const isActive = activePlatform === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActivePlatform(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-medium transition ${
                  isActive
                    ? `${p.color} ${p.textColor}`
                    : "bg-white text-ink-muted hover:bg-surface/50"
                }`}
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Item List */}
        <div className="divide-y divide-border-light">
          {items.map((item, i) => {
            const itemUrl =
              activePlatform === "rappi"
                ? rappiSearchUrl(item.name, coords)
                : pedidosYaSearchUrl(item.name);

            return (
              <a
                key={i}
                href={itemUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface/50 transition text-left"
              >
                {/* Pill icon */}
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <span className="text-[13px]">💊</span>
                </div>
                {/* Name + generic */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-ink">{item.name}</p>
                  <p className="text-[11px] text-ink-muted truncate">
                    {item.genericName}
                    {item.quantity && ` · ${item.quantity}`}
                  </p>
                </div>
                {/* External link arrow */}
                <svg
                  viewBox="0 0 24 24"
                  className="w-3.5 h-3.5 text-ink-200 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            );
          })}
        </div>

        {/* Footer: Order All + Copy */}
        <div className="border-t border-border px-3 py-2.5 flex items-center gap-2">
          <a
            href={allUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 text-center text-[12px] font-semibold py-2 rounded-lg transition ${platform.color} ${platform.textColor} hover:opacity-90`}
          >
            {t("chatbot.otcOrderAll")} {platform.label} →
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-2 text-[11px] font-medium text-ink-muted bg-surface rounded-lg hover:bg-surface/80 transition flex items-center gap-1"
            title={t("chatbot.otcCopyList")}
          >
            {copied ? (
              <>
                <svg
                  viewBox="0 0 24 24"
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {t("chatbot.otcCopied")}
              </>
            ) : (
              <>
                <svg
                  viewBox="0 0 24 24"
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                {t("chatbot.otcCopyList")}
              </>
            )}
          </button>
        </div>

        {/* Disclaimer */}
        <div className="px-3 py-2 bg-amber-50/60 border-t border-amber-100">
          <p className="text-[10px] text-amber-700 leading-tight">
            ⚠️ {t("chatbot.otcDisclaimer")}
          </p>
        </div>
      </div>
    </div>
  );
}
