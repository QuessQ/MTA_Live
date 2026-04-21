import type { SubwayLine } from "@/data/lines";
import { lineColor, lineTextColor } from "@/data/lines";

interface Props {
  line: SubwayLine;
  size?: "sm" | "md" | "lg";
}

const sizeClass = {
  sm: "h-5 w-5 text-[11px]",
  md: "h-7 w-7 text-sm",
  lg: "h-10 w-10 text-lg",
};

export function LineBullet({ line, size = "md" }: Props) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-mono font-bold tracking-tight no-select ${sizeClass[size]}`}
      style={{
        backgroundColor: lineColor[line],
        color: lineTextColor[line],
      }}
      aria-label={`Line ${line}`}
    >
      {line}
    </span>
  );
}
