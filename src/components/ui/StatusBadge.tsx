import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/context";

type Variant =
  | "cobrada"
  | "presentada"
  | "rechazada"
  | "pendiente"
  | "en_observacion"
  | "activo"
  | "inactivo"
  | "confirmado"
  | "cancelado"
  | "atendido"
  | "alta"
  | "media"
  | "baja"
  | "reprocesado"
  | "descartado"
  | "revisado"
  | "resuelto"
  | "celeste"
  | "gold"
  | "default";

const variantStyles: Record<Variant, string> = {
  cobrada: "bg-success-50 text-success-700 border-success-200",
  presentada: "bg-celeste-pale text-celeste-dark border-celeste-light",
  rechazada: "bg-red-50 text-red-700 border-red-200",
  pendiente: "bg-amber-50 text-amber-700 border-amber-200",
  en_observacion: "bg-amber-50 text-amber-700 border-amber-200",
  activo: "bg-success-50 text-success-700 border-success-200",
  inactivo: "bg-gray-100 text-gray-500 border-gray-200",
  confirmado: "bg-celeste-pale text-celeste-dark border-celeste-light",
  cancelado: "bg-red-50 text-red-700 border-red-200",
  atendido: "bg-success-50 text-success-700 border-success-200",
  alta: "bg-red-50 text-red-700 border-red-200",
  media: "bg-amber-50 text-amber-700 border-amber-200",
  baja: "bg-celeste-pale text-celeste-dark border-celeste-light",
  reprocesado: "bg-celeste-pale text-celeste-dark border-celeste-light",
  descartado: "bg-gray-100 text-gray-500 border-gray-200",
  revisado: "bg-amber-50 text-amber-700 border-amber-200",
  resuelto: "bg-success-50 text-success-700 border-success-200",
  celeste: "bg-celeste-pale text-celeste-dark border-celeste-light",
  gold: "bg-celeste-pale text-celeste-dark border-celeste-light",
  default: "bg-gray-100 text-gray-700 border-gray-200",
};

const STATUS_KEYS: Partial<Record<Variant, string>> = {
  cobrada: "status.collected",
  presentada: "status.submitted",
  rechazada: "status.rejected",
  pendiente: "status.pending",
  en_observacion: "status.observation",
  activo: "status.active",
  inactivo: "status.inactive",
  confirmado: "status.confirmed",
  cancelado: "status.cancelled",
  atendido: "status.attended",
  alta: "status.high",
  media: "status.medium",
  baja: "status.low",
  reprocesado: "status.reprocessed",
  descartado: "status.discarded",
  revisado: "status.reviewed",
  resuelto: "status.resolved",
};

interface StatusBadgeProps {
  variant: Variant;
  label?: string;
  className?: string;
}

export function StatusBadge({ variant, label, className }: StatusBadgeProps) {
  const { t } = useLocale();
  const translationKey = STATUS_KEYS[variant];
  const displayLabel = label || (translationKey ? t(translationKey) : variant);

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded border",
        variantStyles[variant] || variantStyles.default,
        className,
      )}
      role="status"
    >
      {displayLabel}
    </span>
  );
}
