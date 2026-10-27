"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/app/context/LanguageContext";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
  initialValue?: string;
}

export default function SearchBar({
  placeholder,
  onSearch,
  className = "",
  initialValue = "",
}: Readonly<SearchBarProps>) {
  const { t } = useLanguage();
  const [query, setQuery] = useState(initialValue);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    onSearch?.(query);
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <svg aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || t("catalog.search_placeholder")}
          aria-label={placeholder || t("catalog.search_placeholder")}
          className="w-full bg-bg-surface-light border border-border-strong rounded-none pl-12 pr-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary transition-colors duration-150"
          id="search-bar"
        />
      </div>
    </form>
  );
}
