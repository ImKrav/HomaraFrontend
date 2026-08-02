import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/app/context/AuthContext";
import { ThemeProvider } from "@/app/context/ThemeContext";
import { LanguageProvider } from "@/app/context/LanguageContext";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${plusJakartaSans.variable} font-sans h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg-base text-text-primary transition-colors duration-200">
        <AuthProvider>
          <ThemeProvider>
            <LanguageProvider>
              {children}
              <ToastContainer />
            </LanguageProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
