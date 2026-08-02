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

export function translateMaterialName(name: string, t: (key: string) => string): string {
  const n = name.trim();
  if (n.startsWith("Pintura Premium de Interior/Exterior")) {
    return t("projects.supply_paint_premium") !== "projects.supply_paint_premium" 
      ? t("projects.supply_paint_premium") 
      : "Premium Interior/Exterior Paint";
  }
  if (n === "Pegante cerámico flexible 25kg") {
    return t("projects.supply_adhesive_flexible") !== "projects.supply_adhesive_flexible"
      ? t("projects.supply_adhesive_flexible")
      : "Flexible Ceramic Adhesive 25kg";
  }
  if (n === "Boquilla") {
    return t("projects.supply_grout_title") !== "projects.supply_grout_title"
      ? t("projects.supply_grout_title")
      : "Grout";
  }
  if (n === "Crucetas 2mm") {
    return t("projects.supply_spacers_title") !== "projects.supply_spacers_title"
      ? t("projects.supply_spacers_title")
      : "Spacers 2mm";
  }
  if (n === "Cinta underlayment") {
    return t("projects.supply_underlayment") !== "projects.supply_underlayment"
      ? t("projects.supply_underlayment")
      : "Underlayment tape";
  }
  if (n === "Primer para vinilo") {
    return t("projects.supply_vinyl_primer") !== "projects.supply_vinyl_primer"
      ? t("projects.supply_vinyl_primer")
      : "Primer for vinyl";
  }
  if (n === "Kit Rodillo Antigoteo Profesional 23cm") {
    return t("projects.supply_roller_kit") !== "projects.supply_roller_kit"
      ? t("projects.supply_roller_kit")
      : "Professional Anti-Drip Roller Kit 23cm";
  }
  if (n.startsWith("Brocha de cerda fina")) {
    return t("projects.supply_fine_brush") !== "projects.supply_fine_brush"
      ? t("projects.supply_fine_brush")
      : "Fine bristle brush 2.5\"";
  }
  if (n.startsWith("Cinta de enmascarar")) {
    return t("projects.supply_masking_tape") !== "projects.supply_masking_tape"
      ? t("projects.supply_masking_tape")
      : "Premium masking tape 1\"";
  }
  if (n === "Nivel de burbuja profesional 60cm") {
    return t("projects.supply_bubble_level") !== "projects.supply_bubble_level"
      ? t("projects.supply_bubble_level")
      : "Professional Bubble Level 60cm";
  }
  if (n === "Llana metálica dentada 10x10mm") {
    return t("projects.supply_notched_trowel") !== "projects.supply_notched_trowel"
      ? t("projects.supply_notched_trowel")
      : "Notched steel trowel 10x10mm";
  }
  if (n === "Mazo de goma blanco anti-marca") {
    return t("projects.supply_rubber_mallet") !== "projects.supply_rubber_mallet"
      ? t("projects.supply_rubber_mallet")
      : "White non-marking rubber mallet";
  }

  // Handle dynamic main coverings: Cerámica, Porcelanato, Madera laminada, Vinilo
  let translated = n;
  if (translated.includes("Cerámica")) translated = translated.replace("Cerámica", t("projects.surface_ceramica") || "Ceramic");
  if (translated.includes("Porcelanato")) translated = translated.replace("Porcelanato", t("projects.surface_porcelanato") || "Porcelain");
  if (translated.includes("Madera laminada")) translated = translated.replace("Madera laminada", t("projects.surface_madera") || "Laminated wood");
  if (translated.includes("Vinilo")) translated = translated.replace("Vinilo", t("projects.surface_vinilo") || "Vinyl");
  if (translated.includes("Pared")) translated = translated.replace("Pared", t("projects.surface_wall_suffix") || "Wall");

  return translated;
}

export function translateMaterialNote(note: string | null, t: (key: string) => string): string | null {
  if (!note) return null;
  const n = note.trim();
  
  if (n.startsWith("Cálculo exacto: 1 galón por cada 30m²")) {
    const waste = n.match(/\+(\d+)%/)?.[1] || "10";
    return t("projects.note_paint_exact").replace("{waste}", waste) !== "projects.note_paint_exact"
      ? t("projects.note_paint_exact").replace("{waste}", waste)
      : `Exact calculation: 1 gallon per 30m² (Includes +${waste}% waste)`;
  }
  if (n.startsWith("Cálculo exacto con +")) {
    const waste = n.match(/\+(\d+)%/)?.[1] || "10";
    return t("projects.note_exact_waste").replace("{waste}", waste) !== "projects.note_exact_waste"
      ? t("projects.note_exact_waste").replace("{waste}", waste)
      : `Exact calculation with +${waste}% waste`;
  }
  if (n.startsWith("Rendimiento aproximado de 30m²")) {
    const waste = n.match(/\+(\d+)%/)?.[1] || "5";
    return t("projects.note_paint_approx").replace("{waste}", waste) !== "projects.note_paint_approx"
      ? t("projects.note_paint_approx").replace("{waste}", waste)
      : `Approximate yield of 30m² each with 2 coats (Includes +${waste}% waste)`;
  }
  if (n.startsWith("+") && n.includes("desperdicio por colocación")) {
    const waste = n.match(/\+(\d+)%/)?.[1] || "10";
    return t("projects.note_waste_laying").replace("{waste}", waste) !== "projects.note_waste_laying"
      ? t("projects.note_waste_laying").replace("{waste}", waste)
      : `+${waste}% waste due to layout pattern`;
  }
  if (n.startsWith("Pegante real vinculado")) {
    return t("projects.note_adhesive_linked") !== "projects.note_adhesive_linked"
      ? t("projects.note_adhesive_linked")
      : "Linked real adhesive: 1 bag per 4m²";
  }
  if (n === "25kg c/u (Rendimiento: 4m²/bulto)") {
    return t("projects.note_adhesive_flexible_desc") !== "projects.note_adhesive_flexible_desc"
      ? t("projects.note_adhesive_flexible_desc")
      : "25kg each (Yield: 4m²/bag)";
  }
  if (n.startsWith("Boquilla real vinculada")) {
    return t("projects.note_grout_linked") !== "projects.note_grout_linked"
      ? t("projects.note_grout_linked")
      : "Linked real grout: 1 kg per 8m²";
  }
  if (n === "Rendimiento: 8m²/kg") {
    return t("projects.note_grout_desc") !== "projects.note_grout_desc"
      ? t("projects.note_grout_desc")
      : "Yield: 8m²/kg";
  }
  if (n === "100 unidades c/u (Rendimiento: 15m²/bolsa)") {
    return t("projects.note_spacers_desc") !== "projects.note_spacers_desc"
      ? t("projects.note_spacers_desc")
      : "100 units each (Yield: 15m²/bag)";
  }
  if (n === "20m² c/u (Aislamiento acústico y de humedad)") {
    return t("projects.note_underlayment_desc") !== "projects.note_underlayment_desc"
      ? t("projects.note_underlayment_desc")
      : "20m² each (Acoustic and moisture barrier)";
  }
  if (n === "15m² c/u (Adherencia óptima)") {
    return t("projects.note_vinyl_primer_desc") !== "projects.note_vinyl_primer_desc"
      ? t("projects.note_vinyl_primer_desc")
      : "15m² each (Optimal adhesion)";
  }
  if (n === "Incluye bandeja y felpa de microfibra") {
    return t("projects.note_roller_kit_desc") !== "projects.note_roller_kit_desc"
      ? t("projects.note_roller_kit_desc")
      : "Includes tray and microfiber roller sleeve";
  }
  if (n === "Para retoques y esquinas") {
    return t("projects.note_fine_brush_desc") !== "projects.note_fine_brush_desc"
      ? t("projects.note_fine_brush_desc")
      : "For touch-ups and corners";
  }
  if (n === "Para protección de bordes y zócalos") {
    return t("projects.note_masking_tape_desc") !== "projects.note_masking_tape_desc"
      ? t("projects.note_masking_tape_desc")
      : "For edge and baseboard protection";
  }
  if (n === "Para alineación exacta de la superficie") {
    return t("projects.note_bubble_level_desc") !== "projects.note_bubble_level_desc"
      ? t("projects.note_bubble_level_desc")
      : "For precise surface alignment";
  }
  if (n === "Para distribución correcta del pegante") {
    return t("projects.note_notched_trowel_desc") !== "projects.note_notched_trowel_desc"
      ? t("projects.note_notched_trowel_desc")
      : "For correct adhesive distribution";
  }
  if (n === "Para asentamiento de baldosas sin fracturas") {
    return t("projects.note_rubber_mallet_desc") !== "projects.note_rubber_mallet_desc"
      ? t("projects.note_rubber_mallet_desc")
      : "For tile settlement without cracks";
  }
  if (n.startsWith("Paredes estimadas")) {
    const waste = n.match(/\+(\d+)%/)?.[1] || "10";
    return t("projects.note_walls_estimated").replace("{waste}", waste) !== "projects.note_walls_estimated"
      ? t("projects.note_walls_estimated").replace("{waste}", waste)
      : `Estimated walls (+${waste}% waste)`;
  }
  
  return note;
}
