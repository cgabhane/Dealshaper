import { Badge } from "@/components/ui/badge";

interface DealStatusBadgeProps {
  status?: string;
  className?: string;
}

export function DealStatusBadge({ status, className }: DealStatusBadgeProps) {
  if (!status) return null;

  const getStatusConfig = (s: string) => {
    switch (s.toLowerCase()) {
      case "draft":
        return { label: "Draft", variant: "secondary" as const };
      case "in_progress":
        return { label: "In Progress", variant: "default" as const };
      case "completed":
        return { label: "Completed", variant: "outline" as const };
      case "won":
        return { label: "Won", className: "bg-green-100 text-green-800 hover:bg-green-100/80 border-green-200" };
      case "lost":
        return { label: "Lost", variant: "destructive" as const };
      default:
        return { label: s, variant: "outline" as const };
    }
  };

  const config = getStatusConfig(status);

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
