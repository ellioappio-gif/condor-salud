"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Heart,
  Droplets,
  Weight,
  Thermometer,
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  Calendar,
  Trash2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  defaultUnit: string;
  minValue?: number;
  maxValue?: number;
}

interface TrackerItem {
  id: string;
  categoryId: string;
  value: number;
  unit?: string;
  notes?: string;
  measuredAt: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
}

interface Stats {
  avg: number;
  min: number;
  max: number;
  count: number;
}

// ─── Icon Map ────────────────────────────────────────────────

const iconMap: Record<string, React.ElementType> = {
  heart: Heart,
  droplets: Droplets,
  weight: Weight,
  thermometer: Thermometer,
  activity: Activity,
};

function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name] || Activity;
  return <Icon className={className} />;
}

// ─── Demo Data ───────────────────────────────────────────────

const DEMO_CATEGORIES: Category[] = [
  {
    id: "c1",
    name: "Glucosa",
    slug: "glucosa",
    icon: "droplets",
    color: "#4A7FAF",
    defaultUnit: "mg/dL",
    minValue: 70,
    maxValue: 180,
  },
  {
    id: "c2",
    name: "Presión Arterial",
    slug: "presion-arterial",
    icon: "heart",
    color: "#E74C3C",
    defaultUnit: "mmHg",
  },
  { id: "c3", name: "Peso", slug: "peso", icon: "weight", color: "#27AE60", defaultUnit: "kg" },
  {
    id: "c4",
    name: "Temperatura",
    slug: "temperatura",
    icon: "thermometer",
    color: "#F39C12",
    defaultUnit: "°C",
    minValue: 35,
    maxValue: 42,
  },
  {
    id: "c5",
    name: "Frecuencia Cardíaca",
    slug: "frecuencia-cardiaca",
    icon: "activity",
    color: "#9B59B6",
    defaultUnit: "bpm",
    minValue: 40,
    maxValue: 200,
  },
];

const DEMO_TIMELINE: TrackerItem[] = [
  {
    id: "t1",
    categoryId: "c1",
    value: 110,
    unit: "mg/dL",
    notes: "En ayunas",
    measuredAt: new Date(Date.now() - 3600000).toISOString(),
    categoryName: "Glucosa",
    categoryIcon: "droplets",
    categoryColor: "#4A7FAF",
  },
  {
    id: "t2",
    categoryId: "c3",
    value: 78.5,
    unit: "kg",
    measuredAt: new Date(Date.now() - 86400000).toISOString(),
    categoryName: "Peso",
    categoryIcon: "weight",
    categoryColor: "#27AE60",
  },
  {
    id: "t3",
    categoryId: "c2",
    value: 120,
    unit: "mmHg",
    notes: "Sistólica",
    measuredAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    categoryName: "Presión Arterial",
    categoryIcon: "heart",
    categoryColor: "#E74C3C",
  },
  {
    id: "t4",
    categoryId: "c1",
    value: 95,
    unit: "mg/dL",
    notes: "Post-prandial 2h",
    measuredAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    categoryName: "Glucosa",
    categoryIcon: "droplets",
    categoryColor: "#4A7FAF",
  },
  {
    id: "t5",
    categoryId: "c5",
    value: 72,
    unit: "bpm",
    notes: "En reposo",
    measuredAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    categoryName: "Frecuencia Cardíaca",
    categoryIcon: "activity",
    categoryColor: "#9B59B6",
  },
];

// ─── Main Component ──────────────────────────────────────────

export default function SaludPage() {
  const [categories, setCategories] = useState<Category[]>(DEMO_CATEGORIES);
  const [timeline, setTimeline] = useState<TrackerItem[]>(DEMO_TIMELINE);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formValue, setFormValue] = useState("");
  const [formUnit, setFormUnit] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/health-tracker?${selectedCategory ? `categoryId=${selectedCategory}` : ""}`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data.categories?.length > 0) setCategories(data.categories);
        if (data.timeline) setTimeline(data.timeline);
      }
    } catch {
      // Use demo data
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load stats when category selected
  useEffect(() => {
    if (!selectedCategory) {
      setStats(null);
      return;
    }

    async function loadStats() {
      try {
        const res = await fetch(
          `/api/health-tracker?action=stats&categoryId=${selectedCategory}&days=30`,
        );
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        }
      } catch {
        // Skip
      }
    }
    loadStats();
  }, [selectedCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCategoryId || !formValue) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/health-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: formCategoryId,
          value: parseFloat(formValue),
          unit: formUnit || undefined,
          notes: formNotes || undefined,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setFormValue("");
        setFormNotes("");
        await loadData();
      }
    } catch {
      alert("Error al registrar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("¿Eliminar este registro?")) return;
    try {
      await fetch(`/api/health-tracker?id=${itemId}`, { method: "DELETE" });
      await loadData();
    } catch {
      // Skip
    }
  };

  const selectedCat = categories.find((c) => c.id === selectedCategory);

  return (
    <main className="max-w-3xl mx-auto px-4 py-8" role="main" aria-label="Seguimiento de Salud">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            <Activity className="w-6 h-6 text-celeste" />
            Mi Salud
          </h1>
          <p className="text-sm text-gray-500 mt-1">Registrá y seguí tus mediciones de salud</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-celeste text-white font-bold px-4 py-2.5 rounded-xl hover:bg-celeste-dark transition"
        >
          <Plus className="w-5 h-5" />
          Registrar
        </button>
      </div>

      {/* Category Filter Pills */}
      <nav
        className="flex gap-2 overflow-x-auto pb-3 mb-6 -mx-1 px-1"
        aria-label="Filtrar por categoría"
      >
        <button
          onClick={() => setSelectedCategory(null)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition ${
            !selectedCategory
              ? "bg-celeste text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition ${
              cat.id === selectedCategory
                ? "text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={cat.id === selectedCategory ? { backgroundColor: cat.color } : undefined}
          >
            <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
            {cat.name}
          </button>
        ))}
      </nav>

      {/* Stats Card */}
      {stats && selectedCat && (
        <div
          className="rounded-xl p-5 mb-6 text-white"
          style={{ backgroundColor: selectedCat.color }}
        >
          <h3 className="text-sm font-medium opacity-80 mb-3">
            {selectedCat.name} · Últimos 30 días
          </h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-2xl font-bold">{stats.avg}</p>
              <p className="text-xs opacity-70">Promedio</p>
            </div>
            <div>
              <p className="text-2xl font-bold flex items-center gap-1">
                {stats.min}
                <TrendingDown className="w-4 h-4 opacity-60" />
              </p>
              <p className="text-xs opacity-70">Mínimo</p>
            </div>
            <div>
              <p className="text-2xl font-bold flex items-center gap-1">
                {stats.max}
                <TrendingUp className="w-4 h-4 opacity-60" />
              </p>
              <p className="text-xs opacity-70">Máximo</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.count}</p>
              <p className="text-xs opacity-70">Registros</p>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-celeste" />
        </div>
      ) : timeline.length > 0 ? (
        <div className="space-y-3">
          {timeline.map((item) => {
            const cat = categories.find((c) => c.id === item.categoryId);
            const color = item.categoryColor || cat?.color || "#75AADB";
            const icon = item.categoryIcon || cat?.icon || "activity";
            const name = item.categoryName || cat?.name || "Medición";

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 group"
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <CategoryIcon name={icon} className="w-5 h-5" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-ink">{item.value}</span>
                    <span className="text-sm text-gray-400">{item.unit || cat?.defaultUnit}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {name}
                    {item.notes && <span className="text-gray-400"> · {item.notes}</span>}
                  </p>
                </div>

                {/* Date */}
                <div className="text-right text-xs text-gray-400 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.measuredAt).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                  <p>
                    {new Date(item.measuredAt).toLocaleTimeString("es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Sin registros todavía</p>
          <p className="text-gray-400 text-sm mt-1">Empezá a registrar tus mediciones de salud</p>
        </div>
      )}

      {/* Record Measurement Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-ink">Nueva Medición</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setFormCategoryId(cat.id);
                        setFormUnit(cat.defaultUnit);
                      }}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-sm text-left transition ${
                        formCategoryId === cat.id
                          ? "border-celeste bg-celeste/5 text-celeste-dark font-medium"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <CategoryIcon name={cat.icon} className="w-4 h-4" />
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Value + Unit */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2.5 border rounded-lg text-lg font-bold text-center focus:ring-2 focus:ring-celeste/50"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2.5 border rounded-lg text-center"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ej: En ayunas, post-ejercicio..."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !formCategoryId || !formValue}
                className="w-full bg-celeste text-white font-bold py-3 rounded-xl hover:bg-celeste-dark transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                Registrar Medición
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
