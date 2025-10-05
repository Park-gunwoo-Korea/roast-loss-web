import React from "react";
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "outline" | "ghost";
  size?: "default" | "icon";
};
export function Button({ className = "", variant = "default", size = "default", ...props }: Props) {
  const base = "inline-flex items-center justify-center font-medium rounded-2xl transition border";
  const variants = {
    default: "bg-[#4B2E2B] text-[#F4EFE8] border-[#4B2E2B] hover:opacity-90",
    secondary: "bg-[#D5BDA4] text-[#4B2E2B] border-[#D5BDA4]/60 hover:bg-[#D5BDA4]/90",
    outline: "bg-transparent text-[#4B2E2B] border-[#4B2E2B]/30 hover:bg-[#D5BDA4]/20",
    ghost: "bg-transparent text-[#4B2E2B] border-transparent hover:bg-[#D5BDA4]/20",
  } as const;
  const sizes = { default: "h-10 px-4", icon: "h-10 w-10 p-0" } as const;
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}