import React from "react";
export function Label({ className = "", ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={`text-sm text-[#4B2E2B]/70 ${className}`} {...props} />;
}