"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "@/lib/i18n/context";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { locale, toggleLocale, t } = useLocale();

  return (
    <>
      {/* Flag stripe */}
      <div className="h-1 flex sticky top-0 z-[100]">
        <div className="flex-1 bg-celeste" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-celeste" />
      </div>

      <nav
        aria-label={t("nav.aria")}
        className="sticky top-1 z-[99] bg-white border-b border-border px-6 lg:px-10 py-4 flex items-center justify-between"
      >
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/condor.png"
            alt="Cóndor Salud"
            width={40}
            height={40}
            className="w-10 h-10 object-contain"
          />
          <div className="font-display font-bold text-xl">
            <span className="text-celeste-dark">CÓNDOR </span>
            <span className="text-gold">SALUD</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {/* Language toggle */}
          <button
            type="button"
            onClick={toggleLocale}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold tracking-wide border border-border rounded-full hover:border-celeste-dark hover:text-celeste-dark transition"
            aria-label={locale === "es" ? "Switch to English" : "Cambiar a Español"}
          >
            <span className={locale === "es" ? "text-celeste-dark" : "text-ink-muted"}>ES</span>
            <span className="text-ink-muted">/</span>
            <span className={locale === "en" ? "text-celeste-dark" : "text-ink-muted"}>EN</span>
          </button>
          <Link
            href="/#problema"
            className="text-[13px] font-medium text-ink-light hover:text-celeste-dark transition"
          >
            {t("nav.problem")}
          </Link>
          <Link
            href="/#producto"
            className="text-[13px] font-medium text-ink-light hover:text-celeste-dark transition"
          >
            {t("nav.product")}
          </Link>
          <Link
            href="/#pricing"
            className="text-[13px] font-medium text-ink-light hover:text-celeste-dark transition"
          >
            {t("nav.pricing")}
          </Link>
          <Link
            href="/planes"
            className="text-[13px] font-medium text-ink-light hover:text-celeste-dark transition"
          >
            {t("nav.plans")}
          </Link>
          <Link
            href="/auth/login"
            className="px-5 py-2 text-xs font-semibold text-celeste-dark border border-celeste-dark hover:bg-celeste-pale rounded-[4px] transition"
          >
            {t("nav.login")}
          </Link>
          <Link
            href="/auth/registro"
            className="px-5 py-2 text-xs font-semibold text-white bg-celeste-dark hover:bg-celeste rounded-[4px] transition"
          >
            {t("nav.try")}
          </Link>
          <Link
            href="/paciente"
            className="px-5 py-2 text-xs font-semibold text-celeste-dark border border-celeste rounded-[4px] hover:bg-celeste-pale transition"
          >
            {t("nav.patient")}
          </Link>
          <Link
            href="/dashboard"
            className="px-5 py-2 text-xs font-semibold text-white bg-celeste hover:bg-celeste-dark rounded-[4px] transition"
          >
            {t("nav.demo")}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2"
          aria-label={t("nav.menuAria")}
          aria-expanded={open ? "true" : "false"}
        >
          <div className="space-y-1.5">
            <span
              className={`block w-6 h-0.5 bg-ink transition-transform ${open ? "rotate-45 translate-y-2" : ""}`}
            />
            <span
              className={`block w-6 h-0.5 bg-ink transition-opacity ${open ? "opacity-0" : ""}`}
            />
            <span
              className={`block w-6 h-0.5 bg-ink transition-transform ${open ? "-rotate-45 -translate-y-2" : ""}`}
            />
          </div>
        </button>

        {/* Mobile menu */}
        {open && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-border p-6 flex flex-col gap-4 md:hidden">
            {/* Mobile language toggle */}
            <button
              type="button"
              onClick={toggleLocale}
              className="self-start flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold tracking-wide border border-border rounded-full hover:border-celeste-dark hover:text-celeste-dark transition"
              aria-label={locale === "es" ? "Switch to English" : "Cambiar a Español"}
            >
              <span className={locale === "es" ? "text-celeste-dark" : "text-ink-muted"}>ES</span>
              <span className="text-ink-muted">/</span>
              <span className={locale === "en" ? "text-celeste-dark" : "text-ink-muted"}>EN</span>
            </button>
            <Link
              href="/#problema"
              onClick={() => setOpen(false)}
              className="text-[13px] font-medium text-ink-light"
            >
              {t("nav.problem")}
            </Link>
            <Link
              href="/#producto"
              onClick={() => setOpen(false)}
              className="text-[13px] font-medium text-ink-light"
            >
              {t("nav.product")}
            </Link>
            <Link
              href="/#pricing"
              onClick={() => setOpen(false)}
              className="text-[13px] font-medium text-ink-light"
            >
              {t("nav.pricing")}
            </Link>
            <Link
              href="/planes"
              onClick={() => setOpen(false)}
              className="text-[13px] font-medium text-ink-light"
            >
              {t("nav.plans")}
            </Link>
            <Link
              href="/#waitlist"
              onClick={() => setOpen(false)}
              className="px-5 py-2 text-xs font-semibold text-white bg-celeste-dark rounded-[4px] text-center"
            >
              {t("nav.joinWaitlist")}
            </Link>
            <Link
              href="/auth/login"
              onClick={() => setOpen(false)}
              className="px-5 py-2 text-xs font-semibold text-celeste-dark border border-celeste-dark rounded-[4px] text-center"
            >
              {t("nav.login")}
            </Link>
            <Link
              href="/paciente"
              onClick={() => setOpen(false)}
              className="px-5 py-2 text-xs font-semibold text-celeste-dark border border-celeste rounded-[4px] text-center"
            >
              {t("nav.patient")}
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="px-5 py-2 text-xs font-semibold text-white bg-celeste rounded-[4px] text-center"
            >
              {t("nav.demo")}
            </Link>
          </div>
        )}
      </nav>
    </>
  );
}
