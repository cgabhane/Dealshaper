import { useGetDealsSummary, getGetDealsSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DealStatusBadge } from "@/components/deals/deal-status-badge";
import { ComplexityBadge } from "@/components/deals/complexity-badge";
import { Link } from "wouter";
import { format } from "date-fns";
import { Briefcase, Server, AppWindow, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: summary, isLoading, error } = useGetDealsSummary({
    query: { queryKey: getGetDealsSummaryQueryKey() }
  });

  if (isLoading) {
    return <div className="p-8 flex justify-center text-muted-foreground">Loading dashboard...</div>;
  }

  if (error || !summary) {
    return <div className="p-8 text-destructive">Failed to load dashboard data.</div>;
  }

  const statCards = [
    {
      title: "Total Deals",
      value: summary.totalDeals,
      icon: Briefcase,
    },
    {
      title: "Total Workloads (VMs)",
      value: summary.totalVMs,
      icon: Server,
    },
    {
      title: "Total Applications",
      value: summary.totalApplications,
      icon: AppWindow,
    },
    {
      title: "Avg Complexity",
      value: summary.avgComplexity || "N/A",
      icon: Activity,
    }
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of your deal pipeline and shaping metrics.</p>
        </div>
        <Link href="/deals/new">
          <Button>Create New Deal</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
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
            <div className="space-y-4">
              {summary.recentDeals && summary.recentDeals.length > 0 ? (
                summary.recentDeals.map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-4 border rounded-md hover:bg-muted/50 transition-colors">
                    <div className="space-y-1">
                      <Link href={`/deals/${deal.id}`}>
                        <span className="font-medium hover:underline cursor-pointer">{deal.name}</span>
                      </Link>
                      <div className="text-sm text-muted-foreground flex items-center space-x-2">
                        <span>{deal.clientName}</span>
                        <span>&middot;</span>
                        <span>{format(new Date(deal.updatedAt || deal.createdAt), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <ComplexityBadge complexity={deal.complexity} />
                      <DealStatusBadge status={deal.status} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground py-4 text-center">No recent deals found.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline Status</CardTitle>
            <CardDescription>Breakdown of deals by current status.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(summary.byStatus || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DealStatusBadge status={status} />
                  </div>
                  <div className="font-medium">{count}</div>
                </div>
              ))}
              {Object.keys(summary.byStatus || {}).length === 0 && (
                <div className="text-sm text-muted-foreground py-4 text-center">No status data available.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
