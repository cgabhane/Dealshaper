import { Badge } from "@/components/ui/badge";

interface ComplexityBadgeProps {
  complexity?: string;
  className?: string;
}

export function ComplexityBadge({ complexity, className }: ComplexityBadgeProps) {
  if (!complexity) return null;

  const getConfig = (c: string) => {
    switch (c.toLowerCase()) {
      case "low":
        return { label: "Low Complexity", className: "bg-blue-100 text-blue-800 hover:bg-blue-100/80 border-blue-200" };
      case "medium":
        return { label: "Medium Complexity", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80 border-yellow-200" };
      case "high":
        return { label: "High Complexity", className: "bg-red-100 text-red-800 hover:bg-red-100/80 border-red-200" };
      default:
        return { label: c, variant: "outline" as const };
    }
  };

  const config = getConfig(complexity);

  return (
    <Badge 
      variant={'variant' in config ? config.variant : "default"} 
      className={cn(className, 'className' in config ? config.className : "")}
    >
      {config.label}
    </Badge>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
