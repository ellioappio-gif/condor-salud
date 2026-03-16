import Link from "next/link";
import Image from "next/image";

/**
 * Shared layout wrapper for legal pages (Privacidad, Términos).
 * QM-05/QM-06: Extracted to avoid duplicated header/footer markup.
 */
export function LegalHeader() {
  return (
    <header className="border-b border-border">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" aria-label="Ir al inicio">
          <Image
            src="/condor.png"
            alt="Cóndor Salud"
            width={32}
            height={32}
            className="h-8 w-auto object-contain"
          />
          <span className="font-display font-bold text-lg">
            <span className="text-celeste-dark">CÓNDOR </span>
            <span className="text-gold">SALUD</span>
          </span>
        </Link>
        <Link href="/" className="text-xs text-celeste-dark hover:underline">
          Volver al inicio
        </Link>
      </div>
    </header>
  );
}

export function LegalFooter({ links }: { links: { href: string; label: string }[] }) {
  return (
    <footer className="border-t border-border mt-12">
      <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-ink-muted">
        <span>© {new Date().getFullYear()} Cóndor Salud. Todos los derechos reservados.</span>
        <div className="flex gap-4">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-celeste-dark">
              {link.label}
            </Link>
          ))}
          <Link href="/" className="hover:text-celeste-dark">
            Inicio
          </Link>
        </div>
      </div>
    </footer>
  );
}
