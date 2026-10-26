import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/app/context/AuthContext";
import { ThemeProvider } from "@/app/context/ThemeContext";
import { LanguageProvider } from "@/app/context/LanguageContext";
import SkipLink from "@/app/components/SkipLink";
import ToastContainer from "@/app/components/ui/Toast";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Homara — Materiales para el Hogar y Construcción",
  description:
    "Calcula, planifica y compra tus materiales de construcción sin errores. Asistente inteligente de proyectos de remodelación con cálculo automático de materiales.",
  keywords: [
    "materiales de construcción",
    "ferretería",
    "hogar",
    "remodelación",
    "baldosas",
    "herramientas",
    "pintura",
  ],
};

const THEME_BOOTSTRAP =
  "try{var t=localStorage.getItem('homara_theme');if(t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${plusJakartaSans.variable} font-sans h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-bg-base text-text-primary transition-colors duration-200">
        {/* Aplica el tema guardado antes de pintar el contenido: sin esto la página se veía clara y
            transicionaba a oscura tras hidratar (parpadeo y contraste insuficiente, DEF-22). Va en
            <body> y no en <head>: herramientas como Cypress inyectan scripts en <head> y desalinean la hidratación. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        <AuthProvider>
          <ThemeProvider>
            <LanguageProvider>
              <SkipLink />
              {children}
              <ToastContainer />
            </LanguageProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
