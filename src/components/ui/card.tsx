import React from "react";

export function Card({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-[#F4EFE8] border border-[#4B2E2B]/15 rounded-2xl shadow-[0_6px_20px_rgba(0,0,0,0.08)] ${className}`}
      {...props}
    />
  );
}
export function CardContent({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-4 ${className}`} {...props} />;
}