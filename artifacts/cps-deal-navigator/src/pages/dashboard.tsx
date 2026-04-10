import { useGetDealsSummary, getGetDealsSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DealStatusBadge } from "@/components/deals/deal-status-badge";
import { ComplexityBadge } from "@/components/deals/complexity-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { format } from "date-fns";
import { Briefcase, Server, AppWindow, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function DashboardSkeleton() {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading, error } = useGetDealsSummary({
    query: { queryKey: getGetDealsSummaryQueryKey() },
  });

  if (isLoading) return <DashboardSkeleton />;

  if (error || !summary) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load dashboard data. Ensure the API server is running.
        </div>
      </div>
    );
  }

  const statCards = [
    { title: "Total Deals", value: summary.totalDeals, icon: Briefcase },
    { title: "Total Workloads", value: summary.totalVMs, icon: Server },
    { title: "Total Applications", value: summary.totalApplications, icon: AppWindow },
    { title: "Avg Complexity", value: summary.avgComplexity || "N/A", icon: TrendingUp },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pipeline overview — deal shaping metrics across the team.
          </p>
        </div>
        <Link href="/deals/new">
          <Button size="sm">Create New Deal</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Deals</CardTitle>
            <CardDescription>Latest deal shaping activity across the team.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.recentDeals && summary.recentDeals.length > 0 ? (
                summary.recentDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/40 transition-colors"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <Link href={`/deals/${deal.id}`}>
                        <span className="font-medium text-sm hover:underline cursor-pointer truncate block">
                          {deal.name}
                        </span>
                      </Link>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <span>{deal.clientName}</span>
                        <span>·</span>
                        <span>
                          {format(new Date(deal.updatedAt || deal.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <ComplexityBadge complexity={deal.complexity} />
                      <DealStatusBadge status={deal.status} />
                      <Link href={`/deals/${deal.id}`}>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground py-6 text-center border border-dashed rounded-md bg-muted/5">
                  No deals yet.{" "}
                  <Link href="/deals/new">
                    <span className="text-primary underline cursor-pointer">Create your first deal</span>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline Status</CardTitle>
            <CardDescription>Deals by current stage.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(summary.byStatus || {}).length > 0 ? (
                Object.entries(summary.byStatus || {}).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <DealStatusBadge status={status} />
                    <span className="font-semibold tabular-nums">{count}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  No deals in pipeline yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
