// ============================================
// Homara — TypeScript Types & Utilities
// ============================================

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  categorySlug: string;
  categoryId?: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  stockQuantity: number;
  unit: string;
  tags: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  productCount: number;
}

export interface Project {
  id: string;
  name: string;
  type: string;
  status: string;
  area: number;
  createdAt: string;
  materialCount: number;
  estimatedCost: number;
  thumbnail: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  date: string;
  status: string;
  items: number;
  total: number;
  customer: string;
}

export interface AdminMetric {
  label: string;
  value: string;
  change: number;
  icon: string;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    en_progreso: "En progreso",
    completado: "Completado",
    pausado: "Pausado",
    pendiente: "Pendiente",
    procesando: "Procesando",
    enviado: "Enviado",
    entregado: "Entregado",
    cancelado: "Cancelado",
  };
  const key = status?.toLowerCase() || "";
  return labels[key] || status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    en_progreso: "bg-amber-500/20 text-amber-400",
    completado: "bg-emerald-500/20 text-emerald-400",
    pausado: "bg-slate-500/20 text-slate-400",
    pendiente: "bg-amber-500/20 text-amber-400",
    procesando: "bg-blue-500/20 text-blue-400",
    enviado: "bg-purple-500/20 text-purple-400",
    entregado: "bg-emerald-500/20 text-emerald-400",
    cancelado: "bg-red-500/20 text-red-400",
  };
  const key = status?.toLowerCase() || "";
  return colors[key] || "bg-slate-500/20 text-slate-400";
}

export interface ProjectMaterial {
  id: string;
  name: string;
  quantity: string;
  note: string;
  icon: string;
  price: number;
  productId: string | null;
}

export interface ProjectDetail extends Project {
  length?: number | null;
  width?: number | null;
  height?: number | null;
  materialType?: string | null;
  tileFormat?: string | null;
  layingPattern?: string | null;
  wastePercent?: number | null;
  deductDoors?: number | null;
  deductWindows?: number | null;
  customSubtractions?: number | null;
  materials: ProjectMaterial[];
  updatedAt: string;
}

export interface OrderDetail {
  id: string;
  dbId?: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentMethod: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  date: string;
  customer: string;
  items: number;
}

export interface CartItemDetail {
  id: string;
  quantity: number;
  product: Product;
  updatedAt?: string;
  isBackorder?: boolean;
  backorderQuantity?: number;
  availableStock?: number;
}

export interface InventoryProduct {
  id: string;
  name: string;
  category: string;
  stockQuantity: number;
  unit: string;
  price: number;
  stockValue: number;
  inStock: boolean;
  stockStatus: "sin_stock" | "stock_bajo" | "normal";
}

export interface AdminChartData {
  salesByMonth: number[];
  topCategories: { name: string; pct: number }[];
}

function translateWithFallback(t: (key: string) => string, key: string, fallback: string): string {
  const val = t(key);
  return val !== key ? val : fallback;
}

const EXACT_MATERIAL_NAMES: Record<string, { key: string; fallback: string }> = {
  "Pegante cerámico flexible 25kg": {
    key: "projects.supply_adhesive_flexible",
    fallback: "Flexible Ceramic Adhesive 25kg",
  },
  "Boquilla": {
    key: "projects.supply_grout_title",
    fallback: "Grout",
  },
  "Crucetas 2mm": {
    key: "projects.supply_spacers_title",
    fallback: "Spacers 2mm",
  },
  "Cinta underlayment": {
    key: "projects.supply_underlayment",
    fallback: "Underlayment tape",
  },
  "Primer para vinilo": {
    key: "projects.supply_vinyl_primer",
    fallback: "Primer for vinyl",
  },
  "Kit Rodillo Antigoteo Profesional 23cm": {
    key: "projects.supply_roller_kit",
    fallback: "Professional Anti-Drip Roller Kit 23cm",
  },
  "Nivel de burbuja profesional 60cm": {
    key: "projects.supply_bubble_level",
    fallback: "Professional Bubble Level 60cm",
  },
  "Llana metálica dentada 10x10mm": {
    key: "projects.supply_notched_trowel",
    fallback: "Notched steel trowel 10x10mm",
  },
  "Mazo de goma blanco anti-marca": {
    key: "projects.supply_rubber_mallet",
    fallback: "White non-marking rubber mallet",
  },
};

const PREFIX_MATERIAL_NAMES: Array<{ prefix: string; key: string; fallback: string }> = [
  {
    prefix: "Pintura Premium de Interior/Exterior",
    key: "projects.supply_paint_premium",
    fallback: "Premium Interior/Exterior Paint",
  },
  {
    prefix: "Brocha de cerda fina",
    key: "projects.supply_fine_brush",
    fallback: 'Fine bristle brush 2.5"',
  },
  {
    prefix: "Cinta de enmascarar",
    key: "projects.supply_masking_tape",
    fallback: 'Premium masking tape 1"',
  },
];

const SURFACE_REPLACEMENTS: Array<[string, string, string]> = [
  ["Cerámica", "projects.surface_ceramica", "Ceramic"],
  ["Porcelanato", "projects.surface_porcelanato", "Porcelain"],
  ["Madera laminada", "projects.surface_madera", "Laminated wood"],
  ["Vinilo", "projects.surface_vinilo", "Vinyl"],
  ["Pared", "projects.surface_wall_suffix", "Wall"],
];

export function translateMaterialName(name: string, t: (key: string) => string): string {
  const n = name.trim();
  for (const item of PREFIX_MATERIAL_NAMES) {
    if (n.startsWith(item.prefix)) {
      return translateWithFallback(t, item.key, item.fallback);
    }
  }

  const exact = EXACT_MATERIAL_NAMES[n];
  if (exact) {
    return translateWithFallback(t, exact.key, exact.fallback);
  }

  let translated = n;
  for (const [target, key, fallback] of SURFACE_REPLACEMENTS) {
    if (translated.includes(target)) {
      translated = translated.replace(target, translateWithFallback(t, key, fallback));
    }
  }

  return translated;
}

const EXACT_MATERIAL_NOTES: Record<string, { key: string; fallback: string }> = {
  "Pegante real vinculado": {
    key: "projects.note_adhesive_linked",
    fallback: "Linked real adhesive: 1 bag per 4m²",
  },
  "25kg c/u (Rendimiento: 4m²/bulto)": {
    key: "projects.note_adhesive_flexible_desc",
    fallback: "25kg each (Yield: 4m²/bag)",
  },
  "Boquilla real vinculada": {
    key: "projects.note_grout_linked",
    fallback: "Linked real grout: 1 kg per 8m²",
  },
  "Rendimiento: 8m²/kg": {
    key: "projects.note_grout_desc",
    fallback: "Yield: 8m²/kg",
  },
  "100 unidades c/u (Rendimiento: 15m²/bolsa)": {
    key: "projects.note_spacers_desc",
    fallback: "100 units each (Yield: 15m²/bag)",
  },
  "20m² c/u (Aislamiento acústico y de humedad)": {
    key: "projects.note_underlayment_desc",
    fallback: "20m² each (Acoustic and moisture barrier)",
  },
  "15m² c/u (Adherencia óptima)": {
    key: "projects.note_vinyl_primer_desc",
    fallback: "15m² each (Optimal adhesion)",
  },
  "Incluye bandeja y felpa de microfibra": {
    key: "projects.note_roller_kit_desc",
    fallback: "Includes tray and microfiber roller sleeve",
  },
  "Para retoques y esquinas": {
    key: "projects.note_fine_brush_desc",
    fallback: "For touch-ups and corners",
  },
  "Para protección de bordes y zócalos": {
    key: "projects.note_masking_tape_desc",
    fallback: "For edge and baseboard protection",
  },
  "Para alineación exacta de la superficie": {
    key: "projects.note_bubble_level_desc",
    fallback: "For precise surface alignment",
  },
  "Para distribución correcta del pegante": {
    key: "projects.note_notched_trowel_desc",
    fallback: "For correct adhesive distribution",
  },
  "Para asentamiento de baldosas sin fracturas": {
    key: "projects.note_rubber_mallet_desc",
    fallback: "For tile settlement without cracks",
  },
};

function translateWastePattern(
  t: (key: string) => string,
  key: string,
  waste: string,
  fallbackTemplate: string,
): string {
  const translated = t(key);
  if (translated !== key) {
    return translated.replace("{waste}", waste);
  }
  return fallbackTemplate.replace("{waste}", waste);
}

const WASTE_REGEX = /\+(\d+)%/;

export function translateMaterialNote(note: string | null, t: (key: string) => string): string | null {
  if (!note) return null;
  const n = note.trim();

  if (n.startsWith("Cálculo exacto: 1 galón por cada 30m²")) {
    const waste = WASTE_REGEX.exec(n)?.[1] ?? "10";
    return translateWastePattern(
      t,
      "projects.note_paint_exact",
      waste,
      "Exact calculation: 1 gallon per 30m² (Includes +{waste}% waste)",
    );
  }
  if (n.startsWith("Cálculo exacto con +")) {
    const waste = WASTE_REGEX.exec(n)?.[1] ?? "10";
    return translateWastePattern(
      t,
      "projects.note_exact_waste",
      waste,
      "Exact calculation with +{waste}% waste",
    );
  }
  if (n.startsWith("Rendimiento aproximado de 30m²")) {
    const waste = WASTE_REGEX.exec(n)?.[1] ?? "5";
    return translateWastePattern(
      t,
      "projects.note_paint_approx",
      waste,
      "Approximate yield of 30m² each with 2 coats (Includes +{waste}% waste)",
    );
  }
  if (n.startsWith("+") && n.includes("desperdicio por colocación")) {
    const waste = WASTE_REGEX.exec(n)?.[1] ?? "10";
    return translateWastePattern(
      t,
      "projects.note_waste_laying",
      waste,
      "+{waste}% waste due to layout pattern",
    );
  }
  if (n.startsWith("Paredes estimadas")) {
    const waste = WASTE_REGEX.exec(n)?.[1] ?? "10";
    return translateWastePattern(
      t,
      "projects.note_walls_estimated",
      waste,
      "Estimated walls (+{waste}% waste)",
    );
  }

  const exact = EXACT_MATERIAL_NOTES[n];
  if (exact) {
    return translateWithFallback(t, exact.key, exact.fallback);
  }

  return note;
}
