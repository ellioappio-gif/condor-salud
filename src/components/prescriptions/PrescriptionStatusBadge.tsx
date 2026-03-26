"use client";

import { CheckCircle2, Clock, XCircle, Send, FileEdit, Shield, Ban } from "lucide-react";

type RegistrationChannel = "osde" | "rcta" | "pdf_only" | "error" | "pending";

interface PrescriptionStatusBadgeProps {
  /** Prescription lifecycle status */
  status: string;
  /** OSDE registration data */
  osde?: { status: string };
  /** RCTA registration data */
  rcta?: { status: string; prescriptionId?: string };
  /** Show registration channel badge alongside status */
  showChannel?: boolean;
  /** Compact mode for table rows */
  compact?: boolean;
}

// ─── Status Config ───────────────────────────────────────────

const STATUS_CONFIG: Record<string, { cls: string; label: string; Icon: typeof CheckCircle2 }> = {
  draft: { cls: "bg-gray-100 text-gray-600", label: "Borrador", Icon: FileEdit },
  active: { cls: "bg-green-50 text-green-700", label: "Activa", Icon: CheckCircle2 },
  sent: { cls: "bg-blue-50 text-blue-700", label: "Enviada", Icon: Send },
  dispensed: { cls: "bg-indigo-50 text-indigo-700", label: "Dispensada", Icon: CheckCircle2 },
  expired: { cls: "bg-amber-50 text-amber-700", label: "Vencida", Icon: Clock },
  cancelled: { cls: "bg-red-50 text-red-600", label: "Anulada", Icon: XCircle },
};

const CHANNEL_CONFIG: Record<
  RegistrationChannel,
  { cls: string; label: string; Icon: typeof Shield }
> = {
  osde: { cls: "bg-blue-50 text-blue-700 border-blue-200", label: "Registrada OSDE", Icon: Shield },
  rcta: {
    cls: "bg-green-50 text-green-700 border-green-200",
    label: "Registrada RCTA",
    Icon: Shield,
  },
  pdf_only: {
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    label: "PDF Only",
    Icon: FileEdit,
  },
  error: { cls: "bg-red-50 text-red-600 border-red-200", label: "Error", Icon: Ban },
  pending: { cls: "bg-gray-50 text-gray-600 border-gray-200", label: "Pendiente", Icon: Clock },
};

// ─── Helpers ─────────────────────────────────────────────────

function detectChannel(osde?: { status: string }, rcta?: { status: string }): RegistrationChannel {
  if (osde?.status === "registered") return "osde";
  if (rcta?.status === "registered") return "rcta";
  if (rcta?.status === "error" || osde?.status === "server_error") return "error";
  if (rcta?.status === "pending_credentials") return "pdf_only";
  if (!osde && !rcta) return "pdf_only";
  return "pending";
}

// ─── Component ───────────────────────────────────────────────

export default function PrescriptionStatusBadge({
  status,
  osde,
  rcta,
  showChannel = true,
  compact = false,
}: PrescriptionStatusBadgeProps) {
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.active!;
  const { cls, label, Icon } = statusCfg!;

  const channel = detectChannel(osde, rcta);
  const channelCfg = CHANNEL_CONFIG[channel];

  const size = compact ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1";
  const iconSize = compact ? "w-3 h-3" : "w-3.5 h-3.5";

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      {/* Lifecycle status badge */}
      <span className={`inline-flex items-center gap-1 font-semibold rounded-full ${size} ${cls}`}>
        <Icon className={iconSize} />
        {label}
      </span>

      {/* Registration channel badge */}
      {showChannel && status !== "draft" && status !== "cancelled" && (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-full border ${size} ${channelCfg.cls}`}
        >
          <channelCfg.Icon className={iconSize} />
          {channelCfg.label}
        </span>
      )}
    </div>
  );
}
