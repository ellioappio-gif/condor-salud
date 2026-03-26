"use client";

import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Send,
  Plus,
  Shield,
  QrCode,
  Landmark,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/Toast";

interface PrescriptionSuccessModalProps {
  prescription: {
    id: string;
    patientName: string;
    medications: { medicationName: string }[];
    verificationToken: string;
    status: string;
  };
  verificationUrl: string;
  registrations?: {
    osde?: { status: string; registeredAt?: string };
    rcta?: { status: string; prescriptionId?: string; pdfUrl?: string; error?: string };
  };
  onNewPrescription: () => void;
}

export default function PrescriptionSuccessModal({
  prescription,
  verificationUrl,
  registrations,
  onNewPrescription,
}: PrescriptionSuccessModalProps) {
  const { showToast } = useToast();
  const isDraft = prescription.status === "draft";
  const osde = registrations?.osde;
  const rcta = registrations?.rcta;

  function copyUrl() {
    const fullUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${verificationUrl}`
        : verificationUrl;
    try {
      navigator.clipboard.writeText(fullUrl);
      showToast("URL de verificación copiada al portapapeles");
    } catch {
      showToast("No se pudo copiar la URL", "error");
    }
  }

  function buildWhatsAppLink() {
    const fullUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${verificationUrl}`
        : verificationUrl;
    const medsText = prescription.medications.map((m) => m.medicationName).join(", ");
    const text = encodeURIComponent(
      `Hola, te envío tu receta digital de Cóndor Salud.\n\nMedicamentos: ${medsText}\n\nPodés verificarla y descargarla en:\n${fullUrl}`,
    );
    return `https://wa.me/?text=${text}`;
  }

  function buildEmailLink() {
    const fullUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${verificationUrl}`
        : verificationUrl;
    const medsText = prescription.medications.map((m) => m.medicationName).join(", ");
    const subject = encodeURIComponent(`Receta digital — ${prescription.patientName}`);
    const body = encodeURIComponent(
      `Estimado/a ${prescription.patientName},\n\nLe envío su receta digital.\n\nMedicamentos: ${medsText}\n\nVerificar receta: ${fullUrl}\n\nAtte.,\nCóndor Salud`,
    );
    return `mailto:?subject=${subject}&body=${body}`;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white border border-border rounded-2xl p-8 text-center">
        {/* Success icon */}
        <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>

        <h1 className="text-2xl font-display font-bold text-ink mb-2">
          {isDraft ? "Borrador Guardado" : "Receta Emitida Exitosamente"}
        </h1>
        <p className="text-sm text-ink/60 mb-2">
          Receta digital para{" "}
          <span className="font-semibold text-ink">{prescription.patientName}</span> con{" "}
          {prescription.medications.length} medicamento
          {prescription.medications.length !== 1 ? "s" : ""}
        </p>

        {/* ── RCTA Registration Result */}
        {rcta && rcta.status === "registered" && (
          <div className="bg-green-50/50 border border-green-200 rounded-xl p-4 mb-5 text-left">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-green-800">Registrada en RCTA (QBI2)</p>
                <p className="text-[11px] text-ink/60 mt-0.5">
                  Prescripción registrada exitosamente en la red RCTA (ReNaPDiS). Válida en
                  farmacias de la red Farmalink, OSDE y principales prepagas.
                </p>
                {rcta.prescriptionId && (
                  <p className="text-[10px] text-green-700 font-mono mt-1">
                    ID RCTA: {rcta.prescriptionId}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── OSDE Registration Result */}
        {osde && osde.status === "registered" && (
          <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 mb-5 text-left">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-blue-800">Registrada en OSDE (FHIR 4.0)</p>
                <p className="text-[11px] text-ink/60 mt-0.5">
                  Prescripción electrónica registrada en el sistema de OSDE conforme a FHIR HL7 4.0.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── RCTA Pending Credentials Warning */}
        {rcta && rcta.status === "pending_credentials" && (
          <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 mb-5 text-left">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-800">
                  Integración RCTA pendiente de configuración
                </p>
                <p className="text-[11px] text-ink/60 mt-0.5">
                  La receta se generó como PDF. Para registrar en la red RCTA, contactar soporte
                  para configurar las credenciales de Innovamed.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── QR Verification Card */}
        {!isDraft && (
          <div className="bg-surface border border-border rounded-xl p-5 mb-5 text-left">
            <div className="flex items-center gap-2 mb-3">
              <QrCode className="w-5 h-5 text-celeste-dark" />
              <span className="text-sm font-semibold text-ink">Código QR de verificación</span>
            </div>
            <div className="flex items-center gap-2 bg-white border border-border rounded-lg px-3 py-2">
              <code className="text-xs text-ink/70 flex-1 truncate">{verificationUrl}</code>
              <button
                onClick={copyUrl}
                className="p-1.5 hover:bg-surface rounded transition shrink-0"
                title="Copiar URL"
              >
                <Copy className="w-4 h-4 text-ink/50" />
              </button>
              <a
                href={verificationUrl}
                target="_blank"
                rel="noopener"
                className="p-1.5 hover:bg-surface rounded transition shrink-0"
                title="Abrir receta"
              >
                <ExternalLink className="w-4 h-4 text-ink/50" />
              </a>
            </div>
          </div>
        )}

        {/* ── Mi Argentina compliance note */}
        <div className="bg-celeste-pale/50 border border-celeste/20 rounded-xl p-4 mb-5 text-left">
          <div className="flex items-start gap-2">
            <Landmark className="w-4 h-4 text-celeste-dark mt-0.5 shrink-0" />
            <p className="text-[11px] text-ink/60">
              <span className="font-semibold text-celeste-dark">
                Compatible con Receta Electrónica Nacional.
              </span>{" "}
              Verificable en cualquier farmacia del país mediante código QR.
            </p>
          </div>
        </div>

        {/* ── Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {!isDraft && (
            <>
              <a
                href={buildWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1fb855] text-white text-sm font-semibold px-5 py-2.5 rounded-[4px] transition"
              >
                <Send className="w-4 h-4" />
                Enviar por WhatsApp
              </a>
              <a
                href={buildEmailLink()}
                className="inline-flex items-center gap-2 border border-border text-ink/70 hover:text-ink text-sm font-medium px-5 py-2.5 rounded-[4px] transition"
              >
                Enviar por Email
              </a>
            </>
          )}
          <button
            onClick={onNewPrescription}
            className="inline-flex items-center gap-2 bg-celeste-dark hover:bg-celeste-700 text-white text-sm font-semibold px-5 py-2.5 rounded-[4px] transition"
          >
            <Plus className="w-4 h-4" />
            Nueva Receta
          </button>
          <Link
            href="/dashboard/recetas"
            className="inline-flex items-center gap-2 border border-border text-ink/70 hover:text-ink text-sm font-medium px-5 py-2.5 rounded-[4px] transition"
          >
            Ver Historial
          </Link>
        </div>
      </div>
    </div>
  );
}
