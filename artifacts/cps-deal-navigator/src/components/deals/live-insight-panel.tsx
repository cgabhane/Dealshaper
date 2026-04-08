import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Target, Zap } from "lucide-react";
import { ComplexityBadge } from "./complexity-badge";

interface LiveInsightPanelProps {
  data: {
    complexityScore?: string;
    suggestedStrategy?: string;
    riskFlags?: string[];
    estimatedMigrationWeeks?: number;
    estimatedEffortDays?: number;
  };
  isLoading?: boolean;
}

export function LiveInsightPanel({ data, isLoading }: LiveInsightPanelProps) {
  if (isLoading) {
    return (
      <Card className="bg-muted/50 border-muted">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            <span className="text-sm font-medium">Generating insights...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data.suggestedStrategy && !data.complexityScore) {
    return (
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          Fill out deal details to see live estimation insights.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
      <CardHeader className="pb-3 bg-primary/5">
        <CardTitle className="text-sm font-semibold flex items-center">
          <Zap className="w-4 h-4 mr-2 text-primary" />
          Live Estimation Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Complexity</div>
            <ComplexityBadge complexity={data.complexityScore} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Timeline</div>
            <div className="font-medium text-sm">
              {data.estimatedMigrationWeeks ? `${data.estimatedMigrationWeeks} Weeks` : 'TBD'}
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground mb-1 flex items-center">
            <Target className="w-3 h-3 mr-1" /> Suggested Strategy
          </div>
          <div className="text-sm font-medium">
            {data.suggestedStrategy || 'Need more data to suggest strategy'}
          </div>
        </div>

        {data.riskFlags && data.riskFlags.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-2 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" /> Identified Risks
            </div>
            <ul className="space-y-1">
              {data.riskFlags.map((risk, i) => (
                <li key={i} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded border border-red-100 flex items-start">
                  <span className="mr-1 mt-0.5">•</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
