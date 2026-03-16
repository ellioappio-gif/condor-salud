import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl font-bold text-celeste-dark mb-2">404</div>
        <h1 className="text-2xl font-bold text-ink mb-2">Página no encontrada</h1>
        <p className="text-sm text-ink-muted mb-8">
          La página que buscás no existe o fue movida. Verificá la URL o volvé al inicio.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/">
            <Button variant="primary">Ir al inicio</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">Ir al dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
