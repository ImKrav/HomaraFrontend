"use client";

import React from "react";

interface AdminFeedbackStateProps {
  loading?: boolean;
  loadingMessage?: string;
  error?: string | null;
  errorTitle?: string;
}

export default function AdminFeedbackState({
  loading,
  loadingMessage,
  error,
  errorTitle,
}: Readonly<AdminFeedbackStateProps>) {
  if (loading) {
    return (
      <div className="p-8 text-center text-text-secondary">
        {loadingMessage}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-error">
        <p className="font-semibold">{errorTitle}</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return null;
}
