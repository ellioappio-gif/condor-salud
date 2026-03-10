import Link from "next/link";
import Image from "next/image";

export default function RegistroPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFB] flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-ink text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <Image src="/logos/condor.png" alt="Cóndor Salud" width={40} height={40} className="rounded-full" />
            <div className="leading-none">
              <span className="text-[13px] font-bold tracking-[0.5px]">CÓNDOR</span>
              <br />
              <span className="text-[9px] font-medium tracking-[4px] text-celeste-light">S A L U D</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold leading-tight mb-4">
            Empezá a proteger tus<br />
            <em className="text-gold not-italic">ingresos hoy</em>
          </h1>
          <p className="text-base text-white/60 leading-relaxed max-w-md">
            Más de 120 clínicas en Argentina ya usan Cóndor Salud para automatizar su facturación y reducir rechazos.
          </p>
        </div>
        <div className="relative z-10">
          <div className="bg-white/5 border border-white/10 rounded-lg p-5">
            <p className="text-sm text-white/80 italic leading-relaxed">&ldquo;Desde que implementamos Cóndor, redujimos los rechazos de PAMI un 62% y cobramos 45 días antes. Es otra clínica.&rdquo;</p>
            <p className="text-xs text-white/40 mt-3">— Dra. Fernández, Centro Médico Palermo</p>
          </div>
        </div>
      </div>

      {/* Right - Registration form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[440px]">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Image src="/logos/condor.png" alt="Cóndor Salud" width={36} height={36} className="rounded-full" />
            <div className="leading-none">
              <span className="text-[12px] font-bold tracking-[0.5px] text-ink">CÓNDOR</span>
              <br />
              <span className="text-[8px] font-medium tracking-[4px] text-celeste-dark">S A L U D</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-ink mb-1">Crear cuenta</h2>
          <p className="text-sm text-ink-muted mb-6">Probá Cóndor Salud gratis por 14 días. Sin tarjeta.</p>

          <form className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-ink-light uppercase tracking-wider block mb-1">Nombre</label>
                <input type="text" placeholder="Martín" className="w-full px-3 py-2.5 text-sm border border-border rounded-[4px] outline-none focus:border-celeste-dark transition" style={{ fontFamily: "inherit" }} />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-ink-light uppercase tracking-wider block mb-1">Apellido</label>
                <input type="text" placeholder="Rodríguez" className="w-full px-3 py-2.5 text-sm border border-border rounded-[4px] outline-none focus:border-celeste-dark transition" style={{ fontFamily: "inherit" }} />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-ink-light uppercase tracking-wider block mb-1">Email profesional</label>
              <input type="email" placeholder="tu@clinica.com" className="w-full px-3 py-2.5 text-sm border border-border rounded-[4px] outline-none focus:border-celeste-dark transition" style={{ fontFamily: "inherit" }} />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-ink-light uppercase tracking-wider block mb-1">Nombre de la clínica</label>
              <input type="text" placeholder="Centro Médico San Martín" className="w-full px-3 py-2.5 text-sm border border-border rounded-[4px] outline-none focus:border-celeste-dark transition" style={{ fontFamily: "inherit" }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-ink-light uppercase tracking-wider block mb-1">CUIT</label>
                <input type="text" placeholder="30-12345678-9" className="w-full px-3 py-2.5 text-sm border border-border rounded-[4px] outline-none focus:border-celeste-dark transition font-mono" style={{ fontFamily: "inherit" }} />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-ink-light uppercase tracking-wider block mb-1">Provincia</label>
                <select className="w-full px-3 py-2.5 text-sm border border-border rounded-[4px] outline-none focus:border-celeste-dark transition bg-white text-ink" style={{ fontFamily: "inherit" }}>
                  <option value="">Seleccionar</option>
                  <option>CABA</option>
                  <option>Buenos Aires</option>
                  <option>Córdoba</option>
                  <option>Santa Fe</option>
                  <option>Mendoza</option>
                  <option>Tucumán</option>
                  <option>Otra</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-ink-light uppercase tracking-wider block mb-1">Contraseña</label>
              <input type="password" placeholder="Mínimo 8 caracteres" className="w-full px-3 py-2.5 text-sm border border-border rounded-[4px] outline-none focus:border-celeste-dark transition" style={{ fontFamily: "inherit" }} />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-ink-light uppercase tracking-wider block mb-1">Financiadores principales</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {["PAMI", "OSDE", "Swiss Medical", "Galeno", "Medifé", "IOMA", "Sancor Salud", "Otro"].map((f) => (
                  <label key={f} className="flex items-center gap-1.5 px-2.5 py-1.5 border border-border rounded-[4px] text-xs text-ink-light hover:border-celeste-dark cursor-pointer transition">
                    <input type="checkbox" className="w-3.5 h-3.5 rounded border-border text-celeste-dark" />
                    {f}
                  </label>
                ))}
              </div>
            </div>
            <div className="pt-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-border text-celeste-dark mt-0.5" />
                <span className="text-[10px] text-ink-muted leading-relaxed">Acepto los <button type="button" className="text-celeste-dark underline">Términos de Servicio</button> y la <button type="button" className="text-celeste-dark underline">Política de Privacidad</button></span>
              </label>
            </div>
            <Link href="/dashboard" className="block w-full py-3 text-sm font-semibold text-center bg-celeste-dark text-white rounded-[4px] hover:bg-celeste transition mt-2">
              Crear cuenta gratis
            </Link>
          </form>

          <div className="mt-5 pt-5 border-t border-border text-center">
            <p className="text-xs text-ink-muted">
              ¿Ya tenés cuenta? <Link href="/auth/login" className="text-celeste-dark font-semibold hover:underline">Iniciá sesión</Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-[10px] text-ink-muted hover:text-celeste-dark transition">← Volver al sitio</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
