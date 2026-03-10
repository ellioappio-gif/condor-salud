export default function Hero() {
  return (
    <section className="px-6 pt-20 pb-16 max-w-[900px] mx-auto text-center">
      <h1 className="text-[clamp(32px,5vw,52px)] font-bold text-ink leading-[1.15] mb-5">
        Todo tu sistema de salud.
        <br />
        <em className="not-italic text-celeste-dark">Una sola vista.</em>
      </h1>
      <p className="text-lg text-ink-light leading-[1.7] max-w-[640px] mx-auto mb-9">
        Conectamos PAMI, obras sociales, prepagas y AFIP en una plataforma unificada.
        Verificá cobertura, facturá automáticamente, y dejá de perder plata por inflación.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href="#waitlist"
          className="px-8 py-3.5 text-sm font-semibold text-white bg-celeste-dark hover:bg-celeste rounded-[4px] transition"
        >
          Quiero acceso anticipado
        </a>
        <a
          href="#producto"
          className="px-8 py-3.5 text-sm font-semibold text-ink-light border-[1.5px] border-border hover:border-celeste-dark hover:text-celeste-dark rounded-[4px] transition"
        >
          Ver el producto
        </a>
      </div>
    </section>
  );
}
