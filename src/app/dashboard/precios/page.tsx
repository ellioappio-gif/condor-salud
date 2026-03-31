"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  DollarSign,
  Clock,
  Tag,
  Loader2,
  Search,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { useLocale } from "@/lib/i18n/context";
import { ConfirmDialog } from "@/components/ui";

/* ── Types ──────────────────────────────────────────────── */
interface ClinicService {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  currency: string;
  duration_min: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface ServiceForm {
  name: string;
  description: string;
  category: string;
  price: string;
  currency: string;
  duration_min: string;
  active: boolean;
}

const EMPTY_FORM: ServiceForm = {
  name: "",
  description: "",
  category: "consulta",
  price: "",
  currency: "ARS",
  duration_min: "",
  active: true,
};

const CATEGORIES = [
  { value: "consulta", label: "Consulta" },
  { value: "estudio", label: "Estudio / Práctica" },
  { value: "laboratorio", label: "Laboratorio" },
  { value: "cirugia", label: "Cirugía" },
  { value: "internacion", label: "Internación" },
  { value: "rehabilitacion", label: "Rehabilitación" },
  { value: "otro", label: "Otro" },
];

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currency || "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

/* ── Component ──────────────────────────────────────────── */
export default function PreciosPage() {
  const { showToast } = useToast();
  const { locale } = useLocale();

  const [services, setServices] = useState<ClinicService[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);

  // ── Fetch ──────────────────────────────────────────────
  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch("/api/services");
      if (res.ok) {
        const data = await res.json();
        setServices(data.services || []);
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // ── Filter ─────────────────────────────────────────────
  const filtered = services.filter((s) => {
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = categoryFilter === "all" || s.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  // ── Create / Update ────────────────────────────────────
  async function handleSave() {
    if (!form.name.trim()) {
      showToast("El nombre del servicio es obligatorio", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        name: form.name,
        description: form.description,
        category: form.category,
        price: parseFloat(form.price) || 0,
        currency: form.currency,
        duration_min: form.duration_min ? parseInt(form.duration_min) : null,
        active: form.active,
      };

      const res = await fetch("/api/services", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al guardar");
      }

      showToast(editingId ? "Servicio actualizado" : "Servicio creado");
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      fetchServices();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al guardar", "error");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ─────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  async function doDelete(id: string) {
    try {
      const res = await fetch(`/api/services?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error");
      showToast(locale === "en" ? "Service deleted" : "Servicio eliminado");
      fetchServices();
    } catch {
      showToast(locale === "en" ? "Error deleting" : "Error al eliminar", "error");
    }
  }

  // ── Toggle active ──────────────────────────────────────
  async function toggleActive(svc: ClinicService) {
    try {
      const res = await fetch("/api/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: svc.id, active: !svc.active }),
      });
      if (!res.ok) throw new Error("Error");
      setServices((prev) => prev.map((s) => (s.id === svc.id ? { ...s, active: !s.active } : s)));
    } catch {
      showToast("Error al actualizar", "error");
    }
  }

  // ── Edit prefill ───────────────────────────────────────
  function startEdit(svc: ClinicService) {
    setEditingId(svc.id);
    setForm({
      name: svc.name,
      description: svc.description || "",
      category: svc.category,
      price: String(svc.price),
      currency: svc.currency,
      duration_min: svc.duration_min ? String(svc.duration_min) : "",
      active: svc.active,
    });
    setShowForm(true);
  }

  // ── Stats ──────────────────────────────────────────────
  const activeCount = services.filter((s) => s.active).length;
  const categories = Array.from(new Set(services.map((s) => s.category)));
  const avgPrice =
    services.length > 0 ? services.reduce((sum, s) => sum + s.price, 0) / services.length : 0;

  return (
    <div className="space-y-5" data-tour="precios-page">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            {locale === "en" ? "Service Pricing" : "Precios de Servicios"}
          </h1>
          <p className="text-sm text-ink/50 mt-0.5">
            {locale === "en"
              ? "Manage the services and prices offered by your clinic"
              : "Administrá los servicios y precios que ofrece tu clínica"}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setForm(EMPTY_FORM);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-celeste-dark text-white rounded-lg hover:bg-celeste transition"
          data-tour="precios-add"
        >
          <Plus className="w-4 h-4" />
          {locale === "en" ? "Add Service" : "Agregar Servicio"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: locale === "en" ? "Total Services" : "Servicios Totales",
            value: services.length,
            icon: Tag,
          },
          {
            label: locale === "en" ? "Active" : "Activos",
            value: activeCount,
            icon: ToggleRight,
          },
          {
            label: locale === "en" ? "Categories" : "Categorías",
            value: categories.length,
            icon: Tag,
          },
          {
            label: locale === "en" ? "Avg. Price" : "Precio Promedio",
            value: formatPrice(avgPrice, "ARS"),
            icon: DollarSign,
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white border border-border rounded-xl p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-celeste-pale rounded-lg flex items-center justify-center">
              <kpi.icon className="w-5 h-5 text-celeste-dark" />
            </div>
            <div>
              <p className="text-xs text-ink/50">{kpi.label}</p>
              <p className="text-lg font-bold text-ink">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
          <input
            type="text"
            placeholder={locale === "en" ? "Search services..." : "Buscar servicios..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-celeste/40"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-celeste/40"
        >
          <option value="all">{locale === "en" ? "All categories" : "Todas las categorías"}</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Form Modal ── */}
      {showForm && (
        <div className="bg-white border border-celeste/30 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink">
              {editingId
                ? locale === "en"
                  ? "Edit Service"
                  : "Editar Servicio"
                : locale === "en"
                  ? "New Service"
                  : "Nuevo Servicio"}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="p-1 hover:bg-ink/5 rounded"
            >
              <X className="w-4 h-4 text-ink/50" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-ink/60 mb-1">
                {locale === "en" ? "Service Name" : "Nombre del Servicio"} *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Consulta Clínica General"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-celeste/40"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-ink/60 mb-1">
                {locale === "en" ? "Category" : "Categoría"}
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-celeste/40"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-medium text-ink/60 mb-1">
                {locale === "en" ? "Price" : "Precio"} (ARS)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-celeste/40"
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-medium text-ink/60 mb-1">
                {locale === "en" ? "Duration (min)" : "Duración (min)"}
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                <input
                  type="number"
                  min="0"
                  value={form.duration_min}
                  onChange={(e) => setForm({ ...form, duration_min: e.target.value })}
                  placeholder="30"
                  className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-celeste/40"
                />
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-ink/60 mb-1">
                {locale === "en" ? "Description" : "Descripción"}
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder={
                  locale === "en"
                    ? "Optional description..."
                    : "Descripción opcional del servicio..."
                }
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-celeste/40 resize-none"
              />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setForm({ ...form, active: !form.active })}
              className={`relative w-10 h-5 rounded-full transition ${form.active ? "bg-celeste-dark" : "bg-ink/20"}`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.active ? "left-5" : "left-0.5"}`}
              />
            </button>
            <span className="text-sm text-ink/70">
              {form.active
                ? locale === "en"
                  ? "Active"
                  : "Activo"
                : locale === "en"
                  ? "Inactive"
                  : "Inactivo"}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-celeste-dark text-white rounded-lg hover:bg-celeste transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {locale === "en" ? "Save" : "Guardar"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="px-4 py-2 text-sm font-medium text-ink/60 hover:text-ink transition"
            >
              {locale === "en" ? "Cancel" : "Cancelar"}
            </button>
          </div>
        </div>
      )}

      {/* ── Services Table ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-celeste-dark" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-border">
          <DollarSign className="w-12 h-12 text-ink/15 mx-auto mb-3" />
          <p className="font-semibold text-ink">
            {services.length === 0
              ? locale === "en"
                ? "No services yet"
                : "Sin servicios"
              : locale === "en"
                ? "No services match your search"
                : "No hay servicios que coincidan"}
          </p>
          <p className="text-sm text-ink/50 mt-1">
            {services.length === 0
              ? locale === "en"
                ? "Add your first service to get started"
                : "Agregá tu primer servicio para comenzar"
              : locale === "en"
                ? "Try a different search or filter"
                : "Probá con otra búsqueda o filtro"}
          </p>
          {services.length === 0 && (
            <button
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY_FORM);
                setShowForm(true);
              }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-celeste-dark text-white rounded-lg hover:bg-celeste transition"
            >
              <Plus className="w-4 h-4" />
              {locale === "en" ? "Add Service" : "Agregar Servicio"}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Lista de precios">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <th className="text-left px-4 py-3 font-medium text-ink/60">
                    {locale === "en" ? "Service" : "Servicio"}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-ink/60">
                    {locale === "en" ? "Category" : "Categoría"}
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-ink/60">
                    {locale === "en" ? "Price" : "Precio"}
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-ink/60">
                    {locale === "en" ? "Duration" : "Duración"}
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-ink/60">
                    {locale === "en" ? "Status" : "Estado"}
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-ink/60">
                    {locale === "en" ? "Actions" : "Acciones"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((svc) => {
                  const catLabel =
                    CATEGORIES.find((c) => c.value === svc.category)?.label || svc.category;
                  return (
                    <tr
                      key={svc.id}
                      className="border-b border-border/50 last:border-0 hover:bg-surface/30 transition"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{svc.name}</p>
                        {svc.description && (
                          <p className="text-xs text-ink/50 mt-0.5 line-clamp-1">
                            {svc.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-celeste-pale text-celeste-dark">
                          {catLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-ink">
                        {formatPrice(svc.price, svc.currency)}
                      </td>
                      <td className="px-4 py-3 text-center text-ink/60">
                        {svc.duration_min ? `${svc.duration_min} min` : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleActive(svc)}
                          className="inline-flex items-center gap-1"
                          title={svc.active ? "Desactivar" : "Activar"}
                        >
                          {svc.active ? (
                            <ToggleRight className="w-5 h-5 text-green-600" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-ink/30" />
                          )}
                          <span
                            className={`text-xs ${svc.active ? "text-green-700" : "text-ink/40"}`}
                          >
                            {svc.active
                              ? locale === "en"
                                ? "Active"
                                : "Activo"
                              : locale === "en"
                                ? "Inactive"
                                : "Inactivo"}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startEdit(svc)}
                            className="p-1.5 hover:bg-celeste-pale rounded transition text-celeste-dark"
                            title={locale === "en" ? "Edit" : "Editar"}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(svc.id)}
                            className="p-1.5 hover:bg-red-50 rounded transition text-red-500"
                            title={locale === "en" ? "Delete" : "Eliminar"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer note */}
      <p className="text-xs text-ink/40 text-center">
        {locale === "en"
          ? "Prices in ARS. Monthly IPC adjustment."
          : "Precios en pesos argentinos. Ajuste mensual IPC."}
      </p>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) doDelete(deleteTarget);
          setDeleteTarget(null);
        }}
        title={locale === "en" ? "Delete service" : "Eliminar servicio"}
        message={
          locale === "en"
            ? "Delete this service? This action cannot be undone."
            : "\u00bfEliminar este servicio? Esta acci\u00f3n no se puede deshacer."
        }
        variant="danger"
      />
    </div>
  );
}
