// Datos de prueba para los componentes (formato del contrato de /products).
import type { Product } from "@/app/lib/utils";

export const productoBase: Product = {
  id: "prod-cy-001",
  name: "Porcelanato Gris Cemento 60x60",
  description: "Porcelanato rectificado de alto tráfico.",
  price: 75000,
  originalPrice: 100000,
  image: "/products/porcelanato.jpg",
  category: "Pisos y Cerámicas",
  categorySlug: "pisos-ceramicas",
  rating: 4.6,
  reviews: 12,
  inStock: true,
  stockQuantity: 320,
  unit: "m²",
  tags: ["nuevo"],
};

export const productoSinStock: Product = {
  ...productoBase,
  id: "prod-cy-002",
  name: "Estantería Metálica 5 Niveles",
  category: "Muebles",
  categorySlug: "muebles",
  price: 219000,
  originalPrice: undefined,
  rating: 2.4,
  inStock: false,
  stockQuantity: 0,
  unit: "unidad",
  tags: [],
};
