import { Badge } from "@/components/ui/badge";
import { YEAR } from "@/lib/constants";

export function YearBadge() {
  return (
    <Badge variant="secondary" className="text-sm">
      {YEAR}년 기준
    </Badge>
  );
}
