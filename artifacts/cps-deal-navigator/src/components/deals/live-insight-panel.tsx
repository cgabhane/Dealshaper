import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Target, BarChart2, CheckCircle2 } from "lucide-react";
import { ComplexityBadge } from "./complexity-badge";

interface LiveInsightPanelProps {
  data: {
    complexityScore?: string;
    suggestedStrategy?: string;
    riskFlags?: string[];
    estimatedMigrationWeeks?: number;
    estimatedEffortDays?: number;
    costIndicatorMin?: number;
    costIndicatorMax?: number;
  };
  isLoading?: boolean;
}

export function LiveInsightPanel({ data, isLoading }: LiveInsightPanelProps) {
  if (isLoading) {
    return (
      <Card className="overflow-hidden shadow-sm">
        <div className="bg-primary px-5 py-4">
          <div className="flex items-center gap-2 text-white">
            <BarChart2 className="w-4 h-4" />
            <span className="font-semibold text-sm tracking-wide">Live Insight Panel</span>
          </div>
        </div>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            Generating insights…
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data.suggestedStrategy && !data.complexityScore) {
    return (
      <Card className="overflow-hidden shadow-sm">
        <div className="bg-primary px-5 py-4">
          <div className="flex items-center gap-2 text-white">
            <BarChart2 className="w-4 h-4" />
            <span className="font-semibold text-sm tracking-wide">Live Insight Panel</span>
          </div>
        </div>
        <CardContent className="p-5">
          <p className="text-xs text-muted-foreground italic">
            Insights update in real-time as you refine the client discovery data.
          </p>
        </CardContent>
      </Card>
    );
  }

  const riskCount = data.riskFlags?.length ?? 0;

  return (
    <Card className="overflow-hidden shadow-sm">
      {/* Magenta header — matches company design */}
      <div className="bg-primary px-5 py-4">
        <div className="flex items-center gap-2 text-white">
          <BarChart2 className="w-4 h-4" />
          <span className="font-semibold text-sm tracking-wide">Live Insight Panel</span>
        </div>
      </div>

      <CardContent className="p-5 space-y-5">
        {/* Complexity */}
        <div>
          <div className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-1">
            Estimated Complexity
          </div>
          <div className="text-xl font-bold capitalize text-foreground">
            {data.complexityScore ?? "—"}
          </div>
        </div>

        {/* Suggested strategy */}
        <div>
          <div className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-1">
            Suggested Strategy
          </div>
          <div className="text-base font-bold text-primary">
            {data.suggestedStrategy ?? "—"}
          </div>
        </div>

        {/* Timeline & Effort */}
        {(data.estimatedMigrationWeeks || data.estimatedEffortDays) && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/40 rounded-md p-3">
              <div className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-0.5">
                Timeline
              </div>
              <div className="font-bold text-sm">{data.estimatedMigrationWeeks ?? 0} wks</div>
            </div>
            <div className="bg-muted/40 rounded-md p-3">
              <div className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-0.5">
                Effort
              </div>
              <div className="font-bold text-sm">{data.estimatedEffortDays ?? 0} days</div>
            </div>
          </div>
        )}

        {/* Cost range */}
        {data.costIndicatorMin != null && data.costIndicatorMax != null && (
          <div className="bg-primary/5 border border-primary/20 rounded-md p-3">
            <div className="text-[10px] font-semibold tracking-widest text-primary uppercase mb-0.5">
              Indicative Cost
            </div>
            <div className="font-bold text-sm text-foreground">
              ${(data.costIndicatorMin / 1000).toFixed(0)}k – ${(data.costIndicatorMax / 1000).toFixed(0)}k
            </div>
          </div>
        )}

        {/* Risk flags */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Risk Flags & Actions
            </div>
            <span className={cn("text-xs font-semibold", riskCount > 0 ? "text-destructive" : "text-green-600")}>
              {riskCount > 0 ? `${riskCount} Detected` : "0 Detected"}
            </span>
          </div>

          {riskCount > 0 ? (
            <ul className="space-y-1.5">
              {data.riskFlags!.map((risk, i) => (
                <li
                  key={i}
                  className="text-xs bg-red-50 text-red-700 px-3 py-2 rounded border border-red-100 flex items-start gap-1.5"
                >
                  <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center py-4 text-center text-muted-foreground">
              <CheckCircle2 className="w-6 h-6 mb-1 text-green-400" />
              <div className="text-xs">No critical risks identified yet.</div>
            </div>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground italic">
          Insights update in real-time as you refine the client discovery data.
        </p>
      </CardContent>
    </Card>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
