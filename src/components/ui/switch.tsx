import React from "react";
type Props = { checked: boolean; onCheckedChange: (v: boolean) => void; id?: string };
export function Switch({ checked, onCheckedChange, id }: Props) {
  return (
    <button
      id={id}
      onClick={() => onCheckedChange(!checked)}
      className={`w-12 h-7 rounded-full border transition px-1 ${
        checked ? "bg-[#4B2E2B] border-[#4B2E2B]" : "bg-[#D5BDA4]/60 border-[#4B2E2B]/20"
      }`}
      aria-pressed={checked}
    >
      <span className="block w-5 h-5 rounded-full bg-[#F4EFE8] shadow-[0_6px_20px_rgba(0,0,0,0.08)] transition
                      data-[on=true]:translate-x-5"
      style={{ transform: checked ? "translateX(20px)" : undefined }}
      />
    </button>
  );
}