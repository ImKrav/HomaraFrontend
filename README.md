# 🎨 Homara — E-Commerce Frontend

¡Bienvenido al repositorio del Frontend de **Homara**! Esta es una aplicación web moderna, interactiva y de alto rendimiento construida con **Next.js 16 (App Router)**, **React 19** y **Tailwind CSS v4**.

Homara proporciona una experiencia de compra premium enfocada en el diseño y en asistir inteligentemente al usuario a través de un estimador interactivo de materiales de construcción y remodelación de espacios físicos, unificando la planificación física y la compra con un solo clic.

---

## 🚀 Pila Tecnológica (Tech Stack)

* **Framework Web:** [Next.js](https://nextjs.org/) (v16.2.6) con App Router y React Server Components (RSC).
* **Librería de Interfaz:** [React](https://react.dev/) (v19.2.6) para una interactividad moderna.
* **Lenguaje:** [TypeScript](https://www.typescriptlang.org/) (v5.x) con tipado estricto.
* **Estilos y Diseño:** [Tailwind CSS](https://tailwindcss.com/) (v4.2.2) y PostCSS para una experiencia visual de primera clase con variables nativas.
* **Calidad de Código:** ESLint configurado de manera estricta.

---

## 📂 Estructura de Directorios Clave

La estructura de la aplicación se distribuye dentro del directorio `app/`:

```
app/
├── (admin)/            # Vistas y flujos para administración del catálogo y stock
├── (shop)/             # Vistas principales de la tienda
│   ├── catalogo/       # Catálogo interactivo de productos con filtros y tags
│   ├── carrito/        # Módulo persistente de carrito de compras
│   ├── checkout/       # Formulario y pasarela de pago simulada
│   └── proyectos/      # Flujo de creación de proyectos y cálculo de materiales
├── components/         # Componentes React compartidos (Navbar, Footer, ProjectCard, etc.)
│   └── ui/             # Primitivas básicas de UI (botones, inputs, modales)
├── lib/                # Funciones auxiliares y clientes de API
├── globals.css         # Importación de Tailwind CSS v4 y variables de diseño del tema
├── layout.tsx          # Root Layout y configuración de tipografía
└── page.tsx            # Landing Page de Homara (hero, beneficios y destacados)
```

---

## 🛠️ Instalación y Configuración Local (sin Docker)

Sigue estos pasos para levantar y ejecutar la aplicación con Node.

### Requisitos Previos

- [Node.js](https://nodejs.org/) (versión 20 o superior recomendada)
- La API de [HomaraBackend](https://github.com/ImKrav/HomaraBackend.git) activa y escuchando en su puerto local (usualmente `5000`)

### Pasos de Configuración

1. **Instalar Dependencias:**
   ```bash
   npm install
   ```

2. **Configurar el Entorno:**
   Crea un archivo `.env.local` en la raíz del frontend:
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:5000/api/v1"
   ```

3. **Ejecutar en Modo Desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

4. **Compilar para Producción:**
   ```bash
   npm run build
   npm start
   ```

---

## 📦 Imagen Pública en Docker Hub

La imagen oficial del frontend está publicada en Docker Hub:

- **Repositorio:** [**imkrav/homara-frontend**](https://hub.docker.com/r/imkrav/homara-frontend)
- **Pull de la última versión:**
  ```bash
  docker pull imkrav/homara-frontend:latest
  ```
- **Tags disponibles:** `latest` y `<short-sha>` por cada commit en `main`.

Para usarla directamente sin clonar este repo:

```bash
docker run -d -p 3000:3000 --name homara-frontend \
  -e NEXT_PUBLIC_API_URL=http://tu-backend:5000/api/v1 \
  imkrav/homara-frontend:latest
```

> **Importante:** `NEXT_PUBLIC_API_URL` se inlinea en el bundle del cliente en el momento del build. Si la imagen publicada no apunta a tu backend, recompílala localmente (ver siguiente sección) o usa `docker compose` de este repo.

---

## 🐳 Despliegue con Docker

Este repositorio incluye un `Dockerfile` multi-stage y un `docker-compose.yml` listos para levantar la aplicación Next.js con un solo comando.

### Requisitos Previos

- [Docker](https://www.docker.com/) 20.10+
- [Docker Compose](https://docs.docker.com/compose/) v2 (incluido en Docker Desktop)
- La API de HomaraBackend accesible (en `http://localhost:5000/api/v1` por defecto)

### Docker Compose

```bash
# Levantar el frontend en segundo plano
docker compose up -d

# Reconstruir después de cambios
docker compose up -d --build

# Ver logs en tiempo real
docker compose logs -f frontend

# Detener
docker compose down
```

La aplicación quedará disponible en `http://localhost:3000`.

#### Apuntar a un backend distinto

Por defecto el contenedor espera la API en `http://localhost:5000/api/v1`. Para apuntar a otro backend (otro host, un túnel, etc.) tienes dos opciones:

```bash
# Opción A: Variable en línea
NEXT_PUBLIC_API_URL=http://mi-backend:5000/api/v1 docker compose up -d --build

# Opción B: Crear un archivo .env en esta misma carpeta
# NEXT_PUBLIC_API_URL=http://mi-backend:5000/api/v1
docker compose up -d --build
```

> **Importante:** Como `NEXT_PUBLIC_*` se inlinea en el bundle en el momento del build, cualquier cambio en la URL del backend requiere reconstruir la imagen (`--build`).

---

## 🧹 Calidad de Código

```bash
# Validar linters (ESLint)
npm run lint
```
