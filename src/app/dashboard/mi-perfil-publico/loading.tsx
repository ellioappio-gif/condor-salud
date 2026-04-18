export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-ink-50 rounded w-48" />
      <div className="h-4 bg-ink-50 rounded w-72" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-ink-50 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-ink-50 rounded-xl mt-4" />
    </div>
  );
}
