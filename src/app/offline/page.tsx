"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFB] px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#75AADB]/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-[#75AADB]"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 5.636a9 9 0 010 12.728M5.636 5.636a9 9 0 000 12.728M8.464 8.464a5 5 0 010 7.072M15.536 8.464a5 5 0 000 7.072M12 12h.01"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Sin conexión</h1>
        <p className="text-sm text-gray-500 mb-6">
          Parece que no tenés conexión a internet. Algunas funciones podrían no estar disponibles
          hasta que vuelvas a conectarte.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-[#75AADB] text-white font-semibold rounded-lg hover:bg-[#5a8fc0] transition"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
