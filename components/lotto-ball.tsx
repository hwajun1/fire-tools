import { getBallColor } from "@/lib/lotto";

interface LottoBallProps {
  number: number;
  size?: "sm" | "md";
  className?: string;
}

export function LottoBall({ number, size = "md", className = "" }: LottoBallProps) {
  const color = getBallColor(number);
  const sizeClass = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold text-white ${sizeClass} ${className}`}
      style={{ backgroundColor: color }}
    >
      {number}
    </span>
  );
}
