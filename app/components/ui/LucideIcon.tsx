import React from "react";
import { type LucideProps } from "lucide-react";
import {
  Layers,
  Wrench,
  Paintbrush,
  Sofa,
  Lightbulb,
  BrickWall,
  Droplet,
  Plus,
  Ruler,
  Home,
  Folder,
  RotateCw,
  CheckCircle2,
  PauseCircle,
  DollarSign,
  Calculator,
  ShoppingCart,
  Maximize2,
  HelpCircle,
  Package,
  ClipboardList,
  Hammer,
  User,
  Lock,
  CreditCard,
  Landmark,
  Banknote,
  Search,
  ShowerHead,
  Leaf,
  Tag,
  Users,
  Grid,
  Clock,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  // Emojis (for DB compatibility)
  "🏗️": Layers,             // Pisos/cerámicas
  "🔧": Wrench,             // Herramientas
  "🔨": Hammer,             // Integral / Construcción
  "🎨": Paintbrush,         // Pinturas
  "🪑": Sofa,               // Muebles
  "💡": Lightbulb,          // Iluminación
  "🧱": BrickWall,          // Materiales de construcción, Pegante
  "🪣": Droplet,            // Boquilla, Primer, etc.
  "➕": Plus,               // Crucetas
  "📏": Ruler,              // Nivel, Cinta, etc.
  "🏠": Home,               // Thumbnail del proyecto, Home
  "🚿": ShowerHead,         // Proyecto Baño (Ducha)
  "🍳": Hammer,             // Proyecto Cocina (Cocinar/Martillo)
  "🌿": Leaf,               // Proyecto Terraza (Plantas/Hojas)
  
  // Proyectos / Stats / Emojis
  "📐": Maximize2,          // Área, Creador de Proyectos
  "📁": Folder,             // Total proyectos
  "🔄": RotateCw,           // En progreso
  "✅": CheckCircle2,       // Completados
  "⏸️": PauseCircle,        // Pausados
  "🧮": Calculator,         // Cálculo automático
  "🛒": ShoppingCart,       // Carrito, compra en un clic
  "💲": DollarSign,         // Costo estimado
  "💰": DollarSign,
  "📦": Package,            // Materiales / Paquete
  "📋": ClipboardList,      // Tipo / Detalle
  "👤": User,               // Usuario / Perfil
  "🔒": Lock,               // Candado / Pago Seguro
  "💳": CreditCard,         // Tarjeta bancaria
  "🏦": Landmark,           // Banco / PSE
  "💵": Banknote,           // Efectivo
  "🔍": Search,
  "🏷️": Tag,
  "👥": Users,

  // Direct Lucide Component Names (Case-sensitive standard names)
  "Layers": Layers,
  "Grid": Grid,
  "Wrench": Wrench,
  "Hammer": Hammer,
  "Paintbrush": Paintbrush,
  "Sofa": Sofa,
  "Lightbulb": Lightbulb,
  "BrickWall": BrickWall,
  "Droplet": Droplet,
  "Plus": Plus,
  "Ruler": Ruler,
  "Home": Home,
  "Maximize2": Maximize2,
  "Folder": Folder,
  "RotateCw": RotateCw,
  "CheckCircle2": CheckCircle2,
  "PauseCircle": PauseCircle,
  "Calculator": Calculator,
  "ShoppingCart": ShoppingCart,
  "DollarSign": DollarSign,
  "Package": Package,
  "ClipboardList": ClipboardList,
  "User": User,
  "Lock": Lock,
  "CreditCard": CreditCard,
  "Landmark": Landmark,
  "Banknote": Banknote,
  "Search": Search,
  "ShowerHead": ShowerHead,
  "Leaf": Leaf,
  "Tag": Tag,
  "Users": Users,
  "Clock": Clock,
  
  // Category Slugs
  "pisos-ceramicas": Layers,
  "herramientas": Wrench,
  "pinturas": Paintbrush,
  "muebles": Sofa,
  "iluminacion": Lightbulb,
  "materiales-construccion": BrickWall,

  // Project Types Slugs (lower and uppercase)
  "piso": Layers,
  "pared": BrickWall,
  "techo": Home,
  "integral": Hammer,
  "PISO": Layers,
  "PARED": BrickWall,
  "TECHO": Home,
  "INTEGRAL": Hammer,
};

interface LucideIconProps {
  name: string;
  className?: string;
  size?: number;
}

export default function LucideIcon({ name, className = "", size = 20 }: LucideIconProps) {
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    // Si no está en el mapa y es un emoji (longitud corta), se muestra directamente
    if (name.length <= 4) {
      return (
        <span
          className={`inline-block select-none ${className}`}
          style={{ fontSize: `${size}px`, lineHeight: 1 }}
        >
          {name}
        </span>
      );
    }
    return <HelpCircle className={className} size={size} />;
  }

  return <IconComponent className={className} size={size} />;
}
