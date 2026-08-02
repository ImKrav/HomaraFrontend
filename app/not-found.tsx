"use client";

import Link from "next/link";
import React from "react";

export default function NotFound() {
  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden bg-bg-base text-text-primary">
      {/* Premium ambient glows */}
      <div className="absolute top-[10%] left-[10%] w-[400px] h-[400px] rounded-full bg-primary/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full bg-primary-light/10 blur-[130px] pointer-events-none" />

      {/* Grid overlay for structural construction theme */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(to_right,#888_1px,transparent_1px),linear-gradient(to_bottom,#888_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="w-full max-w-lg text-center relative z-10 animate-scale-in">
        <div className="glass p-8 sm:p-12 border border-border/40 shadow-2xl relative">
          
          {/* Decorative Orange Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 gradient-primary" />

          {/* Large 404 Indicator */}
          <div className="text-8xl font-black tracking-widest text-primary mb-4 select-none animate-pulse">
            404
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight mb-3">
            Plano Fuera de Rango
          </h1>
          
          <p className="text-sm text-text-secondary leading-relaxed max-w-sm mx-auto mb-8 font-medium">
            La coordenada o página que estás buscando no existe en nuestra base de datos de materiales o ha sido reubicada.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/"
              className="px-6 py-3 bg-primary hover:bg-primary-light text-bg-base text-xs font-bold uppercase tracking-wider transition-colors duration-200 text-center shadow-md shadow-primary/20"
            >
              Volver al Inicio
            </Link>
            <Link 
              href="/catalogo"
              className="px-6 py-3 border border-border hover:border-primary text-text-secondary hover:text-text-primary text-xs font-bold uppercase tracking-wider bg-bg-surface-light/35 transition-all duration-200 text-center"
            >
              Ver Catálogo Técnico
            </Link>
          </div>

          {/* Blueprint-style coordinates at the bottom */}
          <div className="mt-8 pt-6 border-t border-border/30 text-[10px] font-mono text-text-muted select-none flex justify-between">
            <span>ERR: PAGE_NOT_FOUND</span>
            <span>COORD: X=404 Y=NULL</span>
          </div>

        </div>
      </div>
    </div>
  );
}
