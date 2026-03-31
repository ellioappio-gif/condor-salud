"use client";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import {
  Building,
  Users,
  Link2,
  CreditCard,
  ClipboardList,
  Bell,
  MessageSquare,
  Wallet,
  AlarmClock,
  LayoutGrid,
} from "lucide-react";

const sectionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Mi Clinica": Building,
  Equipo: Users,
  Integraciones: Link2,
  "Facturacion & Plan": CreditCard,
  Nomenclador: ClipboardList,
  Notificaciones: Bell,
  "WhatsApp Turnos": MessageSquare,
  "Pagos y Cobros": Wallet,
  Recordatorios: AlarmClock,
  "Tu Plan": LayoutGrid,
};

export default function ConfiguracionPage() {
  const { t } = useLocale();
  const { user } = useAuth();

  const sections = [
    {
      title: t("settings.myClinic"),
      desc: t("settings.myClinicDesc"),
      href: "/dashboard/configuracion/clinica",
      badge: null,
      iconKey: "Mi Clinica",
    },
    {
      title: t("settings.team"),
      desc: t("settings.teamDesc"),
      href: "/dashboard/configuracion/equipo",
      badge: null,
      iconKey: "Equipo",
    },
    {
      title: t("settings.integrations"),
      desc: t("settings.integrationsDesc"),
      href: "/dashboard/configuracion/integraciones",
      badge: null,
      iconKey: "Integraciones",
    },
    {
      title: t("settings.billingPlan"),
      desc: t("settings.billingPlanDesc"),
      href: "/dashboard/configuracion/facturacion",
      badge: null,
      iconKey: "Facturacion & Plan",
    },
    {
      title: t("settings.nomenclatorTitle"),
      desc: t("settings.nomenclatorDesc"),
      href: "/dashboard/nomenclador",
      badge: null,
      iconKey: "Nomenclador",
    },
    {
      title: t("settings.notifications"),
      desc: t("settings.notificationsDesc"),
      href: "/dashboard/configuracion/notificaciones",
      badge: null,
      iconKey: "Notificaciones",
    },
    {
      title: t("settings.whatsAppAppointments"),
      desc: t("settings.whatsAppDesc"),
      href: "/dashboard/configuracion/whatsapp",
      badge: null,
      iconKey: "WhatsApp Turnos",
    },
    {
      title: t("settings.paymentsTitle"),
      desc: t("settings.paymentsDesc"),
      href: "/dashboard/configuracion/pagos",
      badge: null,
      iconKey: "Pagos y Cobros",
    },
    {
      title: t("settings.remindersTitle"),
      desc: t("settings.remindersDesc"),
      href: "/dashboard/configuracion/recordatorios",
      badge: null,
      iconKey: "Recordatorios",
    },
    {
      title: t("settings.yourPlan"),
      desc: t("settings.yourPlanDesc"),
      href: "/planes",
      badge: null,
      iconKey: "Tu Plan",
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">{t("settings.title")}</h1>
        <p className="text-sm text-ink-muted mt-0.5">{t("settings.subtitle")}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => (
          <Link
            key={s.title}
            href={s.href}
            className="bg-white border border-border rounded-lg p-5 hover:shadow-md transition group block"
          >
            <div className="flex items-start justify-between mb-3">
              {(() => {
                const I = sectionIcons[s.iconKey];
                return I ? <I className="w-6 h-6 text-celeste-dark" /> : null;
              })()}
              {s.badge && (
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider rounded bg-celeste-pale text-celeste-dark">
                  {s.badge}
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-ink mb-1 group-hover:text-celeste-dark transition">
              {s.title}
            </h3>
            <p className="text-xs text-ink-muted leading-relaxed">{s.desc}</p>
            <span className="text-xs text-celeste-dark font-medium mt-3 inline-block group-hover:underline">
              {t("settings.configure")}
            </span>
          </Link>
        ))}
      </div>

      {/* Quick info */}
      <div className="bg-celeste-pale/30 border border-border rounded-lg p-5">
        <div className="grid sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-[10px] font-bold tracking-wider text-ink-muted uppercase">
              {t("settings.clinic")}
            </p>
            <p className="font-semibold text-ink mt-0.5">{user?.clinicName || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider text-ink-muted uppercase">
              {t("settings.cuit")}
            </p>
            <p className="font-mono text-ink mt-0.5">{"—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider text-ink-muted uppercase">
              {t("label.plan")}
            </p>
            <p className="font-semibold text-celeste-dark mt-0.5">Plus</p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider text-ink-muted uppercase">
              {t("settings.nextBilling")}
            </p>
            <p className="font-semibold text-ink mt-0.5">{"—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
