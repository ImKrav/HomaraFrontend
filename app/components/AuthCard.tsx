import React from "react";

interface AuthCardProps {
  subtitle: string;
  errorMsg?: string;
  maxWidth?: "md" | "2xl";
  children: React.ReactNode;
}

export default function AuthCard({
  subtitle,
  errorMsg,
  maxWidth = "md",
  children,
}: AuthCardProps) {
  const maxWidthClass = maxWidth === "2xl" ? "max-w-2xl" : "max-w-md";

  return (
    <div className="min-h-[85vh] relative flex items-center justify-center px-4 py-16 overflow-hidden bg-bg-base">
      {/* Premium ambient glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary-light/5 blur-[120px] pointer-events-none" />

      <div className={`w-full ${maxWidthClass} animate-slide-up relative z-10`}>
        <div className="glass p-8 sm:p-10 rounded-none border border-border/40 shadow-2xl relative">
          {/* Decorative Orange Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 gradient-primary" />

          {/* Logo / Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight">
              <span className="gradient-text">Homara</span>
            </h1>
            <p className="text-sm text-text-secondary mt-2">
              {subtitle}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-none text-error text-sm flex items-center gap-2 animate-scale-in">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}
