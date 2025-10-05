import React from "react";
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full h-10 px-3 rounded-2xl border border-[#4B2E2B]/25 bg-white text-[#4B2E2B]
                 focus:outline-none focus:ring-2 focus:ring-[#4B2E2B]/40 focus:border-[#4B2E2B]/40
                 placeholder:text-[#4B2E2B]/40"
      {...props}
    />
  );
}