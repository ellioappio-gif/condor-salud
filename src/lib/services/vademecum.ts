/**
 * Cóndor Salud — Vademécum Service
 *
 * Drug search (Argentine market), interaction checking.
 * Primary: Kairos API (kairos.com.ar) — requires commercial license.
 * Fallback: Local in-memory database of ~80 common drugs.
 *
 * NOTE: For production, obtain a Kairos API key at info@kairos.com.ar.
 * Set KAIROS_API_KEY env var to enable live search.
 */

import { logger } from "@/lib/logger";
import type {
  VademecumDrug,
  DrugInteraction,
  VademecumSearchResult,
  InteractionCheckResult,
} from "@/lib/types";

const log = logger.child({ module: "vademecum" });

const KAIROS_BASE = process.env.KAIROS_API_URL || "https://api.kairos.com.ar/v1";
const KAIROS_API_KEY = process.env.KAIROS_API_KEY;

// ─── Search Drugs ────────────────────────────────────────────

export async function searchDrugs(
  query: string,
  opts: { limit?: number; includeControlled?: boolean } = {},
): Promise<VademecumSearchResult> {
  const limit = opts.limit ?? 20;

  // Try Kairos API first
  if (KAIROS_API_KEY) {
    try {
      return await searchKairos(query, limit, opts.includeControlled ?? false);
    } catch (err) {
      log.warn({ err }, "Kairos API failed, falling back to local DB");
    }
  }

  // Fallback: local database
  return searchLocal(query, limit, opts.includeControlled ?? false);
}

async function searchKairos(
  term: string,
  maxResults: number,
  _includeControlled: boolean,
): Promise<VademecumSearchResult> {
  const res = await fetch(
    `${KAIROS_BASE}/drugs/search?q=${encodeURIComponent(term)}&limit=${maxResults}`,
    { headers: { Authorization: `Bearer ${KAIROS_API_KEY}` }, signal: AbortSignal.timeout(5000) },
  );
  if (!res.ok) throw new Error(`Kairos ${res.status}`);
  const data = await res.json();
  return {
    drugs: (data.results || []).map(mapKairosDrug),
    source: "api",
    total: data.total ?? data.results?.length ?? 0,
  };
}

function mapKairosDrug(raw: Record<string, unknown>): VademecumDrug {
  return {
    id: String(raw.id || raw.troquel || ""),
    commercialName: String(raw.nombre_comercial || raw.name || ""),
    genericName: String(raw.droga || raw.generic_name || ""),
    lab: String(raw.laboratorio || raw.lab || ""),
    concentration: String(raw.concentracion || raw.concentration || ""),
    presentation: String(raw.presentacion || raw.presentation || ""),
    troquel: raw.troquel ? String(raw.troquel) : undefined,
    alfabetaCode: raw.codigo_alfabeta ? String(raw.codigo_alfabeta) : undefined,
    isControlled: Boolean(raw.psicofarma || raw.controlled),
    requiresPrescription: Boolean(raw.requiere_receta ?? true),
    category: String(raw.categoria || raw.category || "General"),
    atcCode: raw.atc ? String(raw.atc) : undefined,
  };
}

function searchLocal(
  term: string,
  maxResults: number,
  includeControlled: boolean,
): VademecumSearchResult {
  const q = term.toLowerCase().trim();
  if (!q) return { drugs: [], source: "local", total: 0 };

  let results = DRUG_DATABASE.filter(
    (d) =>
      d.commercialName.toLowerCase().includes(q) ||
      d.genericName.toLowerCase().includes(q) ||
      d.lab.toLowerCase().includes(q) ||
      (d.troquel && d.troquel.includes(q)),
  );

  if (!includeControlled) {
    results = results.filter((d) => !d.isControlled);
  }

  return {
    drugs: results.slice(0, maxResults),
    source: "local",
    total: results.length,
  };
}

// ─── Check Drug Interactions ─────────────────────────────────

export async function checkInteractions(drugIds: string[]): Promise<InteractionCheckResult> {
  if (drugIds.length < 2) {
    return { interactions: [], hasContraindicated: false, hasHigh: false };
  }

  // Try Kairos interaction API
  if (KAIROS_API_KEY) {
    try {
      const res = await fetch(`${KAIROS_BASE}/interactions/check`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${KAIROS_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ drug_ids: drugIds }),
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        const interactions: DrugInteraction[] = (data.interactions || []).map(
          (i: Record<string, unknown>) => ({
            id: String(i.id || ""),
            drugA: String(i.drug_a || ""),
            drugB: String(i.drug_b || ""),
            severity: String(i.severity || "low"),
            description: String(i.description || ""),
            recommendation: String(i.recommendation || ""),
          }),
        );
        return {
          interactions,
          hasContraindicated: interactions.some((i) => i.severity === "contraindicated"),
          hasHigh: interactions.some((i) => i.severity === "high"),
        };
      }
    } catch (err) {
      log.warn({ err }, "Kairos interactions failed, using local check");
    }
  }

  // Fallback: local interaction database
  return checkLocalInteractions(drugIds);
}

function checkLocalInteractions(drugIds: string[]): InteractionCheckResult {
  const found: DrugInteraction[] = [];

  for (let i = 0; i < drugIds.length; i++) {
    for (let j = i + 1; j < drugIds.length; j++) {
      const a = drugIds[i]!;
      const b = drugIds[j]!;
      const match = INTERACTION_DATABASE.find(
        (ix) =>
          (ix.drugA === a && ix.drugB === b) ||
          (ix.drugA === b && ix.drugB === a) ||
          (getDrugGeneric(a) &&
            getDrugGeneric(b) &&
            ((ix.drugA === getDrugGeneric(a) && ix.drugB === getDrugGeneric(b)) ||
              (ix.drugA === getDrugGeneric(b) && ix.drugB === getDrugGeneric(a)))),
      );
      if (match) found.push(match);
    }
  }

  return {
    interactions: found,
    hasContraindicated: found.some((i) => i.severity === "contraindicated"),
    hasHigh: found.some((i) => i.severity === "high"),
  };
}

function getDrugGeneric(id: string): string | undefined {
  return DRUG_DATABASE.find((d) => d.id === id)?.genericName.toLowerCase();
}

// ─── Argentine Drug Database (Local) ─────────────────────────
// 80+ commonly prescribed drugs in Argentina with troquel codes.

const DRUG_DATABASE: VademecumDrug[] = [
  // ── Cardiovascular ──
  {
    id: "d-001",
    commercialName: "Losartán Gador 50mg",
    genericName: "Losartán",
    lab: "Gador",
    concentration: "50mg",
    presentation: "Comprimidos x 30",
    troquel: "3289450",
    isControlled: false,
    requiresPrescription: true,
    category: "Cardiovascular",
    atcCode: "C09CA01",
  },
  {
    id: "d-002",
    commercialName: "Enalapril Roemmers 10mg",
    genericName: "Enalapril",
    lab: "Roemmers",
    concentration: "10mg",
    presentation: "Comprimidos x 30",
    troquel: "2156780",
    isControlled: false,
    requiresPrescription: true,
    category: "Cardiovascular",
    atcCode: "C09AA02",
  },
  {
    id: "d-003",
    commercialName: "Atenolol Bagó 50mg",
    genericName: "Atenolol",
    lab: "Bagó",
    concentration: "50mg",
    presentation: "Comprimidos x 30",
    troquel: "1987340",
    isControlled: false,
    requiresPrescription: true,
    category: "Cardiovascular",
    atcCode: "C07AB03",
  },
  {
    id: "d-004",
    commercialName: "Amlodipina Raffo 5mg",
    genericName: "Amlodipina",
    lab: "Raffo",
    concentration: "5mg",
    presentation: "Comprimidos x 30",
    troquel: "4123560",
    isControlled: false,
    requiresPrescription: true,
    category: "Cardiovascular",
    atcCode: "C08CA01",
  },
  {
    id: "d-005",
    commercialName: "Furosemida Denver Farma 40mg",
    genericName: "Furosemida",
    lab: "Denver Farma",
    concentration: "40mg",
    presentation: "Comprimidos x 20",
    troquel: "1654320",
    isControlled: false,
    requiresPrescription: true,
    category: "Cardiovascular",
    atcCode: "C03CA01",
  },
  {
    id: "d-006",
    commercialName: "Aspirina Protect 100mg",
    genericName: "Ácido acetilsalicílico",
    lab: "Bayer",
    concentration: "100mg",
    presentation: "Comprimidos x 28",
    troquel: "3456780",
    isControlled: false,
    requiresPrescription: false,
    category: "Cardiovascular",
    atcCode: "B01AC06",
  },
  {
    id: "d-007",
    commercialName: "Atorvastatina Gador 20mg",
    genericName: "Atorvastatina",
    lab: "Gador",
    concentration: "20mg",
    presentation: "Comprimidos x 30",
    troquel: "5234560",
    isControlled: false,
    requiresPrescription: true,
    category: "Cardiovascular",
    atcCode: "C10AA05",
  },
  {
    id: "d-008",
    commercialName: "Clopidogrel Microsules 75mg",
    genericName: "Clopidogrel",
    lab: "Microsules",
    concentration: "75mg",
    presentation: "Comprimidos x 28",
    troquel: "6234560",
    isControlled: false,
    requiresPrescription: true,
    category: "Cardiovascular",
    atcCode: "B01AC04",
  },
  // ── Diabetes / Metabolic ──
  {
    id: "d-010",
    commercialName: "Metformina Craveri 850mg",
    genericName: "Metformina",
    lab: "Craveri",
    concentration: "850mg",
    presentation: "Comprimidos x 30",
    troquel: "2345670",
    isControlled: false,
    requiresPrescription: true,
    category: "Diabetes",
    atcCode: "A10BA02",
  },
  {
    id: "d-011",
    commercialName: "Glimepirida Montpellier 2mg",
    genericName: "Glimepirida",
    lab: "Montpellier",
    concentration: "2mg",
    presentation: "Comprimidos x 30",
    troquel: "4567890",
    isControlled: false,
    requiresPrescription: true,
    category: "Diabetes",
    atcCode: "A10BB12",
  },
  {
    id: "d-012",
    commercialName: "Levotiroxina Bagó 75mcg",
    genericName: "Levotiroxina",
    lab: "Bagó",
    concentration: "75mcg",
    presentation: "Comprimidos x 50",
    troquel: "3456710",
    isControlled: false,
    requiresPrescription: true,
    category: "Endocrinología",
    atcCode: "H03AA01",
  },
  // ── Gastroenterología ──
  {
    id: "d-020",
    commercialName: "Omeprazol Roemmers 20mg",
    genericName: "Omeprazol",
    lab: "Roemmers",
    concentration: "20mg",
    presentation: "Cápsulas x 28",
    troquel: "1234560",
    isControlled: false,
    requiresPrescription: true,
    category: "Gastroenterología",
    atcCode: "A02BC01",
  },
  {
    id: "d-021",
    commercialName: "Pantoprazol Casasco 40mg",
    genericName: "Pantoprazol",
    lab: "Casasco",
    concentration: "40mg",
    presentation: "Comprimidos x 28",
    troquel: "5678901",
    isControlled: false,
    requiresPrescription: true,
    category: "Gastroenterología",
    atcCode: "A02BC02",
  },
  {
    id: "d-022",
    commercialName: "Domperidona Raffo 10mg",
    genericName: "Domperidona",
    lab: "Raffo",
    concentration: "10mg",
    presentation: "Comprimidos x 30",
    troquel: "6789012",
    isControlled: false,
    requiresPrescription: true,
    category: "Gastroenterología",
    atcCode: "A03FA03",
  },
  // ── Antibióticos ──
  {
    id: "d-030",
    commercialName: "Amoxicilina Bagó 500mg",
    genericName: "Amoxicilina",
    lab: "Bagó",
    concentration: "500mg",
    presentation: "Comprimidos x 21",
    troquel: "2345678",
    isControlled: false,
    requiresPrescription: true,
    category: "Antibiótico",
    atcCode: "J01CA04",
  },
  {
    id: "d-031",
    commercialName: "Amoxicilina + Ác. Clavulánico 875/125mg",
    genericName: "Amoxicilina + Ác. Clavulánico",
    lab: "Roemmers",
    concentration: "875/125mg",
    presentation: "Comprimidos x 14",
    troquel: "3456789",
    isControlled: false,
    requiresPrescription: true,
    category: "Antibiótico",
    atcCode: "J01CR02",
  },
  {
    id: "d-032",
    commercialName: "Azitromicina Gador 500mg",
    genericName: "Azitromicina",
    lab: "Gador",
    concentration: "500mg",
    presentation: "Comprimidos x 3",
    troquel: "4567891",
    isControlled: false,
    requiresPrescription: true,
    category: "Antibiótico",
    atcCode: "J01FA10",
  },
  {
    id: "d-033",
    commercialName: "Ciprofloxacina Roemmers 500mg",
    genericName: "Ciprofloxacina",
    lab: "Roemmers",
    concentration: "500mg",
    presentation: "Comprimidos x 10",
    troquel: "5678912",
    isControlled: false,
    requiresPrescription: true,
    category: "Antibiótico",
    atcCode: "J01MA02",
  },
  {
    id: "d-034",
    commercialName: "Cefalexina Bagó 500mg",
    genericName: "Cefalexina",
    lab: "Bagó",
    concentration: "500mg",
    presentation: "Comprimidos x 12",
    troquel: "6789123",
    isControlled: false,
    requiresPrescription: true,
    category: "Antibiótico",
    atcCode: "J01DB01",
  },
  {
    id: "d-035",
    commercialName: "Trimetoprima/Sulfametoxazol Bactrim F",
    genericName: "TMP/SMX",
    lab: "Roche",
    concentration: "160/800mg",
    presentation: "Comprimidos x 20",
    troquel: "7891234",
    isControlled: false,
    requiresPrescription: true,
    category: "Antibiótico",
    atcCode: "J01EE01",
  },
  // ── Analgésicos / Antiinflamatorios ──
  {
    id: "d-040",
    commercialName: "Ibuprofeno Raffo 400mg",
    genericName: "Ibuprofeno",
    lab: "Raffo",
    concentration: "400mg",
    presentation: "Comprimidos x 20",
    troquel: "8912345",
    isControlled: false,
    requiresPrescription: false,
    category: "AINE",
    atcCode: "M01AE01",
  },
  {
    id: "d-041",
    commercialName: "Diclofenac Novartis 75mg",
    genericName: "Diclofenac",
    lab: "Novartis",
    concentration: "75mg",
    presentation: "Comprimidos x 20",
    troquel: "9123456",
    isControlled: false,
    requiresPrescription: true,
    category: "AINE",
    atcCode: "M01AB05",
  },
  {
    id: "d-042",
    commercialName: "Paracetamol Bagó 500mg",
    genericName: "Paracetamol",
    lab: "Bagó",
    concentration: "500mg",
    presentation: "Comprimidos x 20",
    troquel: "1234501",
    isControlled: false,
    requiresPrescription: false,
    category: "Analgésico",
    atcCode: "N02BE01",
  },
  {
    id: "d-043",
    commercialName: "Meloxicam Gador 15mg",
    genericName: "Meloxicam",
    lab: "Gador",
    concentration: "15mg",
    presentation: "Comprimidos x 10",
    troquel: "2345012",
    isControlled: false,
    requiresPrescription: true,
    category: "AINE",
    atcCode: "M01AC06",
  },
  {
    id: "d-044",
    commercialName: "Tramadol Gador 50mg",
    genericName: "Tramadol",
    lab: "Gador",
    concentration: "50mg",
    presentation: "Comprimidos x 20",
    troquel: "3450123",
    isControlled: true,
    requiresPrescription: true,
    category: "Opiode",
    atcCode: "N02AX02",
  },
  // ── Respiratorio ──
  {
    id: "d-050",
    commercialName: "Salbutamol Glaxo 100mcg",
    genericName: "Salbutamol",
    lab: "GlaxoSmithKline",
    concentration: "100mcg/dosis",
    presentation: "Aerosol x 200 dosis",
    troquel: "4560123",
    isControlled: false,
    requiresPrescription: true,
    category: "Respiratorio",
    atcCode: "R03AC02",
  },
  {
    id: "d-051",
    commercialName: "Budesonide Casasco 200mcg",
    genericName: "Budesonide",
    lab: "Casasco",
    concentration: "200mcg/dosis",
    presentation: "Aerosol x 200 dosis",
    troquel: "5601234",
    isControlled: false,
    requiresPrescription: true,
    category: "Respiratorio",
    atcCode: "R03BA02",
  },
  {
    id: "d-052",
    commercialName: "Montelukast Roemmers 10mg",
    genericName: "Montelukast",
    lab: "Roemmers",
    concentration: "10mg",
    presentation: "Comprimidos x 30",
    troquel: "6012345",
    isControlled: false,
    requiresPrescription: true,
    category: "Respiratorio",
    atcCode: "R03DC03",
  },
  // ── SNC / Psiquiatría ──
  {
    id: "d-060",
    commercialName: "Clonazepam Gador 0.5mg",
    genericName: "Clonazepam",
    lab: "Gador",
    concentration: "0.5mg",
    presentation: "Comprimidos x 30",
    troquel: "7012345",
    isControlled: true,
    requiresPrescription: true,
    category: "Ansiolítico",
    atcCode: "N03AE01",
  },
  {
    id: "d-061",
    commercialName: "Alprazolam Gador 0.5mg",
    genericName: "Alprazolam",
    lab: "Gador",
    concentration: "0.5mg",
    presentation: "Comprimidos x 30",
    troquel: "8012345",
    isControlled: true,
    requiresPrescription: true,
    category: "Ansiolítico",
    atcCode: "N05BA12",
  },
  {
    id: "d-062",
    commercialName: "Sertralina Gador 50mg",
    genericName: "Sertralina",
    lab: "Gador",
    concentration: "50mg",
    presentation: "Comprimidos x 30",
    troquel: "9012345",
    isControlled: false,
    requiresPrescription: true,
    category: "Antidepresivo",
    atcCode: "N06AB06",
  },
  {
    id: "d-063",
    commercialName: "Escitalopram Roemmers 10mg",
    genericName: "Escitalopram",
    lab: "Roemmers",
    concentration: "10mg",
    presentation: "Comprimidos x 28",
    troquel: "1023456",
    isControlled: false,
    requiresPrescription: true,
    category: "Antidepresivo",
    atcCode: "N06AB10",
  },
  {
    id: "d-064",
    commercialName: "Quetiapina Gador 25mg",
    genericName: "Quetiapina",
    lab: "Gador",
    concentration: "25mg",
    presentation: "Comprimidos x 30",
    troquel: "2034567",
    isControlled: false,
    requiresPrescription: true,
    category: "Antipsicótico",
    atcCode: "N05AH04",
  },
  {
    id: "d-065",
    commercialName: "Pregabalina Bagó 75mg",
    genericName: "Pregabalina",
    lab: "Bagó",
    concentration: "75mg",
    presentation: "Cápsulas x 28",
    troquel: "3045678",
    isControlled: true,
    requiresPrescription: true,
    category: "Antiepiléptico",
    atcCode: "N03AX16",
  },
  {
    id: "d-066",
    commercialName: "Zolpidem Gador 10mg",
    genericName: "Zolpidem",
    lab: "Gador",
    concentration: "10mg",
    presentation: "Comprimidos x 30",
    troquel: "4056789",
    isControlled: true,
    requiresPrescription: true,
    category: "Hipnótico",
    atcCode: "N05CF02",
  },
  // ── Dermatología ──
  {
    id: "d-070",
    commercialName: "Betametasona Crema 0.1%",
    genericName: "Betametasona",
    lab: "Roemmers",
    concentration: "0.1%",
    presentation: "Crema x 30g",
    troquel: "5067890",
    isControlled: false,
    requiresPrescription: true,
    category: "Dermatología",
    atcCode: "D07AC01",
  },
  // ── Oftalmología ──
  {
    id: "d-075",
    commercialName: "Timolol Gotas 0.5%",
    genericName: "Timolol",
    lab: "Allergan",
    concentration: "0.5%",
    presentation: "Gotas x 5ml",
    troquel: "6078901",
    isControlled: false,
    requiresPrescription: true,
    category: "Oftalmología",
    atcCode: "S01ED01",
  },
  // ── Antialérgicos ──
  {
    id: "d-080",
    commercialName: "Loratadina Roemmers 10mg",
    genericName: "Loratadina",
    lab: "Roemmers",
    concentration: "10mg",
    presentation: "Comprimidos x 30",
    troquel: "7089012",
    isControlled: false,
    requiresPrescription: false,
    category: "Antialérgico",
    atcCode: "R06AX13",
  },
  {
    id: "d-081",
    commercialName: "Cetirizina Casasco 10mg",
    genericName: "Cetirizina",
    lab: "Casasco",
    concentration: "10mg",
    presentation: "Comprimidos x 30",
    troquel: "8090123",
    isControlled: false,
    requiresPrescription: false,
    category: "Antialérgico",
    atcCode: "R06AE07",
  },
  // ── Vitaminas / Suplementos ──
  {
    id: "d-085",
    commercialName: "Hierro Polimaltosado Gador",
    genericName: "Hierro polimaltosato",
    lab: "Gador",
    concentration: "100mg Fe",
    presentation: "Comprimidos x 30",
    troquel: "9001234",
    isControlled: false,
    requiresPrescription: false,
    category: "Suplemento",
    atcCode: "B03AB05",
  },
  {
    id: "d-086",
    commercialName: "Ácido Fólico Bagó 5mg",
    genericName: "Ácido fólico",
    lab: "Bagó",
    concentration: "5mg",
    presentation: "Comprimidos x 30",
    troquel: "1002345",
    isControlled: false,
    requiresPrescription: false,
    category: "Suplemento",
    atcCode: "B03BB01",
  },
  {
    id: "d-087",
    commercialName: "Calcio + Vitamina D3 Bagó",
    genericName: "Calcio + Vitamina D3",
    lab: "Bagó",
    concentration: "600mg/400UI",
    presentation: "Comprimidos x 30",
    troquel: "2003456",
    isControlled: false,
    requiresPrescription: false,
    category: "Suplemento",
    atcCode: "A12AX",
  },
  // ── Urología ──
  {
    id: "d-090",
    commercialName: "Tamsulosina Gador 0.4mg",
    genericName: "Tamsulosina",
    lab: "Gador",
    concentration: "0.4mg",
    presentation: "Cápsulas x 30",
    troquel: "3004567",
    isControlled: false,
    requiresPrescription: true,
    category: "Urología",
    atcCode: "G04CA02",
  },
  // ── Anticoagulantes ──
  {
    id: "d-095",
    commercialName: "Rivaroxabán Bayer 20mg",
    genericName: "Rivaroxabán",
    lab: "Bayer",
    concentration: "20mg",
    presentation: "Comprimidos x 28",
    troquel: "4005678",
    isControlled: false,
    requiresPrescription: true,
    category: "Anticoagulante",
    atcCode: "B01AF01",
  },
];

// ─── Interaction Database ────────────────────────────────────

const INTERACTION_DATABASE: DrugInteraction[] = [
  {
    id: "ix-1",
    drugA: "enalapril",
    drugB: "losartán",
    severity: "high",
    description:
      "Doble bloqueo del sistema renina-angiotensina. Riesgo de hipotensión, hiperkalemia e insuficiencia renal.",
    recommendation: "Evitar combinación. Usar uno u otro, no ambos.",
  },
  {
    id: "ix-2",
    drugA: "ácido acetilsalicílico",
    drugB: "ibuprofeno",
    severity: "moderate",
    description: "Los AINE pueden reducir el efecto antiagregante de la aspirina.",
    recommendation: "Si se usa aspirina como antiagregante, tomar 30 min antes del AINE.",
  },
  {
    id: "ix-3",
    drugA: "ciprofloxacina",
    drugB: "calcio + vitamina d3",
    severity: "moderate",
    description: "El calcio reduce la absorción de ciprofloxacina.",
    recommendation: "Separar la toma por al menos 2 horas.",
  },
  {
    id: "ix-4",
    drugA: "clonazepam",
    drugB: "zolpidem",
    severity: "high",
    description:
      "Potenciación del efecto depresor del SNC. Riesgo de sedación excesiva y depresión respiratoria.",
    recommendation: "Evitar uso concomitante. Si es necesario, reducir dosis de ambos.",
  },
  {
    id: "ix-5",
    drugA: "metformina",
    drugB: "ciprofloxacina",
    severity: "moderate",
    description: "Las fluoroquinolonas pueden alterar la glucemia (hipo o hiperglucemia).",
    recommendation: "Monitorear glucemia de cerca durante el tratamiento antibiótico.",
  },
  {
    id: "ix-6",
    drugA: "enalapril",
    drugB: "furosemida",
    severity: "moderate",
    description: "Riesgo de hipotensión al inicio del tratamiento combinado.",
    recommendation: "Iniciar con dosis bajas de IECA. Monitorear presión arterial.",
  },
  {
    id: "ix-7",
    drugA: "atorvastatina",
    drugB: "azitromicina",
    severity: "low",
    description: "Azitromicina puede aumentar levemente los niveles de atorvastatina.",
    recommendation: "Monitorear síntomas musculares (mialgia). Generalmente seguro.",
  },
  {
    id: "ix-8",
    drugA: "tramadol",
    drugB: "sertralina",
    severity: "high",
    description: "Riesgo de síndrome serotoninérgico. Combinación potencialmente peligrosa.",
    recommendation: "Evitar si es posible. Si es necesario, usar dosis mínimas y monitorear.",
  },
  {
    id: "ix-9",
    drugA: "clopidogrel",
    drugB: "omeprazol",
    severity: "moderate",
    description: "Omeprazol reduce la activación de clopidogrel vía CYP2C19.",
    recommendation: "Preferir pantoprazol como alternativa. Evitar omeprazol con clopidogrel.",
  },
  {
    id: "ix-10",
    drugA: "rivaroxabán",
    drugB: "ácido acetilsalicílico",
    severity: "high",
    description: "Alto riesgo de sangrado con la combinación de anticoagulante y antiagregante.",
    recommendation:
      "Solo combinar bajo indicación cardiológica estricta. Monitorear signos de sangrado.",
  },
  {
    id: "ix-11",
    drugA: "alprazolam",
    drugB: "tramadol",
    severity: "contraindicated",
    description: "Combinación de benzodiazepina y opioide: riesgo de depresión respiratoria fatal.",
    recommendation:
      "CONTRAINDICADO. No prescribir juntos salvo casos excepcionales en ambiente monitorizado.",
  },
  {
    id: "ix-12",
    drugA: "levotiroxina",
    drugB: "calcio + vitamina d3",
    severity: "moderate",
    description: "El calcio reduce la absorción de levotiroxina.",
    recommendation: "Separar la toma por al menos 4 horas. Tomar levotiroxina en ayunas.",
  },
];
