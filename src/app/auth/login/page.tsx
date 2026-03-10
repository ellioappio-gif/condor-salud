import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFB] flex">
      {/* Left - Brand panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-ink text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <Link href="/">
              <Image src="/logos/condor.png" alt="Cóndor Salud" width={40} height={40} className="rounded-full" />
            </Link>
            <Link href="/" className="leading-none">
              <span className="text-[13px] font-bold tracking-[0.5px]">CÓNDOR</span>
              <br />
              <span className="text-[9px] font-medium tracking-[4px] text-celeste-light">S A L U D</span>
            </Link>
          </div>
          <h1 className="text-3xl font-bold leading-tight mb-4">
            Inteligencia financiera para<br />
            la <em className="text-celeste not-italic">salud argentina</em>
          </h1>
          <p className="text-base text-white/60 leading-relaxed max-w-md">
            Automatizá facturación, eliminá rechazos y protegé tus ingresos contra la inflación. Todo en una sola plataforma.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-6">
          {[
            { stat: "-62%", label: "Rechazos" },
            { stat: "45 días", label: "Cobro más rápido" },
            { stat: "$2.4M", label: "Recupero promedio" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-celeste">{s.stat}</p>
              <p className="text-xs text-white/50 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right - Login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
            <Image src="/logos/condor.png" alt="Cóndor Salud" width={36} height={36} className="rounded-full" />
            <div className="leading-none">
              <span className="text-[12px] font-bold tracking-[0.5px] text-ink">CÓNDOR</span>
              <br />
              <span className="text-[8px] font-medium tracking-[4px] text-celeste-dark">S A L U D</span>
            </div>
          </Link>

          <h2 className="text-2xl font-bold text-ink mb-1">Iniciar sesión</h2>
          <p className="text-sm text-ink-muted mb-8">Ingresá a tu cuenta para acceder al panel</p>

          <form className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-ink-light uppercase tracking-wider block mb-1.5">Email</label>
              <input type="email" placeholder="tu@clinica.com" defaultValue="m.rodriguez@centrosanmartin.com"
                className="w-full px-4 py-3 text-sm border border-border rounded-[4px] outline-none focus:border-celeste-dark transition" style={{ fontFamily: "inherit" }} />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-light uppercase tracking-wider block mb-1.5">Contraseña</label>
              <input type="password" placeholder="••••••••" defaultValue="password123"
                className="w-full px-4 py-3 text-sm border border-border rounded-[4px] outline-none focus:border-celeste-dark transition" style={{ fontFamily: "inherit" }} />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border text-celeste-dark" />
                <span className="text-xs text-ink-light">Recordarme</span>
              </label>
              <button type="button" className="text-xs text-celeste-dark font-medium hover:underline">¿Olvidaste tu contraseña?</button>
            </div>
            <Link href="/dashboard" className="block w-full py-3 text-sm font-semibold text-center bg-celeste-dark text-white rounded-[4px] hover:bg-celeste transition">
              Ingresar
            </Link>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-xs text-ink-muted">
              ¿No tenés cuenta? <Link href="/auth/registro" className="text-celeste-dark font-semibold hover:underline">Registrate gratis</Link>
            </p>
          </div>

          <div className="mt-8 text-center">
            <Link href="/" className="text-[10px] text-ink-muted hover:text-celeste-dark transition">← Volver al sitio</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
